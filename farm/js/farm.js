/* ================= 农田(作物)逻辑 ================= */
const farmComputed = {
    plotHasCrop() { return !!this.plots[this.menuPlot]; }, // !! 使 undefined(menuPlot=-1) 与 null 都判为空
    menuWaterEnabled() { const p = this.plots[this.menuPlot]; return !!p && p.dry; },
    menuHarvestEnabled() { const p = this.plots[this.menuPlot]; return !!p && this.plotProgress(this.menuPlot) >= 1; },
};

const farmMethods = {
    /* ---------- 地块进度 ---------- */
    plotProgress(i) {
        const p = this.plots[i];
        if (!p) return 0;
        const total = CROPS[p.type].grow * 1000;
        const grown = p.accrued + (p.dry ? 0 : Math.max(0, this.now - p.resumedAt));
        return Math.min(1, grown / total);
    },
    plotPercent(i) { return Math.floor(this.plotProgress(i) * 100); },
    plotRemainSec(i) {
        const p = this.plots[i];
        if (!p) return 0;
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
    kindLabel(key) { return KIND_LABEL[key]; },
    kindCls(key) { return KIND_CLS[key]; },
    /* 读取 data.js 中的静态解锁数据 */
    seedLevelReq(key) { return CROPS[key].level; },
    plotLevelReq(i) { return PLOT_LEVEL_REQ[i]; },
    plotUnlockCost(i) { return PLOT_UNLOCK_COST[i]; },

    /* ---------- 地块渲染辅助 ---------- */
    plotClass(i) {
        if (!this.unlockedPlots[i]) return 'plot locked';
        const p = this.plots[i];
        if (p === null) return 'plot empty';
        const cls = p.dry ? 'dry' : (this.plotProgress(i) >= 1 ? 'mature' : 'growing');
        return 'plot ' + cls;
    },
    plotTitle(i) {
        if (!this.unlockedPlots[i]) return '点击查看解锁条件';
        const p = this.plots[i];
        if (p === null) return '点击种植';
        return this.plotProgress(i) >= 1 ? '点击收获' : '';
    },
    onPlotClick(i, e) {
        if (!this.unlockedPlots[i]) { this.openUnlockModal(i); return; }
        const p = this.plots[i];
        if (p === null) {
            // 空地:直接出种子列表(隐藏返回按钮)
            this.openPlotMenu(i, e);
            this.menuView = 'plant';
            this.menuDirect = true;
            return;
        }
        if (this.plotProgress(i) >= 1) {
            // 成熟:直接收获
            this.harvest(i);
            return;
        }
        // 生长中:只保留铲除(缺水时附加浇水)
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
        // 随机干旱事件:种植时掷骰,在生长的 30%~80% 时刻触发(雇佣期间不缺水,不预约干旱)
        const willDrought = this.hired ? false : Math.random() < DROUGHT_CHANCE;
        const droughtAt = willDrought ? now + c.grow * 1000 * (0.3 + Math.random() * 0.5) : null;
        this.$set(this.plots, i, {
            type: key,
            accrued: 0,
            resumedAt: now,
            dry: false,
            droughtAt: droughtAt,
            announced: false,
        });
        this.addXp(1);
        this.addLog('种下了 ' + c.name + (willDrought ? '(这颗可能遭遇干旱)' : '') + ' +1 经验');
        this.hideContextMenu();
        this.save();
    },
    water(i) {
        const p = this.plots[i];
        if (!p || !p.dry) return;
        p.dry = false;
        p.resumedAt = Date.now();
        this.hideContextMenu();
        this.addLog(CROPS[p.type].name + ' 浇过水了,恢复生长');
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
        const prodItem = CROPS[prod] || ANIMAL_PRODUCTS[prod];
        const prodName = prodItem ? prodItem.name : prod;
        this.$set(this.inventory.items, prod, (this.inventory.items[prod] || 0) + 1);
        this.$set(this.plots, i, null);
        this.addLog('收获 ' + prodName + ' x1,已放入仓库 +' + c.xp + ' 经验');
        this.addXp(c.xp);
        if (Math.random() < SEED_DROP_CHANCE) {
            this.$set(this.inventory.seeds, type, (this.inventory.seeds[type] || 0) + 1);
            this.addLog('掉落种子!获得 ' + c.name + ' 种子 x1');
        }
        this.save();
    },
    harvestAll() {
        let n = 0, xp = 0, seeds = 0;
        this.plots.forEach((p, i) => {
            if (p && this.plotProgress(i) >= 1) {
                const type = p.type;
                const prod = CROPS[type].product || type;
                this.$set(this.inventory.items, prod, (this.inventory.items[prod] || 0) + 1);
                this.$set(this.plots, i, null);
                n++;
                xp += CROPS[type].xp;
                if (Math.random() < SEED_DROP_CHANCE) {
                    this.$set(this.inventory.seeds, type, (this.inventory.seeds[type] || 0) + 1);
                    seeds++;
                }
            }
        });
        if (n > 0) {
            this.addLog('一键收获 ' + n + ' 株,已放入仓库 +' + xp + ' 经验' + (seeds > 0 ? ',掉落 ' + seeds + ' 颗种子' : ''));
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
};
