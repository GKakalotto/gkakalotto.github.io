/* ================= 共享逻辑(状态/存档/商店/弹窗/设置/定时) ================= */
const commonComputed = {
    crops() { return CROPS; },
    fishes() { return FISH; },
    levelText() { return 'Lv.' + this.level; },
    xpText() { return this.xp + '/' + xpNeeded(this.level); },
    seedKeys() { return Object.keys(this.inventory.seeds); },
    itemKeys() { return Object.keys(this.inventory.items); },
    fishFryKeys() { return Object.keys(this.fish.fries); },
    seedDisplayList() {
        const list = [];
        this.seedKeys.forEach(k => list.push({ kind: 'seed', key: k }));
        this.fishFryKeys.forEach(k => list.push({ kind: 'fry', key: k }));
        this.youngKeys.forEach(k => list.push({ kind: 'young', key: k })); // 购买的动物幼崽
        return list;
    },
    logSlice() { return this.log.slice(-60).reverse(); },
    menuStyle() { return { left: this.menuX + 'px', top: this.menuY + 'px' }; },
    menuClearName() {
        const i = this.menuPlot;
        if (this.menuTarget === 'pond') {
            const p = this.pond[i];
            return p ? '确定移除第 ' + (i + 1) + ' 个鱼塘的' + FISH[p.type].name + '吗?' : '';
        }
        if (this.menuTarget === 'ranch') {
            const a = this.animals[i];
            return a ? '确定移除第 ' + (i + 1) + ' 个栏位的' + ANIMALS[a.type].name + '吗?' : '';
        }
        const p = this.plots[i];
        if (!p || this.isDryPlot(p)) return ''; // 干枯地块无作物,不显示铲除确认
        return '确定铲除第 ' + (i + 1) + ' 块地的' + CROPS[p.type].name + '吗?';
    },
};

