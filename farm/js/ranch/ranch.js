/* ================= 养殖(动物)逻辑 =================
   玩法:空栏位投放幼崽(饥饿)→ 喂养消耗牧草解除饥饿 → 生长 → 成熟后产出进度自动累积(不收获也增加),
   每 produceEvery 秒累计 1 次产出,累计 ANIMAL_MAX_PRODUCE 次后产满 → 收获动物本体进仓库;产物随点击收取。
   离线期间动物照常生长/产出(按时间差自然累计),无需离线补算。 */

const ranchComputed = {
    animalTypes() { return ANIMALS; },
    feedCost() { return SILIAO_COST; },
    ranchHasAnimal() { return !!this.animals[this.menuPlot]; }, // !! 使 undefined(menuPlot=-1) 与 null 都判为空
    menuRanchFeedEnabled() { const a = this.animals[this.menuPlot]; return !!a && !!a.hungry; },
    menuRanchFeedNeed() {
        const a = this.animals[this.menuPlot];
        return a ? this.animalFeedCost(a.type) : 0;
    },
    menuRanchFeedEnough() {
        const a = this.animals[this.menuPlot];
        if (!a) return false;
        return (this.inventory.items['siliao'] || 0) >= this.animalFeedCost(a.type);
    },
    menuRanchHarvestEnabled() { const a = this.animals[this.menuPlot]; return !!a && this.ranchPending(this.menuPlot) > 0; },
    menuRanchDoneEnabled() { return this.ranchReady(this.menuPlot); },
    ranchMaxProduce() { return ANIMAL_MAX_PRODUCE; },
};

