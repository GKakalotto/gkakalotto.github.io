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
    /* 当前季生长时长:有 regrow 的作物第一季(harvested=0)用 grow,第二季(harvested=1)用 regrow */
    plotSeasonGrow(p) {
        const c = CROPS[p.type];
        return (c.regrow && p.harvested) ? c.regrow : c.grow;
    },
    plotProgress(i) {
        const p = this.plots[i];
        if (!p || this.isDryPlot(p)) return 0;
        // 已种植时长 × 当前等级速率 ÷ 基准生长时长(黄土地速率=1);等级越高速率越快
        const total = this.plotSeasonGrow(p) * 1000;
        const grown = Math.max(0, this.now - p.resumedAt) * this.plotGrowMult(i);
        return Math.min(1, grown / total);
    },
    plotPercent(i) { return Math.floor(this.plotProgress(i) * 100); },
    plotRemainSec(i) {
        const p = this.plots[i];
        if (!p || this.isDryPlot(p)) return 0;
        const grow = this.plotSeasonGrow(p) / this.plotGrowMult(i);
        return Math.max(0, Math.ceil(grow - this.plotProgress(i) * grow));
    },
    /* 是否处于生长动效中:有作物、未干枯、尚未成熟(第二季生长中也算) */
    plotHasActiveGrowth(i) {
        const p = this.plots[i];
        return !!p && !this.isDryPlot(p) && this.plotProgress(i) < 1;
    },
    /* 生长阶段图标:随进度在 幼苗→生长中→成熟 间切换(🌱🌿🌾);第二季已是成熟株,始终显示 🌾 */
    plotStageIcon(i) {
        const p = this.plots[i];
        if (p && p.harvested) return '🌾';
        const pr = this.plotProgress(i);
        if (pr < 0.35) return '🌱';
        if (pr < 0.7) return '🌿';
        return '🌾';
    },
    cropName(key) { return CROPS[key].name; },
    /* 确定性伪随机:同一地块每次渲染得到相同随机布局(不抖动),不同地块各异 */
    seededRand(seed) {
        let s = (seed * 9301 + 49297) % 233280;
        return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    },
    /* 为生长中地块生成随机粒子:横向位置/大小/上升时长/相位/左右漂移均随机 → 真随机非周期排布
       (调用方已由 plotHasActiveGrowth 保证仅生长中地块渲染,无需再判条件) */
    plotParticles(i) {
        const rnd = this.seededRand(i * 137 + 11);
        const arr = [];
        const n = 36;
        for (let k = 0; k < n; k++) {
            arr.push({
                left: (rnd() * 92 + 4).toFixed(2) + '%',   // 4%~96% 横向随机
                sz:   (1.1 + rnd() * 1.8).toFixed(2) + 'px', // 1.1~2.9px 随机大小
                dur:  (4.5 + rnd() * 3.5).toFixed(2) + 's',  // 4.5~8.0s 随机速度(更慢)
                dl:   (-rnd() * 5).toFixed(2) + 's',         // 0~-5s 随机相位
                dr:   (rnd() * 10 - 5).toFixed(1) + 'px',    // ±5px 随机左右漂移
            });
        }
        return arr;
    },
    /* 读取 data.js 中的静态扩建数据 */
    seedLevelReq(key) { return CROPS[key].level; },
    plotLevelReq(i) { return PLOT_LEVEL_REQ[i]; },
    plotUnlockCost(i) { return PLOT_UNLOCK_COST[i]; },

    /* ---------- 土地分级查询 ---------- */
    plotGradeName(i) { return PLOT_GRADE_NAME[this.plotGrade[i]]; },
    plotYieldMult(i) { return PLOT_GRADE_YIELD[this.plotGrade[i]]; },
    plotGrowMult(i) { return PLOT_GRADE_GROW[this.plotGrade[i]]; },
    plotXpMult(i) { return PLOT_GRADE_XP[this.plotGrade[i]]; },
    plotNextGrade(i) { return this.plotGrade[i] < 3 ? this.plotGrade[i] + 1 : null; },
    plotNextGradeName(i) { const g = this.plotNextGrade(i); return g !== null ? PLOT_GRADE_NAME[g] : ''; },
    /* 增益百分比:当前等级 / 升级后等级(相对黄土地基准) */
    plotYieldPct(i) { return Math.round((PLOT_GRADE_YIELD[this.plotGrade[i]] - 1) * 100); },
    plotNextYieldPct(i) { const g = this.plotNextGrade(i); return g !== null ? Math.round((PLOT_GRADE_YIELD[g] - 1) * 100) : 0; },
    plotGrowPct(i) { return Math.round((1 - 1 / PLOT_GRADE_GROW[this.plotGrade[i]]) * 100); },
    plotNextGrowPct(i) { const g = this.plotNextGrade(i); return g !== null ? Math.round((1 - 1 / PLOT_GRADE_GROW[g]) * 100) : 0; },
    plotXpPct(i) { return Math.round((PLOT_GRADE_XP[this.plotGrade[i]] - 1) * 100); },
    plotNextXpPct(i) { const g = this.plotNextGrade(i); return g !== null ? Math.round((PLOT_GRADE_XP[g] - 1) * 100) : 0; },
    plotUpgradeReq(i) { return this.plotGrade[i] < 3 ? PLOT_UPGRADE[i][this.plotGrade[i]] : null; },
    plotUpgradeOk(i) {
        const req = this.plotUpgradeReq(i);
        return !!req && this.level >= req.level && this.coins >= req.cost;
    },
    plotUpgradable(i) {
        // 仅"已解锁的空地且未满级"可升级(升级只允许空地)
        return this.unlockedPlots[i] && this.plots[i] === null && this.plotGrade[i] < 3;
    },

    /* ---------- 地块渲染辅助 ---------- */
    plotClass(i) {
        // 升级模式下,不能升级的地块按"锁定禁用"样式显示(纯色蒙版,禁止点击)
        if (this.upgradeSelecting && !this.plotUpgradable(i)) {
            return 'plot locked disabled';
        }
        if (!this.unlockedPlots[i]) {
            return (i > 0 && !this.unlockedPlots[i - 1]) ? 'plot locked disabled' : 'plot locked';
        }
        const g = ' grade-' + this.plotGrade[i];
        const p = this.plots[i];
        if (p === null) return 'plot empty' + g;
        if (this.isDryPlot(p)) return 'plot dry' + g;
        // 第二季:已是成熟株,按成熟地块显示(橙色背景、无生长粒子)
        const mature = this.plotProgress(i) >= 1 || p.harvested;
        const cls = mature ? 'mature' : 'growing';
        return 'plot ' + cls + g;
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
        if (this.upgradeSelecting) {
            // 仅空地可升级;不能升级的已被蒙版盖住,点击无效
            if (this.plotUpgradable(i)) {
                this.upgradeSelecting = false;
                this.openUpgradeModal(i);
            }
            return;
        }
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
        this.showContextMenu();
    },

    /* ---------- 种植/浇水/收获 ---------- */
    doPlant(i, key) {
        if (!CROPS[key]) return;
        const p = this.plots[i];
        if (p && !this.isDryPlot(p)) {
            this.addLog('这块地已有作物');
            this.hideContextMenu();
            return;
        }
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
        this.$set(this.plots, i, {
            type: key,
            resumedAt: Date.now(),
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
    /* 收获单个地块的公共效果:入仓、第二季/干枯/释放、种子掉落。
       经验不在此处累加(否则日志顺序/重复难控),改为返回 gain 由调用方在打印收获日志后再 addXp */
    doHarvestPlot(p, i) {
        const type = p.type;
        const c = CROPS[type];
        const prod = c.product || type;
        const qty = this.plotYieldMult(i);
        this.$set(this.inventory.items, prod, (this.inventory.items[prod] || 0) + qty);
        // 经验:先乘土地倍率(金土地 +20%),3 级起最后 +10;1-2 级为基础 5 倍
        // flatXp(隐藏种子)只取自身 xp,不走上述额外加成
        const gain = c.flatXp
            ? c.xp
            : (c.level < 3
                ? Math.round(c.xp * 5 * this.plotXpMult(i))
                : Math.round(c.xp * this.plotXpMult(i)) + 10);
        const regrow = !!c.regrow && !p.harvested; // 第一季收获,进入第二季生长(不干枯)
        let dry = false;
        if (regrow) {
            this.$set(this.plots, i, { type: type, resumedAt: Date.now(), announced: false, harvested: 1 });
        } else if (Math.random() < PLOT_DRY_CHANCE) {
            // 收获后地块有 10% 概率干枯,干枯的地需浇水后才能种植
            this.$set(this.plots, i, { dry: true });
            dry = true;
        } else {
            this.$set(this.plots, i, null);
        }
        let seed = false;
        if (Math.random() < SEED_DROP_CHANCE) {
            this.$set(this.inventory.seeds, type, (this.inventory.seeds[type] || 0) + 1);
            seed = true;
        }
        // 隐藏种子:每次收获最多掉落 1 种(各 1% 概率,但互斥,不会同时掉两种),仅供掉落获取
        const bonus = [];
        for (const k of HIDDEN_SEEDS) {
            if (Math.random() < HIDDEN_SEED_DROP_CHANCE) {
                this.$set(this.inventory.seeds, k, (this.inventory.seeds[k] || 0) + 1);
                bonus.push(k);
                break; // 命中一种即止,保证每次只掉一种
            }
        }
        return { prodName: this.itemName(prod), qty: qty, gain: gain, regrow: regrow, dry: dry, seed: seed, bonus: bonus };
    },
    /* 把掉落种子 key 列表(可能含重复)聚合成 "名称 种子 xN",多种用 、 连接 */
    bonusSeedText(keys) {
        const counts = {};
        keys.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
        return Object.keys(counts).map((k) => this.cropName(k) + ' 种子 x' + counts[k]).join('、');
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
        const r = this.doHarvestPlot(p, i);
        if (r.regrow) {
            this.addLog('收获 ' + r.prodName + ' x' + r.qty + ',已放入仓库 +' + r.gain + ' 经验,' + c.name + ' 继续生长第2季');
        } else if (r.dry) {
            this.addLog('收获 ' + r.prodName + ' x' + r.qty + ',已放入仓库 +' + r.gain + ' 经验,但土地干枯了,浇水后才能种植');
        } else {
            this.addLog('收获 ' + r.prodName + ' x' + r.qty + ',已放入仓库 +' + r.gain + ' 经验');
        }
        this.addXp(r.gain); // 先打印收获日志,再加经验(升级日志自然排在收获之后)
        if (r.seed) this.addLog('掉落种子!获得 ' + c.name + ' 种子 x1');
        if (r.bonus.length) this.addLog('惊喜掉落:获得 ' + this.bonusSeedText(r.bonus));
        this.save();
    },
    harvestAll() {
        let n = 0, xp = 0, seeds = 0, dry = 0, regrow = 0;
        const bonus = [];
        this.plots.forEach((p, i) => {
            if (p && this.plotProgress(i) >= 1) {
                const r = this.doHarvestPlot(p, i);
                n++;
                xp += r.gain;
                if (r.regrow) regrow++;
                if (r.dry) dry++;
                if (r.seed) seeds++;
                if (r.bonus.length) bonus.push(...r.bonus);
            }
        });
        if (n > 0) {
            this.addLog('一键收获 ' + n + ' 株,已放入仓库 +' + xp + ' 经验'
                + (regrow > 0 ? ',' + regrow + ' 株进入第2季生长' : '')
                + (seeds > 0 ? ',掉落 ' + seeds + ' 颗种子' : '')
                + (bonus.length ? ',惊喜掉落 ' + this.bonusSeedText(bonus) : '')
                + (dry > 0 ? ',有 ' + dry + ' 块地干枯需浇水' : ''));
            // 先打印收获汇总日志,再统一加经验(升级日志排在收获之后);经验不重复加
            this.addXp(xp);
        } else {
            this.addLog('没有可收获的作物');
        }
        this.save();
    },
    doClear(i) {
        const p = this.plots[i];
        if (!p || this.isDryPlot(p)) return;
        const name = (p.type && CROPS[p.type]) ? CROPS[p.type].name : '作物';
        this.$set(this.plots, i, null);
        this.hideContextMenu();
        this.addLog('铲除了第 ' + (i + 1) + ' 块地的' + name);
        this.save();
    },

    /* ---------- 扩建土地 ---------- */
    openUnlockModal(i) {
        this.hideContextMenu();
        this.modalPlot = i;
        this.modalMode = 'unlock';
        this.modalTitle = '扩建土地(第 ' + (i + 1) + ' 块)';
    },

    /* ---------- 升级土地(逐级:黄→红→黑→金),弹窗操作 ---------- */
    toggleUpgradeSelect() {
        this.upgradeSelecting = !this.upgradeSelecting;
        if (this.upgradeSelecting) this.hideContextMenu();
    },
    openUpgradeModal(i) {
        this.hideContextMenu();
        this.modalPlot = i;
        this.modalMode = 'upgrade';
        this.modalTitle = '升级土地(第 ' + (i + 1) + ' 块)';
    },
    doUpgrade(i) {
        const req = this.plotUpgradeReq(i);
        if (!req) { this.closeModal(); return; }
        const next = PLOT_GRADE_NAME[this.plotGrade[i] + 1];
        if (this.level < req.level) { this.addLog('等级不足,需要 Lv.' + req.level + ' 才能升级为' + next); this.closeModal(); return; }
        if (this.coins < req.cost) { this.addLog('金币不足,升级需要 ' + req.cost + ' 金币'); this.closeModal(); return; }
        this.coins -= req.cost;
        this.$set(this.plotGrade, i, this.plotGrade[i] + 1);
        this.addLog('第 ' + (i + 1) + ' 块地升级为' + PLOT_GRADE_NAME[this.plotGrade[i]] + ',花费 ' + req.cost + ' 金币');
        this.closeModal();
        this.save();
    },
    unlockOk(i) {
        return this.level >= this.plotLevelReq(i) && this.coins >= this.plotUnlockCost(i);
    },
    doUnlock(i) {
        const req = this.plotLevelReq(i);
        const cost = this.plotUnlockCost(i);
        if (this.level < req) { this.addLog('等级不足,需要 Lv.' + req + ' 才能扩建这块地'); }
        else if (this.coins < cost) { this.addLog('金币不足,扩建需要 ' + cost + ' 金币'); }
        else {
            this.coins -= cost;
            this.$set(this.unlockedPlots, i, true);
            this.addLog('扩建了第 ' + (i + 1) + ' 块地');
        }
        this.closeModal();
        this.save();
    },


    /* ---------- 商店:作物种子(农场专属) ---------- */
    buySeed(key) {
        const c = CROPS[key];
        if (c.hidden) return; // 隐藏种子仅供掉落获取,不可在商店购买
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