const commonMethods = {
    /* ---------- 公共 ---------- */
    addLog(msg) {
        this.log.push({ t: Date.now(), msg: msg });
        if (this.log.length > 80) this.log = this.log.slice(-80);
    },
    /* 商店购买按钮禁用:数量为 0 或金币不足 */
    shopBuyDisabled(group, key, cost) {
        const qty = this.qtyFor(group, key);
        return qty <= 0 || this.coins < cost * qty;
    },
    /* 出售/回收按钮禁用:数量为 0、超过持有数或物品锁定 */
    invSellDisabled(group, key, owned, locked) {
        const qty = this.qtyFor(group, key);
        return qty <= 0 || qty > (owned || 0) || !!locked;
    },
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                coins: this.coins, level: this.level, xp: this.xp, theme: this.theme,
                plots: this.plots, unlockedPlots: this.unlockedPlots, pond: this.pond,
                unlockedPonds: this.unlockedPonds,
                animals: this.animals, unlockedRanches: this.unlockedRanches,
                feedTrough: this.feedTrough, scene: this.scene,
                inventory: this.inventory, fish: this.fish, log: this.log,
            }));
        } catch (e) { /* 无持久化时游戏仍可运行 */ }
    },
    load() {
        let s = null;
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) s = JSON.parse(raw);
        } catch (e) { /* 忽略损坏的存档 */ }
        // 结构校验:不完整或损坏的存档直接丢弃,保持默认状态
        if (!s || !Array.isArray(s.plots) || s.plots.length !== TOTAL_PLOTS
            || !Array.isArray(s.unlockedPlots) || s.unlockedPlots.length !== TOTAL_PLOTS) return;
        const d = makeDefaultState();
        this.coins = s.coins;
        this.level = s.level;
        this.xp = s.xp;
        this.theme = s.theme || 'dark';
        this.scene = s.scene === 'ranch' ? 'ranch' : 'farm'; // 记住上次所在场景,刷新后停留原地
        this.plots = s.plots;
        this.unlockedPlots = s.unlockedPlots;
        this.pond = Array.isArray(s.pond) && s.pond.length === TOTAL_PONDS ? s.pond : d.pond;
        this.unlockedPonds = Array.isArray(s.unlockedPonds) && s.unlockedPonds.length === TOTAL_PONDS ? s.unlockedPonds : d.unlockedPonds;
        this.animals = Array.isArray(s.animals) && s.animals.length === RANCH_TOTAL ? s.animals : d.animals;
        this.unlockedRanches = Array.isArray(s.unlockedRanches) && s.unlockedRanches.length === RANCH_TOTAL ? s.unlockedRanches : d.unlockedRanches;
        this.feedTrough = s.feedTrough || 0;
        this.inventory = Object.assign({ seeds: {}, items: {}, locks: {}, young: {} }, s.inventory || {});
        this.fish = Object.assign({ fries: {} }, s.fish || {});
        this.log = Array.isArray(s.log) ? s.log : d.log;
    },
    resetGame() {
        this.settingsOpen = false;
        this.confirmModal('重置进度', '确定要重置所有进度吗?此操作不可恢复', () => {
            const d = makeDefaultState();
            this.coins = d.coins;
            this.level = d.level;
            this.xp = d.xp;
            this.plots = d.plots;
            this.unlockedPlots = d.unlockedPlots;
            this.pond = d.pond;
            this.unlockedPonds = d.unlockedPonds;
            this.animals = d.animals;
            this.unlockedRanches = d.unlockedRanches;
            this.feedTrough = d.feedTrough;
            this.qtys = { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {}, young: {}, ranch: {}, ranchfeed: {}, feedadd: {} };
            this.inventory = d.inventory;
            this.fish = d.fish;
            this.log = d.log;
            this.save();
        });
    },
    addXp(n) {
        this.xp += n;
        while (this.xp >= xpNeeded(this.level)) {
            this.xp -= xpNeeded(this.level);
            this.level += 1;
            const bonus = Math.floor(100 * Math.sqrt(this.level) * Math.log(this.level)); // 奖励金币 = 100·√等级·ln(等级)
            this.coins += bonus;
            this.addLog('等级提升!升到 Lv.' + this.level + ',奖励 ' + bonus + ' 金币,商店可能有新种子');
        }
    },

    /* ---------- 右键菜单公共导航 ---------- */
    hideContextMenu() {
        this.menuVisible = false;
        this.menuPlot = -1;
    },
    plantSubmenu() { this.menuView = 'plant'; },
    stockSubmenu() { this.menuView = 'stock'; },
    menuBack() { this.menuView = 'main'; },
    clearConfirm() { this.menuView = 'clear'; },
    confirmClear() {
        if (this.menuTarget === 'pond') this.doClearPond(this.menuPlot);
        else if (this.menuTarget === 'ranch') this.doClearAnimal(this.menuPlot);
        else this.doClear(this.menuPlot);
    },
    /* 时间格式化包装方法(供模板直接调用全局纯函数) */
    fmtDur(s) { return fmtDur(s); },
    fmtDurHM(s) { return fmtDurHM(s); },
    fmtRemain(s) { return fmtRemain(s); },
    fmtTime(t) { return fmtTime(t); },

    /* ---------- 仓库:作物/鱼/动物产物统一处理 ---------- */
    itemName(key) { const it = CROPS[key] || FISH[key] || ANIMAL_PRODUCTS[key]; return it ? it.name : key; },
    itemSell(key) { const it = CROPS[key] || FISH[key] || ANIMAL_PRODUCTS[key]; return it ? it.sell : 0; },

    /* ---------- 数量步进器(默认 0) ---------- */
    /* group/key 异常时安全返回 0,避免渲染/事件竞态下崩溃 */
    qtyFor(group, key) {
        const g = this.qtys[group];
        return g ? (g[key] || 0) : 0;
    },
    clampQty(group, key, v) {
        if (group === 'feedadd') {
            // 牧槽:范围 0~min(牧草库存, 牧槽剩余容量);库存为 0 时滑块禁用(模板 disabled)
            if (v < 0) v = 0;
            const max = Math.min(this.inventory.items['siliao'] || 0, FEED_TROUGH_CAP - this.feedTrough);
            if (v > max) v = max;
            return v;
        }
        if (group === 'warehouseItems' || group === 'warehouseSeeds' || group === 'fishFries' || group === 'young') {
            // 仓库/背包:上限为对应库存,可一次选到库存全量,不受 99 限制
            const owned = group === 'warehouseItems' ? (this.inventory.items[key] || 0)
                : group === 'warehouseSeeds' ? (this.inventory.seeds[key] || 0)
                : group === 'fishFries' ? (this.fish.fries[key] || 0)
                : (this.inventory.young[key] || 0);
            if (v < 0) v = 0;
            if (v > owned) v = Math.max(0, owned);
            return v;
        }
        // 商店购买:范围 0~99
        if (v < 0) v = 0;
        if (v > 99) v = 99;
        return v;
    },
    qtyChange(group, key, delta) {
        if (!this.qtys[group]) this.$set(this.qtys, group, {});
        this.$set(this.qtys[group], key, this.clampQty(group, key, (this.qtys[group][key] || 0) + delta));
    },
    qtyInputLive(group, key, val) {
        let v = parseInt(val, 10);
        if (isNaN(v)) v = 0; // 范围钳制统一交给 clampQty
        if (!this.qtys[group]) this.$set(this.qtys, group, {});
        // 实时输入也走边界检查,避免输入超限/超大值
        this.$set(this.qtys[group], key, this.clampQty(group, key, v));
    },

    /* ---------- 商店 ---------- */
    seedLocked(key) { return this.level < this.seedLevelReq(key); },
    openShopDetail(tab, key) {
        // 未解锁禁止点击
        const locked = tab === 'crops' ? this.seedLocked(key)
            : tab === 'fish' ? this.fishLocked(key)
            : tab === 'ranch' ? this.animalLocked(key) : false;
        if (locked) return;
        this.shopDetail = { tab: tab, key: key };
    },
    closeShopDetail() {
        this.shopDetail = null;
        // 关闭详情时重置数量,再次打开默认从 0 开始
        this.qtys.shop = {};
        this.qtys.fishshop = {};
        this.qtys.ranch = {};
        this.qtys.ranchfeed = {};
    },
    openShop() {
        this.hideContextMenu();
        this.shopDetail = null; // 防止从其他弹窗切回时残留详情对话框
        this.modalMode = 'shop';
        this.modalTitle = '商店';
        this.shopTab = 'crops';
    },
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
            this.closeShopDetail(); // 购买完成自动关闭二级弹窗(同时重置数量)
        }
        this.save();
    },

    /* ---------- 背包 / 仓库 ---------- */
    seedSellPrice(key) { return Math.floor(CROPS[key].cost / 2); }, // 种子回收价 = 种子售价的一半
    fishSellPrice(key) { return Math.floor(FISH[key].cost / 2); }, // 鱼苗回收价 = 鱼苗价的一半
    animalSellPrice(key) { return Math.floor(ANIMALS[key].cost / 2); }, // 幼崽回收价 = 幼崽价的一半
    /* 背包三类物品(种子/鱼苗/幼崽)统一读取 */
    invName(kind, key) {
        return kind === 'seed' ? CROPS[key].name : kind === 'fry' ? FISH[key].name : ANIMALS[key].name;
    },
    invSellPrice(kind, key) {
        return kind === 'seed' ? this.seedSellPrice(key) : kind === 'fry' ? this.fishSellPrice(key) : this.animalSellPrice(key);
    },
    invQty(kind, key) {
        return kind === 'seed' ? (this.inventory.seeds[key] || 0) : kind === 'fry' ? (this.fish.fries[key] || 0) : (this.inventory.young[key] || 0);
    },
    invQtyGroup(kind) {
        return kind === 'seed' ? 'warehouseSeeds' : kind === 'fry' ? 'fishFries' : 'young';
    },
    recycleFry(key) {
        const qty = Math.min(this.qtyFor('fishFries', key), this.fish.fries[key] || 0);
        if (qty <= 0) return;
        const price = this.fishSellPrice(key);
        this.fish.fries[key] -= qty;
        if (this.fish.fries[key] <= 0) this.$delete(this.fish.fries, key);
        this.coins += price * qty;
        this.addLog('回收 ' + FISH[key].name + ' 鱼苗 x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.closeInvDetail(); // 回收完成自动关闭二级弹窗
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
        this.closeInvDetail(); // 回收完成自动关闭二级弹窗
        this.save();
    },
    openBackpack() {
        this.hideContextMenu();
        this.modalMode = 'backpack';
        this.modalTitle = '背包';
    },
    openWarehouse() {
        this.hideContextMenu();
        this.modalMode = 'warehouse';
        this.modalTitle = '仓库';
    },
    /* 背包/仓库卡片二级详情 */
    openInvDetail(mode, kind, key) {
        this.invDetail = { mode: mode, kind: kind, key: key };
    },
    closeInvDetail() {
        this.invDetail = null;
        // 关闭详情重置数量,再次打开默认从 0 开始(与商店详情一致)
        this.qtys.warehouseItems = {};
        this.qtys.warehouseSeeds = {};
        this.qtys.fishFries = {};
        this.qtys.young = {};
    },
    setShopTab(tab) {
        // 切换标签:重置输入框数量、关闭详情、重置滚动位置
        this.qtys.shop = {};
        this.qtys.fishshop = {};
        this.qtys.ranch = {};
        this.qtys.ranchfeed = {};
        this.shopTab = tab;
        this.shopDetail = null;
        this.resetModalScroll();
    },
    resetModalScroll() {
        const body = this.$refs.modalBody;
        if (body) body.scrollTop = 0;
    },
    sellSeed(key) {
        const qty = Math.min(this.qtyFor('warehouseSeeds', key), this.inventory.seeds[key] || 0);
        if (qty <= 0) return;
        const price = this.seedSellPrice(key);
        this.inventory.seeds[key] -= qty;
        if (this.inventory.seeds[key] <= 0) this.$delete(this.inventory.seeds, key);
        this.coins += price * qty;
        this.addLog('回收 ' + CROPS[key].name + ' 种子 x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.closeInvDetail(); // 回收完成自动关闭二级弹窗
        this.save();
    },
    sellItem(key) {
        if (this.inventory.locks[key]) { this.addLog(this.itemName(key) + ' 已锁定,请先解锁再出售'); this.save(); return; }
        const qty = Math.min(this.qtyFor('warehouseItems', key), this.inventory.items[key] || 0);
        if (qty <= 0) return;
        this.inventory.items[key] -= qty;
        if (this.inventory.items[key] <= 0) this.$delete(this.inventory.items, key);
        const price = this.itemSell(key);
        this.coins += price * qty;
        this.addLog('出售 ' + this.itemName(key) + ' x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.closeInvDetail(); // 出售完成自动关闭二级弹窗
        this.save();
    },
    // 仓库可出售总价:未锁定物品的总价值(与一键出售口径一致)
    unlockedTotalValue() {
        let total = 0;
        this.itemKeys.forEach((key) => {
            if (this.inventory.locks[key]) return;
            total += this.itemSell(key) * this.inventory.items[key];
        });
        return total;
    },
    // 背包可回收总价:所有种子/鱼苗/幼崽的回收总价值(与一键回收口径一致)
    backpackTotalValue() {
        let total = 0;
        this.seedKeys.forEach((k) => { total += this.seedSellPrice(k) * this.inventory.seeds[k]; });
        this.fishFryKeys.forEach((k) => { total += this.fishSellPrice(k) * this.fish.fries[k]; });
        this.youngKeys.forEach((k) => { total += this.animalSellPrice(k) * this.inventory.young[k]; });
        return total;
    },
    // 背包是否有可回收物品(种子/鱼苗/幼崽数量>0;回收价可能为 0 如草籽,仍可回收清理)
    hasRecyclable() {
        return this.seedKeys.some(k => this.inventory.seeds[k] > 0)
            || this.fishFryKeys.some(k => this.fish.fries[k] > 0)
            || this.youngKeys.some(k => this.inventory.young[k] > 0);
    },
    // 仓库是否有未锁定物品可出售
    hasSellable() {
        return this.itemKeys.some(key => !this.inventory.locks[key] && this.inventory.items[key] > 0);
    },
    sellAllUnlocked() {
        let total = 0, n = 0;
        this.itemKeys.forEach((key) => {
            if (this.inventory.locks[key]) return;
            const qty = this.inventory.items[key];
            total += this.itemSell(key) * qty;
            n += qty;
            this.$delete(this.inventory.items, key);
        });
        if (n === 0) {
            this.addLog(this.itemKeys.length === 0 ? '没有可出售的收获品' : '收获品已全部锁定');
        } else {
            this.coins += total;
            this.addLog('出售全部 ' + n + ' 个物品,获得 ' + total + ' 金币');
        }
        this.save();
    },
    // 背包页:一键回收全部种子/鱼苗/幼崽(半价),与收获物品的一键出售相互独立
    recycleAllBackpack() {
        let total = 0, n = 0;
        this.seedKeys.forEach((key) => {
            const qty = this.inventory.seeds[key];
            total += this.seedSellPrice(key) * qty;
            n += qty;
            this.$delete(this.inventory.seeds, key);
        });
        this.fishFryKeys.forEach((key) => {
            const qty = this.fish.fries[key];
            total += this.fishSellPrice(key) * qty;
            n += qty;
            this.$delete(this.fish.fries, key);
        });
        this.youngKeys.forEach((key) => {
            const qty = this.inventory.young[key];
            total += this.animalSellPrice(key) * qty;
            n += qty;
            this.$delete(this.inventory.young, key);
        });
        if (n === 0) {
            this.addLog('背包里没有种子/鱼苗/幼崽');
        } else {
            this.coins += total;
            this.addLog('回收全部 ' + n + ' 个种子/鱼苗/幼崽,获得 ' + total + ' 金币');
        }
        this.save();
    },
    toggleLock(key) {
        this.$set(this.inventory.locks, key, !this.inventory.locks[key]);
        this.save();
    },

    /* ---------- 弹窗 ---------- */
    onOverlayClick() {
        // 二级详情是独立全屏遮罩,能点到主遮罩时二级详情必然已关闭;直接关主弹窗(closeModal 已处理一级一级关闭)
        this.closeModal();
    },
    closeModal() {
        // 弹窗只能一级一级关闭:上层有二级详情时先关闭二级详情,不能直接关闭整个弹窗
        if (this.shopDetail) { this.closeShopDetail(); return; }
        if (this.invDetail) { this.closeInvDetail(); return; }
        if (this.modalMode === 'shop') { this.qtys.shop = {}; this.qtys.fishshop = {}; this.qtys.ranch = {}; this.qtys.ranchfeed = {}; }
        else if (this.modalMode === 'warehouse' || this.modalMode === 'backpack') { this.qtys.warehouseItems = {}; this.qtys.warehouseSeeds = {}; this.qtys.fishFries = {}; this.qtys.young = {}; }
        else if (this.modalMode === 'feedadd') { this.qtys.feedadd = {}; }
        this.shopDetail = null;
        this.invDetail = null;
        this.modalMode = null;
        this.modalPlot = -1;
        this.modalOnOk = null;
        this.resetModalScroll(); // 关闭后重置滚动位置
    },
    /* 通用确认弹窗:替代浏览器 confirm */
    confirmModal(title, html, onOk) {
        this.hideContextMenu();
        this.modalMode = 'confirm';
        this.modalTitle = title;
        this.modalHtml = html;
        this.modalOnOk = onOk;
    },
    confirmOk() {
        const cb = this.modalOnOk;
        this.modalOnOk = null;
        this.closeModal();
        if (cb) cb();
    },
    confirmCancel() {
        this.closeModal();
    },
    openLogModal() {
        this.hideContextMenu();
        this.modalMode = 'log';
        this.modalTitle = '日志';
    },

    /* ---------- 设置 / 主题 ---------- */
    toggleSettings() { this.settingsOpen = !this.settingsOpen; },
    applyTheme() { document.body.dataset.theme = this.theme; },

    /* ---------- 每秒定时 ---------- */
    tick() {
        this.now = Date.now();
        this.checkMature();
        this.checkFishMature();
        this.checkAnimals();
    },
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

    /* ---------- 全局事件 ---------- */
    onDocMousedown(e) {
        // 菜单内按钮都带 @mousedown.stop,能冒泡到这里的 mousedown 必在菜单外,直接关闭
        this.hideContextMenu();
        const wrap = this.$refs.settingsWrap;
        if (wrap && !wrap.contains(e.target)) this.settingsOpen = false;
    },
    onKeydown(e) {
        if (e.key === 'Escape') this.hideContextMenu();
    },
    onContextMenu(e) {
        e.preventDefault(); // 禁用浏览器默认右键菜单
    },

    /* ---------- 场景切换(农场 / 养殖场) ---------- */
    setScene(s) {
        this.hideContextMenu();
        this.closeModal(); // 切换场景时关闭打开的弹窗(商店内容随场景不同)
        this.scene = s;
        this.save(); // 记住场景,刷新后停留原地
    },
    toggleScene() {
        this.setScene(this.scene === 'farm' ? 'ranch' : 'farm');
    },
};
