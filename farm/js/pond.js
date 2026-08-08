/* ================= 鱼塘(鱼)逻辑 ================= */
const pondComputed = {
    pondHasFish() { return this.pond[this.menuPlot] !== null; },
    menuPondHarvestEnabled() { const p = this.pond[this.menuPlot]; return !!p && this.pondProgress(this.menuPlot) >= 1; },
    pondUnlockLevel() { return POND_UNLOCK_LEVEL; },
    pondUnlockCost() { return POND_UNLOCK_COST; },
};

const pondMethods = {
    /* ---------- 鱼塘:生长/投放/收获 ---------- */
    pondProgress(i) {
        const p = this.pond[i];
        if (!p) return 0;
        const total = FISH[p.type].grow * 1000;
        const grown = p.accrued + Math.max(0, this.now - p.resumedAt);
        return Math.min(1, grown / total);
    },
    pondPercent(i) { return Math.floor(this.pondProgress(i) * 100); },
    pondRemainSec(i) {
        const p = this.pond[i];
        if (!p) return 0;
        return Math.max(0, Math.ceil(FISH[p.type].grow - this.pondProgress(i) * FISH[p.type].grow));
    },
    pondRemainText(i) { return fmtDur(this.pondRemainSec(i)) + '后长大'; },
    pondStageText(i) {
        const pr = this.pondProgress(i);
        if (pr < 0.35) return '鱼苗';
        if (pr < 0.7) return '生长中';
        return '快成熟';
    },
    pondClass(i) {
        if (!this.pondCellUnlocked(i)) return 'plot locked';
        const p = this.pond[i];
        if (p === null) return 'plot empty';
        return this.pondProgress(i) >= 1 ? 'plot mature' : 'plot growing';
    },
    pondTitle(i) {
        if (!this.pondCellUnlocked(i)) return '点击查看解锁条件';
        const p = this.pond[i];
        if (p === null) return '点击投放';
        return this.pondProgress(i) >= 1 ? '点击收获' : '';
    },
    onPondClick(i, e) {
        if (!this.pondCellUnlocked(i)) { this.openPondCellUnlock(i); return; }
        const p = this.pond[i];
        if (p === null) {
            // 空鱼塘:直接出鱼苗列表(隐藏返回按钮)
            this.openPondMenu(i, e);
            this.menuView = 'stock';
            this.menuDirect = true;
            return;
        }
        if (this.pondProgress(i) >= 1) {
            // 成熟:直接收获(无渔网时 harvestFish 会给出提示)
            this.harvestFish(i);
            return;
        }
        // 生长中:只保留移除
        this.openPondMenu(i, e);
    },

    /* ---------- 鱼塘右键菜单 ---------- */
    openPondMenu(i, e) {
        this.menuTarget = 'pond';
        this.menuPlot = i;
        this.menuX = e.clientX;
        this.menuY = e.clientY;
        this.menuView = 'main';
        this.menuDirect = false;
        this.menuVisible = true;
    },

    /* ---------- 鱼塘解锁 ---------- */
    openPondUnlock() {
        this.hideContextMenu();
        this.modalMode = 'pondunlock';
        this.modalTitle = '解锁鱼塘';
    },
    pondUnlockOk() {
        return this.level >= POND_UNLOCK_LEVEL && this.coins >= POND_UNLOCK_COST;
    },
    doPondUnlock() {
        if (this.level < POND_UNLOCK_LEVEL) {
            this.addLog('等级不足,需要 Lv.' + POND_UNLOCK_LEVEL + ' 才能解锁鱼塘');
        } else if (this.coins < POND_UNLOCK_COST) {
            this.addLog('金币不足,解锁鱼塘需要 ' + POND_UNLOCK_COST + ' 金币');
        } else {
            this.coins -= POND_UNLOCK_COST;
            this.pondUnlocked = true;
            // 区域解锁后自动开放初始 POND_INITIAL_OPEN 格(其余格花金币扩张)
            for (let i = 0; i < POND_INITIAL_OPEN && i < TOTAL_PONDS; i++) {
                this.$set(this.unlockedPonds, i, true);
            }
            this.$set(this.fish.fries, POND_BONUS_FRY, (this.fish.fries[POND_BONUS_FRY] || 0) + POND_BONUS_COUNT);
            this.addLog('解锁了鱼塘!开放初始 ' + POND_INITIAL_OPEN + ' 格,赠送 ' + FISH[POND_BONUS_FRY].name + ' 鱼苗 x' + POND_BONUS_COUNT);
        }
        this.closeModal();
        this.save();
    },
    /* ---------- 鱼塘单格解锁(初始格自动开放,扩张格花金币) ---------- */
    pondCellUnlocked(i) { return !!this.unlockedPonds[i]; },
    pondCellLevelReq(i) {
        return i < POND_INITIAL_OPEN ? POND_UNLOCK_LEVEL : POND_UNLOCK_LEVEL + (i - POND_INITIAL_OPEN + 1) * POND_EXPAND_INTERVAL;
    },
    pondCellCost(i) {
        return i < POND_INITIAL_OPEN ? 0 : (POND_CELL_UNLOCK_COST[i - POND_INITIAL_OPEN] || 0);
    },
    pondCellUnlockOk(i) {
        return this.level >= this.pondCellLevelReq(i) && this.coins >= this.pondCellCost(i);
    },
    openPondCellUnlock(i) {
        this.hideContextMenu();
        this.modalPlot = i;
        this.modalMode = 'pondcell';
        this.modalTitle = '解锁鱼塘(第 ' + (i + 1) + ' 格)';
    },
    doUnlockPondCell(i) {
        const cost = this.pondCellCost(i);
        if (this.level < this.pondCellLevelReq(i)) {
            this.addLog('等级不足,需要 Lv.' + this.pondCellLevelReq(i) + ' 才能解锁该鱼塘格');
        } else if (this.coins < cost) {
            this.addLog('金币不足,解锁该鱼塘格需要 ' + cost + ' 金币');
        } else {
            this.coins -= cost;
            this.$set(this.unlockedPonds, i, true);
            this.addLog('解锁了第 ' + (i + 1) + ' 个鱼塘格,花费 ' + cost + ' 金币');
        }
        this.closeModal();
        this.save();
    },
    stockFry(i, key) {
        const fries = this.fish.fries[key];
        if (!fries || fries <= 0) {
            this.addLog('没有 ' + FISH[key].name + ' 鱼苗');
            this.hideContextMenu();
            this.save();
            return;
        }
        this.fish.fries[key]--;
        if (this.fish.fries[key] <= 0) this.$delete(this.fish.fries, key);
        this.$set(this.pond, i, {
            type: key,
            accrued: 0,
            resumedAt: Date.now(),
            announced: false,
        });
        this.addXp(1);
        this.addLog('投放了 ' + FISH[key].name + ' 鱼苗 +1 经验');
        this.hideContextMenu();
        this.save();
    },
    harvestFish(i) {
        const p = this.pond[i];
        if (!p) return;
        const f = FISH[p.type];
        if (this.pondProgress(i) < 1) {
            this.addLog(f.name + ' 还没长大');
            this.save();
            return;
        }
        this.hideContextMenu();
        const type = p.type;
        this.$set(this.inventory.items, type, (this.inventory.items[type] || 0) + 1);
        this.$set(this.pond, i, null);
        this.addLog('收获 ' + f.name + ' x1,已放入仓库 +' + f.xp + ' 经验');
        this.addXp(f.xp);
        this.save();
    },
    checkFishMature() {
        let hit = false;
        this.pond.forEach((p, i) => {
            if (p && !p.announced && this.pondProgress(i) >= 1) {
                p.announced = true;
                this.addLog(FISH[p.type].name + ' 已长大,快来收鱼!');
                hit = true;
            }
        });
        if (hit) this.save();
    },
    harvestFishAll() {
        let n = 0, xp = 0;
        this.pond.forEach((p, i) => {
            if (p && this.pondProgress(i) >= 1) {
                const type = p.type;
                this.$set(this.inventory.items, type, (this.inventory.items[type] || 0) + 1);
                this.$set(this.pond, i, null);
                n++;
                xp += FISH[type].xp;
            }
        });
        if (n > 0) {
            this.addLog('一键捕捞 ' + n + ' 条,已放入仓库 +' + xp + ' 经验');
            this.addXp(xp);
        } else {
            this.addLog('鱼塘没有可捕捞的鱼');
        }
        this.save();
    },
    doClearPond(i) {
        const p = this.pond[i];
        if (!p) return;
        this.$set(this.pond, i, null);
        this.hideContextMenu();
        this.addLog('铲除了第 ' + (i + 1) + ' 个鱼塘的' + FISH[p.type].name);
        this.save();
    },

    /* ---------- 商店鱼类 / 鱼苗 ---------- */
    fishName(key) { return FISH[key].name; },
    fishKindLabel(key) { return KIND_LABEL[key]; },
    fishKindCls(key) { return KIND_CLS[key]; },
    fishLevelReq(key) { return FISH[key].level; },
    fishLocked(key) { return !this.pondUnlocked || this.level < FISH[key].level; }, // 鱼塘未解锁时鱼苗全部锁定
    fishSellPrice(key) { return Math.floor(FISH[key].cost / 2); }, // 鱼苗回收价 = 鱼苗价的一半
    buyFry(key) {
        const f = FISH[key];
        const qty = this.qtyFor('fishshop', key);
        if (qty <= 0) { this.addLog('请先选择购买数量'); this.save(); return; }
        const total = f.cost * qty;
        if (this.coins < total) {
            this.addLog('金币不足,需要 ' + total + ' 金币');
        } else {
            this.coins -= total;
            this.$set(this.fish.fries, key, (this.fish.fries[key] || 0) + qty);
            this.addLog('购买了 ' + f.name + ' 鱼苗 x' + qty);
            this.$set(this.qtys.fishshop, key, 0); // 买完重置数量框
        }
        this.save();
    },
    recycleFry(key) {
        const qty = Math.min(this.qtyFor('fishFries', key), this.fish.fries[key] || 0);
        if (qty <= 0) return;
        const price = this.fishSellPrice(key);
        this.fish.fries[key] -= qty;
        if (this.fish.fries[key] <= 0) this.$delete(this.fish.fries, key);
        this.coins += price * qty;
        this.addLog('回收 ' + FISH[key].name + ' 鱼苗 x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.save();
    },
};
