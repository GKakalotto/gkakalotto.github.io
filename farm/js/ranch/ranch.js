/* ================= 养殖(动物)逻辑 =================
   玩法:空栏位投放幼崽 → 生长(缺草暂停)→ 成熟后产出进度自动累积(不收获也增加),每 produceEvery 秒累计 1 次产出,
   累计 ANIMAL_MAX_PRODUCE 次后产满 → 收获动物本体进仓库;未收取的产物随点击收取入仓。
   牧槽不空时动物每 FEED_EVERY 个产出周期自动消耗 1 牧草,缺草则生长/产出暂停。 */
const ranchComputed = {
    animalTypes() { return ANIMALS; },
    youngKeys() { return Object.keys(this.inventory.young); },
    feedCount() { return this.inventory.items['siliao'] || 0; }, // 仓库中的牧草库存
    feedTroughCount() { return this.feedTrough; },              // 牧槽内的牧草
    feedTroughCap() { return FEED_TROUGH_CAP; },
    feedAddMax() { return Math.min(this.inventory.items['siliao'] || 0, FEED_TROUGH_CAP - this.feedTrough); }, // 可添入上限 = min(牧草库存, 牧槽剩余容量)
    feedCost() { return FEED_COST; },
    ranchHasAnimal() { return !!this.animals[this.menuPlot]; }, // !! 使 undefined(menuPlot=-1) 与 null 都判为空
    menuRanchHarvestEnabled() { const a = this.animals[this.menuPlot]; return !!a && this.ranchPending(this.menuPlot) > 0; },
    menuRanchDoneEnabled() { return this.ranchDone(this.menuPlot); },
    ranchMaxProduce() { return ANIMAL_MAX_PRODUCE; },
};