const ranchMethods = {
    /* ---------- 栏位:生长 / 产出 ---------- */
    ranchHungry(i) { const a = this.animals[i]; return !!a && !!a.hungry; },
    ranchGrowth(i) {
        const a = this.animals[i];
        if (!a || !ANIMALS[a.type]) return 0;
        if (a.hungry) return 0; // 饥饿时生长暂停,喂养后才会开始
        const total = ANIMALS[a.type].grow * 1000;
        return Math.min(1, Math.max(0, this.now - a.resumedAt) / total);
    },
    ranchPercent(i) { return Math.floor(this.ranchGrowth(i) * 100); },
    ranchRemainText(i) {
        const a = this.animals[i];
        if (!a) return ''; // 空栏位/越界(menuPlot=-1)时安全返回
        const total = ANIMALS[a.type].grow;
        return fmtDur(Math.max(0, Math.ceil(total - this.ranchGrowth(i) * total))) + ' 后成熟';
    },
    ranchStageText(i) {
        const pr = this.ranchGrowth(i);
        if (pr >= 1) return '成熟';
        if (pr < 0.35) return '幼崽';
        if (pr < 0.7) return '成长中';
        return '快成熟';
    },
    /* 待收产物数量(已产出未入仓);未成熟/饥饿为 0 */
    ranchPending(i) {
        const a = this.animals[i];
        if (!a || this.ranchGrowth(i) < 1) return 0;
        return a.pendingQty || 0;
    },
    /* 动物是否已产满(累计产出达到 ANIMAL_MAX_PRODUCE 次,进度自动累积,与是否收获无关) */
    ranchDone(i) {
        const a = this.animals[i];
        return !!a && (a.produceCount || 0) >= ANIMAL_MAX_PRODUCE;
    },
    /* 产满且产物已收完:可收获动物本体(此时停爱心动画) */
    ranchReady(i) {
        return this.ranchDone(i) && this.ranchPending(i) === 0;
    },
    /* 距下次产出的剩余秒数(成熟产出中且未产满) */
    ranchNextProduceSec(i) {
        const a = this.animals[i];
        if (!a || this.ranchGrowth(i) < 1 || this.ranchDone(i)) return 0;
        const interval = ANIMALS[a.type].produceEvery * 1000;
        return Math.max(0, Math.ceil((a.lastProduce + interval - this.now) / 1000));
    },

    /* ---------- 栏位渲染 / 点击 ---------- */
    ranchClass(i) {
        if (!this.ranchCellUnlocked(i)) {
            return (i > 0 && !this.unlockedRanches[i - 1]) ? 'plot locked disabled' : 'plot locked';
        }
        const a = this.animals[i];
        if (a === null) return 'plot empty';
        if (a.hungry) return 'plot dry'; // 复用 .dry 类(牧场下为暗红饥饿样式,不加裂纹)
        return 'plot ' + (this.ranchGrowth(i) >= 1 ? 'mature' : 'growing');
    },
    ranchTitle(i) {
        if (!this.ranchCellUnlocked(i)) {
            return '';
        }
        const a = this.animals[i];
        if (a === null) return '点击投放幼崽';
        if (a.hungry) return '饥饿!点击喂养(需 ' + this.animalFeedCost(a.type) + ' 牧草)';
        if (this.ranchPending(i) > 0) return '点击收取产物';
        if (this.ranchReady(i)) return '已产满,点击收获动物';
        return '点击查看';
    },
    onRanchClick(i, e) {
        if (!this.ranchCellUnlocked(i)) {
            if (i > 0 && !this.unlockedRanches[i - 1]) return;
            this.openRanchCellUnlock(i); return;
        }
        const a = this.animals[i];
        if (a === null) {
            // 空栏位:直接出幼崽列表(隐藏返回按钮)
            this.openRanchMenu(i, e);
            this.menuView = 'stock';
            this.menuDirect = true;
            return;
        }
        if (this.ranchPending(i) > 0) {
            // 有待收产物:直接收取(产满后也先收产物,避免待收丢失)
            this.collectProduct(i);
            return;
        }
        if (this.ranchReady(i)) {
            // 已产满且产物已收完:直接收获动物本体进仓库
            this.collectAnimal(i);
            return;
        }
        this.openRanchMenu(i, e);
    },
    openRanchMenu(i, e) {
        this.menuTarget = 'ranch';
        this.menuPlot = i;
        this.menuX = e.clientX;
        this.menuY = e.clientY;
        this.menuView = 'main';
        this.menuDirect = false;
        this.showContextMenu();
    },

    /* ---------- 栏位扩建 ---------- */
    ranchCellUnlocked(i) { return !!this.unlockedRanches[i]; },
    ranchCellLevelReq(i) {
        return i < RANCH_INITIAL_OPEN ? 1 : RANCH_FIRST_LEVEL + (i - RANCH_INITIAL_OPEN) * RANCH_EXPAND_INTERVAL;
    },
    ranchCellCost(i) {
        return i < RANCH_INITIAL_OPEN ? 0 : (RANCH_UNLOCK_COST[i - RANCH_INITIAL_OPEN] || 0);
    },
    ranchCellUnlockOk(i) {
        return this.level >= this.ranchCellLevelReq(i) && this.coins >= this.ranchCellCost(i);
    },
    openRanchCellUnlock(i) {
        this.hideContextMenu();
        this.modalPlot = i;
        this.modalMode = 'ranchcell';
        this.modalTitle = '扩建栏位(第 ' + (i + 1) + ' 格)';
    },
    doUnlockRanchCell(i) {
        const cost = this.ranchCellCost(i);
        if (this.level < this.ranchCellLevelReq(i)) {
            this.addLog('等级不足,需要 Lv.' + this.ranchCellLevelReq(i) + ' 才能扩建该栏位');
        } else if (this.coins < cost) {
            this.addLog('金币不足,扩建该栏位需要 ' + cost + ' 金币');
        } else {
            this.coins -= cost;
            this.$set(this.unlockedRanches, i, true);
            this.addLog('扩建了第 ' + (i + 1) + ' 个栏位,花费 ' + cost + ' 金币');
        }
        this.closeModal();
        this.save();
    },

    /* ---------- 投放 / 喂食 / 收取 ---------- */
    stockAnimal(i, key) {
        if (!ANIMALS[key]) return;
        if (this.animals[i]) {
            this.addLog('该栏位已有动物');
            this.hideContextMenu();
            return;
        }
        const young = this.inventory.young[key];
        if (!young || young <= 0) {
            this.addLog('没有 ' + ANIMALS[key].name + ' 幼崽,请先到商店购买');
            this.hideContextMenu();
            this.save();
            return;
        }
        this.inventory.young[key]--;
        if (this.inventory.young[key] <= 0) this.$delete(this.inventory.young, key);
        const now = Date.now();
        this.$set(this.animals, i, {
            type: key,
            hungry: true,   // 投放即饥饿,需手动喂养(消耗 1 牧草)后才会开始生长
            resumedAt: now,
            announced: false,
            produceCount: 0, // 累计产出次数(自动累积,即进度)
            pendingQty: 0,   // 待收产物实际数量(每周期 10±3 随机累加)
        });
        this.addLog('投放了 ' + ANIMALS[key].name + ' 幼崽(饥饿中,需喂养 ' + this.animalFeedCost(key) + ' 牧草)');
        this.hideContextMenu();
        this.save();
    },
    /* 喂养所需牧草 = 生命周期(生长 + 产满)每 10 分钟 1 点,向上取整 */
    animalFeedCost(key) {
        const a = ANIMALS[key];
        if (!a) return 0;
        const lifeSec = a.grow + ANIMAL_MAX_PRODUCE * a.produceEvery;
        return Math.max(1, Math.ceil(lifeSec / 600));
    },
    /* 手动喂养:按生命周期消耗牧草,解除饥饿并开始生长 */
    feedAnimal(i) {
        const a = this.animals[i];
        if (!a) return;
        const need = this.animalFeedCost(a.type);
        const siliao = this.inventory.items['siliao'] || 0;
        if (siliao < need) {
            this.addLog('喂养 ' + ANIMALS[a.type].name + ' 需要 ' + need + ' 牧草,仓库中仅有 ' + siliao);
            this.hideContextMenu();
            this.save();
            return;
        }
        this.inventory.items['siliao'] -= need;
        if (this.inventory.items['siliao'] <= 0) this.$delete(this.inventory.items, 'siliao');
        const now = Date.now();
        a.hungry = false;
        a.resumedAt = now; // 从喂养时刻起重新计算生长
        this.addLog('喂养了 ' + ANIMALS[a.type].name + '(消耗 ' + need + ' 牧草),开始生长');
        this.hideContextMenu();
        this.save();
    },
    collectProduct(i) {
        const a = this.animals[i];
        if (!a || !ANIMALS[a.type]) return;
        const qty = saneInt(a.pendingQty, 0, 0, null);
        if (qty <= 0) { a.pendingQty = 0; return; }
        const p = ANIMALS[a.type].product;
        this.$set(this.inventory.items, p, (this.inventory.items[p] || 0) + qty);
        a.pendingQty = 0;
        this.hideContextMenu();
        this.addLog('收取 ' + ANIMALS[a.type].name + ' 的产物 ' + ANIMAL_PRODUCTS[p].name + ' x' + qty + '(累计 ' + a.produceCount + '/' + ANIMAL_MAX_PRODUCE + ')');
        this.save();
    },
    /* 产满后收获动物本体进仓库(成体物品),栏位清空 */
    collectAnimal(i) {
        const a = this.animals[i];
        if (!this.ranchReady(i)) return; // 未产满或仍有待收产物则不收本体
        this.$set(this.inventory.items, a.type, (this.inventory.items[a.type] || 0) + 1);
        this.$set(this.animals, i, null);
        this.hideContextMenu();
        this.addLog(ANIMALS[a.type].name + ' 已完成使命,收获到仓库 +' + (ANIMALS[a.type].xp + 10) + ' 经验');
        this.addXp(ANIMALS[a.type].xp + 10);
        this.save();
    },
    doClearAnimal(i) {
        const a = this.animals[i];
        if (!a) return;
        this.$set(this.animals, i, null);
        this.hideContextMenu();
        this.addLog('移除了第 ' + (i + 1) + ' 个栏位的' + ANIMALS[a.type].name);
        this.save();
    },

    /* ---------- 每秒检查:由 ranch/app.js 的 tick 统一调用 ---------- */
    checkAnimals() {
        const now = Date.now();
        let hit = false;
        this.animals.forEach((a, i) => {
            if (!a) return;
            // 成熟:从成熟时刻起算产出。lastProduce 设为成熟时刻而非 now,离线期间跨成熟的产出也能一次性补上
            if (!a.announced && this.ranchGrowth(i) >= 1) {
                a.announced = true;
                a.lastProduce = a.resumedAt + ANIMALS[a.type].grow * 1000;
                this.addLog(ANIMALS[a.type].name + ' 已成熟,开始持续产出!');
                hit = true;
            }
            // 产出进度自动累积(不收获也随时间增加;未成熟/已产满时不累积)
            if (a.announced && (a.produceCount || 0) < ANIMAL_MAX_PRODUCE) {
                const interval = ANIMALS[a.type].produceEvery * 1000;
                const due = Math.floor((now - a.lastProduce) / interval);
                if (due > 0) {
                    const before = a.produceCount || 0;
                    const added = Math.min(due, ANIMAL_MAX_PRODUCE - before); // 不超过产满上限
                    a.lastProduce += due * interval;
                    a.produceCount = before + added;
                    // 每完成 1 个产出周期,按 10±3 累加进待收数量
                    for (let k = 0; k < added; k++) a.pendingQty = (a.pendingQty || 0) + rollAnimalProduceQty();
                    hit = true;
                }
            }
        });
        if (hit) this.save();
    },

    /* ---------- 养殖商店(幼崽 + 牧草) ---------- */
    animalName(key) { return ANIMALS[key].name; },
    /* 牧栏爱心:每格 6 颗,位置/大小/速度错落(基于 n、i 的确定性伪随机,避免重渲染抖动) */
    ranchHeartStyle(n, i) {
        const seed = n * 13 + i * 29;
        const left = 14 + (seed % 68);            // 14% ~ 81%(分布更开,不扎堆)
        const size = 12 + (seed % 6);             // 12 ~ 17 px(略小)
        const dur = 2.8 + (n % 3) * 0.7;          // 2.8 ~ 4.2 s(稍快)
        const delay = -((n * 1.1 + (i % 3) * 0.6) % dur);
        return {
            left: left + '%',
            fontSize: size + 'px',
            animationDuration: dur + 's',
            animationDelay: delay + 's',
        };
    },
    animalLocked(key) { return this.level < ANIMALS[key].level; },
    animalLevelReq(key) { return ANIMALS[key].level; },
    productName(key) { return ANIMAL_PRODUCTS[ANIMALS[key].product].name; },
    productSell(key) { return ANIMAL_PRODUCTS[ANIMALS[key].product].sell; },
    animalAdultSell(key) { return ANIMAL_PRODUCTS[key].sell; },
    buyAnimal(key) {
        const a = ANIMALS[key];
        const qty = this.qtyFor('ranch', key);
        if (qty <= 0) { this.addLog('请先选择购买数量'); this.save(); return; }
        const total = a.cost * qty;
        if (this.coins < total) {
            this.addLog('金币不足,需要 ' + total + ' 金币');
        } else {
            this.coins -= total;
            this.$set(this.inventory.young, key, (this.inventory.young[key] || 0) + qty);
            this.addLog('购买了 ' + a.name + ' 幼崽 x' + qty);
            this.closeShopDetail(); // 购买完成自动关闭二级弹窗(同时重置数量)
        }
        this.save();
    },
    buyFeed() {
        const qty = this.qtyFor('ranchfeed', 'siliao');
        if (qty <= 0) { this.addLog('请先选择购买数量'); this.save(); return; }
        const total = SILIAO_COST * qty;
        if (this.coins < total) {
            this.addLog('金币不足,需要 ' + total + ' 金币');
        } else {
            this.coins -= total;
            this.$set(this.inventory.items, 'siliao', (this.inventory.items['siliao'] || 0) + qty);
            this.addLog('购买了 牧草 x' + qty);
            this.closeShopDetail(); // 购买完成自动关闭二级弹窗(同时重置数量)
        }
        this.save();
    },


    /* ---------- 背包回收:鱼苗 / 幼崽(牧场专属) ---------- */
    recycleFry(key) {
        const qty = Math.min(this.qtyFor('fishFries', key), this.fish.fries[key] || 0);
        if (qty <= 0) return;
        const price = this.fishSellPrice(key);
        this.fish.fries[key] -= qty;
        if (this.fish.fries[key] <= 0) this.$delete(this.fish.fries, key);
        this.coins += price * qty;
        this.addLog('回收 ' + FISH[key].name + ' 鱼苗 x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.closeInvDetail();
        this.save();
    },
    recycleYoung(key) {
        const qty = Math.min(this.qtyFor('young', key), this.inventory.young[key] || 0);
        if (qty <= 0) return;
        const price = this.animalSellPrice(key);
        this.inventory.young[key] -= qty;
        if (this.inventory.young[key] <= 0) this.$delete(this.inventory.young, key);
        this.coins += price * qty;
        this.addLog('回收 ' + ANIMALS[key].name + ' 幼崽 x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.closeInvDetail();
        this.save();
    },
};
