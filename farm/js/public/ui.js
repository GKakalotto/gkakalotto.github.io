/* ================= 跨页面共享逻辑(商店/弹窗/设置/右键菜单/数量步进) =================
   农场页(index.html)与牧场页(ranch.html)是两个独立的 Vue 应用,
   本文件提供两者共用的 computed / methods,通过 typeof 防护兼容各页只加载部分全局数据。
   页面专属逻辑(save/load/resetGame/tick、种植/鱼塘/养殖等)放在各自 app/farm/pond/ranch 文件。 */

const uiComputed = {
    crops() { return (typeof CROPS !== 'undefined') ? CROPS : {}; },
    fishes() { return (typeof FISH !== 'undefined') ? FISH : {}; },
    levelText() { return 'Lv.' + this.level; },
    xpText() { return this.xp + '/' + xpNeeded(this.level); },
    seedKeys() { return Object.keys(this.inventory.seeds || {}); },
    itemKeys() { return Object.keys(this.inventory.items || {}); },
    fishFryKeys() { return this.fish ? Object.keys(this.fish.fries || {}) : []; },
    youngKeys() { return Object.keys(this.inventory.young || {}); },
    seedDisplayList() {
        const list = [];
        this.seedKeys.forEach(k => list.push({ kind: 'seed', key: k }));
        this.fishFryKeys.forEach(k => list.push({ kind: 'fry', key: k }));
        this.youngKeys.forEach(k => list.push({ kind: 'young', key: k }));
        return list;
    },
    logSlice() { return this.log.slice(-60).reverse(); },
    menuStyle() { return { left: this.menuX + 'px', top: this.menuY + 'px' }; },
    menuClearName() {
        const i = this.menuPlot;
        if (this.menuTarget === 'pond') {
            if (!this.pond) return '';
            const p = this.pond[i];
            return p ? '确定移除第 ' + (i + 1) + ' 个鱼塘的' + ((typeof FISH !== 'undefined' && FISH[p.type]) ? FISH[p.type].name : '') + '吗?' : '';
        }
        if (this.menuTarget === 'ranch') {
            if (!this.animals) return '';
            const a = this.animals[i];
            return a ? '确定移除第 ' + (i + 1) + ' 个栏位的' + ((typeof ANIMALS !== 'undefined' && ANIMALS[a.type]) ? ANIMALS[a.type].name : '') + '吗?' : '';
        }
        if (!this.plots) return '';
        const p = this.plots[i];
        if (!p || (this.isDryPlot && this.isDryPlot(p))) return '';
        return '确定铲除第 ' + (i + 1) + ' 块地的' + ((typeof CROPS !== 'undefined' && CROPS[p.type]) ? CROPS[p.type].name : '') + '吗?';
    },
};