const ranchMethods = {
    /* ---------- 栏位:生长 / 产出 ---------- */
    ranchGrowth(i) {
        const a = this.animals[i];
        if (!a) return 0;
        const total = ANIMALS[a.type].grow * 1000;
        const grown = a.accrued + (a.hungry ? 0 : Math.max(0, this.now - a.resumedAt));
        return Math.min(1, grown / total);
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
    /* 待收取产物数 = 累计产出(自动累积) - 已入仓次数;饥饿或未成熟时不产出 */
    ranchPending(i) {
        const a = this.animals[i];
        if (!a || a.hungry || this.ranchGrowth(i) < 1) return 0;
        return Math.max(0, (a.produceCount || 0) - (a.stored || 0));
    },
    /* 动物是否已产满(累计产出达到 ANIMAL_MAX_PRODUCE 次,进度自动累积,与是否收获无关) */
    ranchDone(i) {
        const a = this.animals[i];
        return !!a && (a.produceCount || 0) >= ANIMAL_MAX_PRODUCE;
    },
    /* 距下次产出的剩余秒数(成熟产出中且未产满/未饥饿) */
    ranchNextProduceSec(i) {
        const a = this.animals[i];
        if (!a || this.ranchGrowth(i) < 1 || a.hungry || this.ranchDone(i)) return 0;
        const interval = ANIMALS[a.type].produceEvery * 1000;
        return Math.max(0, Math.ceil((a.lastProduce + interval - Date.now()) / 1000));
    },

    /* ---------- 栏位渲染 / 点击 ---------- */
    ranchClass(i) {
        if (!this.ranchCellUnlocked(i)) {
            return (i > 0 && !this.unlockedRanches[i - 1]) ? 'plot locked disabled' : 'plot locked';
        }
        const a = this.animals[i];
        if (a === null) return 'plot empty';
        const cls = a.hungry ? 'dry' : (this.ranchGrowth(i) >= 1 ? 'mature' : 'growing');
        return 'plot ' + cls;
    },
    ranchTitle(i) {
        if (!this.ranchCellUnlocked(i)) {
            return '';
        }
        const a = this.animals[i];
        if (a === null) return '点击投放幼崽';
        if (a.hungry) return '饥饿中,牧槽缺牧草';
        if (this.ranchPending(i) > 0) return '点击收取产物';
        if (this.ranchDone(i)) return '已产满,点击收获动物';
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
        if (this.ranchDone(i)) {
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
        this.menuVisible = true;
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
            accrued: 0,
            resumedAt: now,
            hungry: false,
            hungerAt: now + ANIMALS[key].produceEvery * FEED_EVERY * 1000,
            lastProduce: now,
            announced: false,
            produceCount: 0, // 累计产出次数(自动累积,即进度)
            stored: 0,       // 已入仓的产物次数
        });
        this.addLog('投放了 ' + ANIMALS[key].name + ' 幼崽');
        this.hideContextMenu();
        this.save();
    },
    collectProduct(i) {
        const a = this.animals[i];
        const n = this.ranchPending(i);
        if (n <= 0) return;
        const p = ANIMALS[a.type].product;
        // 每个待收产出周期随机产 50~80 个(含端点),多周期待收则累加
        let qty = 0;
        for (let k = 0; k < n; k++) qty += 50 + Math.floor(Math.random() * 31);
        this.$set(this.inventory.items, p, (this.inventory.items[p] || 0) + qty);
        a.stored = (a.stored || 0) + n; // 已收产物周期入仓
        this.hideContextMenu();
        this.addLog('收取 ' + ANIMALS[a.type].name + ' 的产物 ' + ANIMAL_PRODUCTS[p].name + ' x' + qty + '(累计 ' + a.produceCount + '/' + ANIMAL_MAX_PRODUCE + ')');
        this.save();
    },
    /* 产满后收获动物本体进仓库(成体物品),栏位清空 */
    collectAnimal(i) {
        const a = this.animals[i];
        if (!this.ranchDone(i)) return;
        if (this.ranchPending(i) > 0) { this.collectProduct(i); return; } // 有待收产物先收取,避免丢失
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

    /* ---------- 每秒检查:由 common.js 的 tick 统一调用 ---------- */
    checkAnimals() {
        const now = Date.now();
        let hit = false;
        this.animals.forEach((a, i) => {
            if (!a) return;
            // 成熟:开始计时产出
            if (!a.announced && this.ranchGrowth(i) >= 1) {
                a.announced = true;
                a.lastProduce = now;
                this.addLog(ANIMALS[a.type].name + ' 已成熟,开始持续产出!');
                hit = true;
            }
            // 饥饿中:牧槽有牧草则自动恢复
            if (a.hungry && this.feedTrough > 0) {
                this.feedTrough--;
                a.hungry = false;
                a.resumedAt = now;
                a.lastProduce = now; // 解除冻结,产出计时从恢复时刻重新开始
                a.hungerAt = now + ANIMALS[a.type].produceEvery * FEED_EVERY * 1000;
                this.addLog(ANIMALS[a.type].name + ' 吃到牧草,恢复生长/产出');
                hit = true;
            }
            // 产出进度自动累积(不收获也随时间增加;饥饿/未成熟/已产满时不累积)
            if (a.announced && !a.hungry && (a.produceCount || 0) < ANIMAL_MAX_PRODUCE) {
                const interval = ANIMALS[a.type].produceEvery * 1000;
                // 若本帧已到饥饿预约时刻,产出只推进到饥饿时刻(接下来会进入饥饿冻结)
                const produceEnd = (a.hungerAt && a.hungerAt < now) ? a.hungerAt : now;
                const due = Math.floor((produceEnd - a.lastProduce) / interval);
                if (due > 0) {
                    a.lastProduce += due * interval;
                    a.produceCount = Math.min(ANIMAL_MAX_PRODUCE, (a.produceCount || 0) + due);
                    hit = true;
                }
            }
            // 饥饿预约到期:牧槽有牧草则自动吃草续约,无草则饥饿暂停
            if (!a.hungry && a.hungerAt && now >= a.hungerAt) {
                if (this.feedTrough > 0) {
                    this.feedTrough--; // 自动消耗 1 牧草
                    a.hungerAt = now + ANIMALS[a.type].produceEvery * FEED_EVERY * 1000;
                    hit = true;
                } else {
                    a.accrued += Math.max(0, now - a.resumedAt); // 冻结生长进度
                    a.resumedAt = now;
                    a.lastProduce = now; // 冻结产出计时
                    a.hungry = true;
                    a.hungerAt = null;
                    this.addLog(ANIMALS[a.type].name + ' 饿了!牧槽没有牧草,生长/产出暂停');
                    hit = true;
                }
            }
        });
        if (hit) this.save();
    },

    /* ---------- 养殖商店(幼崽 + 牧草) ---------- */
    animalName(key) { return ANIMALS[key].name; },
    ranchPawStyle(n) {
        return { animationDelay: '-' + (n - 1) + 's' };
    },
    randomizePaw(e) {
        const top = (10 + Math.random() * 70).toFixed(1);
        const left = (10 + Math.random() * 70).toFixed(1);
        e.target.style.top = top + '%';
        e.target.style.left = left + '%';
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
        const total = FEED_COST * qty;
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
    // 打开添入牧槽弹窗(显示仓库库存与剩余容量,数量默认 0)
    openFeedAdd() {
        this.hideContextMenu();
        this.modalMode = 'feedadd';
        this.modalTitle = '添加牧草';
    },
    confirmFeedAdd() {
        const qty = this.qtyFor('feedadd', 'siliao');
        if (qty <= 0) { this.closeModal(); return; }
        const max = Math.min(this.inventory.items['siliao'] || 0, FEED_TROUGH_CAP - this.feedTrough);
        const add = Math.min(qty, max); // 防溢出双保险
        if (add <= 0) {
            this.addLog('没有可添加的牧草');
        } else {
            this.inventory.items['siliao'] -= add;
            if (this.inventory.items['siliao'] <= 0) this.$delete(this.inventory.items, 'siliao');
            this.feedTrough += add;
            this.addLog('添加 ' + add + ' 个牧草到牧槽');
        }
        this.closeModal();
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
