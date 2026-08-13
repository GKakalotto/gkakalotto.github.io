/* ================= 农田(作物)逻辑 ================= */
const farmComputed = {
    plotEmpty() { return !this.plots[this.menuPlot]; }, // 地块为空(null),可种植
    plotHasCrop() { const p = this.plots[this.menuPlot]; return !!p && !!p.type; }, // 有作物(干枯地块不算)
    menuWaterEnabled() { const p = this.plots[this.menuPlot]; return !!p && this.isDryPlot(p); },
    menuHarvestEnabled() { const p = this.plots[this.menuPlot]; return !!p && this.plotProgress(this.menuPlot) >= 1; },
};

const farmMethods = {
    /* 判断地块是否为干枯标记(收获后随机干枯,无作物) */
    isDryPlot(p) { return !!p && !p.type && !!p.dry; },

    /* ---------- 地块进度 ---------- */
    plotProgress(i) {
        const p = this.plots[i];
        if (!p || this.isDryPlot(p)) return 0;
        const total = CROPS[p.type].grow * 1000;
        const grown = p.accrued + Math.max(0, this.now - p.resumedAt);
        return Math.min(1, grown / total);
    },
    plotPercent(i) { return Math.floor(this.plotProgress(i) * 100); },
    plotRemainSec(i) {
        const p = this.plots[i];
        if (!p || this.isDryPlot(p)) return 0;
        return Math.max(0, Math.ceil(CROPS[p.type].grow - this.plotProgress(i) * CROPS[p.type].grow));
    },
    stageText(i) {
        const pr = this.plotProgress(i);
        if (pr >= 1) return '已成熟';
        if (pr < 0.35) return '幼苗';
        if (pr < 0.7) return '生长中';
        return '快成熟';
    },
    cropName(key) { return CROPS[key].name; },
    /* 读取 data.js 中的静态解锁数据 */
    seedLevelReq(key) { return CROPS[key].level; },
    plotLevelReq(i) { return PLOT_LEVEL_REQ[i]; },
    plotUnlockCost(i) { return PLOT_UNLOCK_COST[i]; },

    /* ---------- 地块渲染辅助 ---------- */
    plotClass(i) {
        if (!this.unlockedPlots[i]) {
            return (i > 0 && !this.unlockedPlots[i - 1]) ? 'plot locked disabled' : 'plot locked';
        }
        const p = this.plots[i];
        if (p === null) return 'plot empty';
        if (this.isDryPlot(p)) return 'plot dry';
        const cls = this.plotProgress(i) >= 1 ? 'mature' : 'growing';
        return 'plot ' + cls;
    },
    plotTitle(i) {
        if (!this.unlockedPlots[i]) {
            return '';
        }
        const p = this.plots[i];
        if (p === null) return '点击种植';
        if (this.isDryPlot(p)) return '点击浇水';
        return this.plotProgress(i) >= 1 ? '点击收获' : '';
    },
    onPlotClick(i, e) {
        if (!this.unlockedPlots[i]) {
            if (i > 0 && !this.unlockedPlots[i - 1]) return;
            this.openUnlockModal(i); return;
        }
        const p = this.plots[i];
        if (p === null) {
            // 空地:直接出种子列表(隐藏返回按钮)
            this.openPlotMenu(i, e);
            this.menuView = 'plant';
            this.menuDirect = true;
            return;
        }
        if (this.isDryPlot(p)) {
            // 干枯地块:直接浇水
            this.water(i);
            return;
        }
        if (this.plotProgress(i) >= 1) {
            // 成熟:直接收获
            this.harvest(i);
            return;
        }
        // 生长中:只保留铲除
        this.openPlotMenu(i, e);
    },

    /* ---------- 地块右键菜单 ---------- */
    openPlotMenu(i, e) {
        this.menuTarget = 'plot';
        this.menuPlot = i;
        this.menuX = e.clientX;
        this.menuY = e.clientY;
        this.menuView = 'main';
        this.menuDirect = false;
        this.menuVisible = true;
    },

    /* ---------- 种植/浇水/收获 ---------- */
    doPlant(i, key) {
        const p = this.plots[i];
        if (this.isDryPlot(p)) {
            this.addLog('这块地干枯了,请先浇水再种植');
            this.hideContextMenu();
            this.save();
            return;
        }
        const seeds = this.inventory.seeds[key];
        if (!seeds || seeds <= 0) {
            this.addLog('没有 ' + CROPS[key].name + ' 种子');
            this.hideContextMenu();
            this.save();
            return;
        }
        this.inventory.seeds[key]--;
        if (this.inventory.seeds[key] <= 0) this.$delete(this.inventory.seeds, key);
        const c = CROPS[key];
        const now = Date.now();
        this.$set(this.plots, i, {
            type: key,
            accrued: 0,
            resumedAt: now,
            announced: false,
        });
        this.addLog('种下了 ' + c.name);
        this.hideContextMenu();
        this.save();
    },
    water(i) {
        const p = this.plots[i];
        if (!p || !this.isDryPlot(p)) return;
        this.$set(this.plots, i, null); // 浇水后恢复为可种植的空地
        this.hideContextMenu();
        this.addLog('第 ' + (i + 1) + ' 块地浇过水了,可以种植');
        this.save();
    },
    harvest(i) {
        const p = this.plots[i];
        if (!p) return;
        const c = CROPS[p.type];
        if (this.plotProgress(i) < 1) {
            this.addLog(c.name + ' 还没成熟');
            this.save();
            return;
        }
        this.hideContextMenu();
        const type = p.type;
        const prod = CROPS[type].product || type; // 收获物 key(草籽等特殊作物产出别的物品)
        const prodName = this.itemName(prod);
        const gain = harvestXp(c.xp, c.level);
        this.$set(this.inventory.items, prod, (this.inventory.items[prod] || 0) + 1);
        // 收获后地块有 10% 概率干枯,干枯的地需浇水后才能种植
        if (Math.random() < PLOT_DRY_CHANCE) {
            this.$set(this.plots, i, { dry: true });
            this.addLog('收获 ' + prodName + ' x1,已放入仓库 +' + gain + ' 经验,但土地干枯了,浇水后才能种植');
        } else {
            this.$set(this.plots, i, null);
            this.addLog('收获 ' + prodName + ' x1,已放入仓库 +' + gain + ' 经验');
        }
        this.addXp(gain);
        if (Math.random() < SEED_DROP_CHANCE) {
            this.$set(this.inventory.seeds, type, (this.inventory.seeds[type] || 0) + 1);
            this.addLog('掉落种子!获得 ' + c.name + ' 种子 x1');
        }
        this.save();
    },
    harvestAll() {
        let n = 0, xp = 0, seeds = 0, dry = 0;
        this.plots.forEach((p, i) => {
            if (p && this.plotProgress(i) >= 1) {
                const type = p.type;
                const prod = CROPS[type].product || type;
                this.$set(this.inventory.items, prod, (this.inventory.items[prod] || 0) + 1);
                if (Math.random() < PLOT_DRY_CHANCE) {
                    this.$set(this.plots, i, { dry: true });
                    dry++;
                } else {
                    this.$set(this.plots, i, null);
                }
                n++;
                xp += harvestXp(CROPS[type].xp, CROPS[type].level); // 收获奖励:1-2 级 5 倍,3 级起 +10
                if (Math.random() < SEED_DROP_CHANCE) {
                    this.$set(this.inventory.seeds, type, (this.inventory.seeds[type] || 0) + 1);
                    seeds++;
                }
            }
        });
        if (n > 0) {
            this.addLog('一键收获 ' + n + ' 株,已放入仓库 +' + xp + ' 经验'
                + (seeds > 0 ? ',掉落 ' + seeds + ' 颗种子' : '')
                + (dry > 0 ? ',有 ' + dry + ' 块地干枯需浇水' : ''));
            this.addXp(xp);
        } else {
            this.addLog('没有可收获的作物');
        }
        this.save();
    },
    doClear(i) {
        const p = this.plots[i];
        if (!p) return;
        this.$set(this.plots, i, null);
        this.hideContextMenu();
        this.addLog('铲除了第 ' + (i + 1) + ' 块地的' + CROPS[p.type].name);
        this.save();
    },

    /* ---------- 解锁土地 ---------- */
    openUnlockModal(i) {
        this.hideContextMenu();
        this.modalPlot = i;
        this.modalMode = 'unlock';
        this.modalTitle = '解锁土地(第 ' + (i + 1) + ' 块)';
    },
    unlockOk(i) {
        return this.level >= this.plotLevelReq(i) && this.coins >= this.plotUnlockCost(i);
    },
    doUnlock(i) {
        const req = this.plotLevelReq(i);
        const cost = this.plotUnlockCost(i);
        if (this.level < req) { this.addLog('等级不足,需要 Lv.' + req + ' 才能解锁这块地'); }
        else if (this.coins < cost) { this.addLog('金币不足,解锁需要 ' + cost + ' 金币'); }
        else {
            this.coins -= cost;
            this.$set(this.unlockedPlots, i, true);
            this.addLog('解锁了第 ' + (i + 1) + ' 块地');
        }
        this.closeModal();
        this.save();
    },


/* ---------- 商店:作物种子(农场专属) ---------- */
buySeed(key) {
    const c = CROPS[key];
    const qty = this.qtyFor('shop', key);
    if (qty <= 0) { this.addLog('请先选择购买数量'); this.save(); return; }
    const total = c.cost * qty;
    if (this.coins < total) {
        this.addLog('金币不足,需要 ' + total + ' 金币');
    } else {
        this.coins -= total;
        this.$set(this.inventory.seeds, key, (this.inventory.seeds[key] || 0) + qty);
        this.addLog('购买了 ' + c.name + ' 种子 x' + qty);
        this.closeShopDetail();
    }
    this.save();
},
sellSeed(key) {
    const qty = Math.min(this.qtyFor('warehouseSeeds', key), this.inventory.seeds[key] || 0);
    if (qty <= 0) return;
    const price = this.seedSellPrice(key);
    this.inventory.seeds[key] -= qty;
    if (this.inventory.seeds[key] <= 0) this.$delete(this.inventory.seeds, key);
    this.coins += price * qty;
    this.addLog('回收 ' + CROPS[key].name + ' 种子 x' + qty + ',获得 ' + (price * qty) + ' 金币');
    this.closeInvDetail();
    this.save();
},

/* ---------- 每秒检查:成熟提醒(由 app.js 的 tick 调用) ---------- */
checkMature() {
    let hit = false;
    this.plots.forEach((p, i) => {
        if (p && !p.announced && this.plotProgress(i) >= 1) {
            p.announced = true;
            this.addLog(CROPS[p.type].name + ' 已成熟,快来收菜!');
            hit = true;
        }
    });
    if (hit) this.save();
},
};