const uiMethods = {
    /* ---------- 公共 ---------- */
    addLog(msg) {
        this.log.push({ t: Date.now(), msg: msg });
        if (this.log.length > 80) this.log = this.log.slice(-80);
    },
    shopBuyDisabled(group, key, cost) {
        const qty = this.qtyFor(group, key);
        return qty <= 0 || this.coins < cost * qty;
    },
    invSellDisabled(group, key, owned, locked) {
        const qty = this.qtyFor(group, key);
        return qty <= 0 || qty > (owned || 0) || !!locked;
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
        if (this.menuTarget === 'pond') { if (this.doClearPond) this.doClearPond(this.menuPlot); }
        else if (this.menuTarget === 'ranch') { if (this.doClearAnimal) this.doClearAnimal(this.menuPlot); }
        else { if (this.doClear) this.doClear(this.menuPlot); }
    },

    /* ---------- 时间格式化包装 ---------- */
    fmtDur(s) { return fmtDur(s); },
    fmtDurHM(s) { return fmtDurHM(s); },
    fmtRemain(s) { return fmtRemain(s); },
    fmtTime(t) { return fmtTime(t); },

    /* ---------- 响应式:检测移动端视口 ---------- */
    checkMobile() {
        this.isMobile = (typeof window !== 'undefined') ? (window.innerWidth <= 768) : false;
    },

    /* ---------- 仓库:作物/鱼/动物产物统一查名查价(带 typeof 防护) ---------- */
    itemName(key) {
        if (key === 'siliao' && typeof SILIAO !== 'undefined') return SILIAO.name;
        const it = (typeof CROPS !== 'undefined' && CROPS[key]) || (typeof FISH !== 'undefined' && FISH[key]) || (typeof ANIMAL_PRODUCTS !== 'undefined' && ANIMAL_PRODUCTS[key]);
        return it ? it.name : key;
    },
    itemSell(key) {
        if (key === 'siliao' && typeof SILIAO !== 'undefined') return SILIAO.sell;
        const it = (typeof CROPS !== 'undefined' && CROPS[key]) || (typeof FISH !== 'undefined' && FISH[key]) || (typeof ANIMAL_PRODUCTS !== 'undefined' && ANIMAL_PRODUCTS[key]);
        return it ? it.sell : 0;
    },

    /* ---------- 数量步进器(默认 0) ---------- */
    qtyFor(group, key) {
        const g = this.qtys[group];
        return g ? (g[key] || 0) : 0;
    },
    clampQty(group, key, v) {
        if (group === 'feedadd') {
            if (v < 0) v = 0;
            const cap = (typeof FEED_TROUGH_CAP !== 'undefined') ? FEED_TROUGH_CAP : 0;
            const max = Math.min((this.inventory.items && this.inventory.items['siliao']) || 0, cap - (this.feedTrough || 0));
            if (v > max) v = max;
            return v;
        }
        if (group === 'warehouseItems' || group === 'warehouseSeeds' || group === 'fishFries' || group === 'young') {
            const owned = group === 'warehouseItems' ? (this.inventory.items[key] || 0)
                : group === 'warehouseSeeds' ? (this.inventory.seeds[key] || 0)
                : group === 'fishFries' ? (this.fish.fries[key] || 0)
                : (this.inventory.young[key] || 0);
            if (v < 0) v = 0;
            if (v > owned) v = Math.max(0, owned);
            return v;
        }
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
        if (isNaN(v)) v = 0;
        if (!this.qtys[group]) this.$set(this.qtys, group, {});
        this.$set(this.qtys[group], key, this.clampQty(group, key, v));
    },

    /* ---------- 商店 ---------- */
    seedLocked(key) { return this.level < this.seedLevelReq(key); },
    openShopDetail(tab, key) {
        const locked = tab === 'crops' ? this.seedLocked(key)
            : tab === 'fish' ? this.fishLocked(key)
            : tab === 'ranch' ? this.animalLocked(key) : false;
        if (locked) return;
        this.shopDetail = { tab: tab, key: key };
    },
    closeShopDetail() {
        this.shopDetail = null;
        this.qtys.shop = {};
        this.qtys.fishshop = {};
        this.qtys.ranch = {};
        this.qtys.ranchfeed = {};
    },
    openShop() {
        this.hideContextMenu();
        this.shopDetail = null;
        this.modalMode = 'shop';
        this.modalTitle = '商店';
        this.shopTab = this.defaultShopTab;
    },

    /* ---------- 价格(共享,各页按需调用) ---------- */
    seedSellPrice(key) { return Math.floor(CROPS[key].cost / 2); },
    fishSellPrice(key) { return Math.floor(FISH[key].cost / 2); },
    animalSellPrice(key) { return Math.floor(ANIMALS[key].cost / 2); },
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

    /* ---------- 背包 / 仓库 ---------- */
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
    openInvDetail(mode, kind, key) {
        this.invDetail = { mode: mode, kind: kind, key: key };
    },
    closeInvDetail() {
        this.invDetail = null;
        this.qtys.warehouseItems = {};
        this.qtys.warehouseSeeds = {};
        this.qtys.fishFries = {};
        this.qtys.young = {};
    },
    setShopTab(tab) {
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
    sellItem(key) {
        if (this.inventory.locks[key]) { this.addLog(this.itemName(key) + ' 已锁定,请先解锁再出售'); this.save(); return; }
        const qty = Math.min(this.qtyFor('warehouseItems', key), this.inventory.items[key] || 0);
        if (qty <= 0) return;
        this.inventory.items[key] -= qty;
        if (this.inventory.items[key] <= 0) this.$delete(this.inventory.items, key);
        const price = this.itemSell(key);
        this.coins += price * qty;
        this.addLog('出售 ' + this.itemName(key) + ' x' + qty + ',获得 ' + (price * qty) + ' 金币');
        this.closeInvDetail();
        this.save();
    },
    unlockedTotalValue() {
        let total = 0;
        this.itemKeys.forEach((key) => {
            if (this.inventory.locks[key]) return;
            total += this.itemSell(key) * this.inventory.items[key];
        });
        return total;
    },
    backpackTotalValue() {
        let total = 0;
        this.seedKeys.forEach((k) => { total += this.seedSellPrice(k) * this.inventory.seeds[k]; });
        this.fishFryKeys.forEach((k) => { total += this.fishSellPrice(k) * this.fish.fries[k]; });
        this.youngKeys.forEach((k) => { total += this.animalSellPrice(k) * this.inventory.young[k]; });
        return total;
    },
    hasRecyclable() {
        return this.seedKeys.some(k => this.inventory.seeds[k] > 0)
            || this.fishFryKeys.some(k => this.fish.fries[k] > 0)
            || this.youngKeys.some(k => this.inventory.young[k] > 0);
    },
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
    onOverlayClick() { this.closeModal(); },
    closeModal() {
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
        this.resetModalScroll();
    },
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
    confirmCancel() { this.closeModal(); },
    openLogModal() {
        this.hideContextMenu();
        this.modalMode = 'log';
        this.modalTitle = '日志';
    },

    /* ---------- 设置 / 主题 ---------- */
    toggleSettings() { this.settingsOpen = !this.settingsOpen; },
    applyTheme() { document.body.dataset.theme = this.theme; },

    /* ---------- 全局事件 ---------- */
    onDocMousedown(e) {
        this.hideContextMenu();
        const wrap = this.$refs.settingsWrap;
        if (wrap && !wrap.contains(e.target)) this.settingsOpen = false;
    },
    onKeydown(e) {
        if (e.key === 'Escape') { this.hideContextMenu(); this.upgradeSelecting = false; }
    },
    onContextMenu(e) { e.preventDefault(); },

    /* ---------- 升级(奖励金币写入共享金币,经验等级各自独立) ---------- */
    addXp(n) {
        this.xp += n;
        while (this.xp >= xpNeeded(this.level)) {
            this.xp -= xpNeeded(this.level);
            this.level += 1;
            const bonus = Math.floor(100 * Math.sqrt(this.level) * Math.log(this.level));
            this.coins += bonus;
            this.addLog('等级提升!升到 Lv.' + this.level + ',奖励 ' + bonus + ' 金币,商店可能有新种子');
        }
    },
};

/* 各页共用的 UI 状态初值,data() 中通过 Object.assign 合并 */
function makeUiData() {
    return {
        theme: 'dark',
        now: Date.now(),
        isMobile: (typeof window !== 'undefined') ? (window.innerWidth <= 768) : false,
        settingsOpen: false,
        modalMode: null,
        modalTitle: '',
        modalPlot: -1,
        modalHtml: '',
        modalOnOk: null,
        shopTab: 'crops',
        shopDetail: null,
        invDetail: null,
        qtys: { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {}, young: {}, ranch: {}, ranchfeed: {}, feedadd: {} },
        menuVisible: false,
        menuTarget: 'plot',
        menuView: 'main',
        menuDirect: false,
        menuPlot: -1,
        menuX: 0,
        menuY: 0,
    };
}
