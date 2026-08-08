/* ================= 共享逻辑(状态/存档/商店/弹窗/设置/定时) ================= */
const commonComputed = {
    crops() { return CROPS; },
    fishes() { return FISH; },
    levelText() { return 'Lv.' + this.level; },
    xpText() { return this.xp + '/' + xpNeeded(this.level); },
    /* 雇佣农工:8小时内植物不会缺水 */
    hired() { return this.now < this.hireUntil; },
    hireOptions() { return HIRE_OPTIONS; },
    hireText() { return this.hired ? '雇佣中' : '雇佣农工'; },
    hireTitle() {
        return this.hired
            ? '雇佣中,植物不会缺水,剩余 ' + this.hireRemainText()
            : '点击选择雇佣时长(1/2/4/8小时),期间植物不会缺水';
    },
    seedKeys() { return Object.keys(this.inventory.seeds); },
    itemKeys() { return Object.keys(this.inventory.items); },
    fishFryKeys() { return Object.keys(this.fish.fries); },
    seedDisplayList() {
        const list = [];
        this.seedKeys.forEach(k => list.push({ kind: 'seed', key: k }));
        this.fishFryKeys.forEach(k => list.push({ kind: 'fry', key: k }));
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
        const p = this.plots[i];
        return p ? '确定铲除第 ' + (i + 1) + ' 块地的' + CROPS[p.type].name + '吗?' : '';
    },
};

const commonMethods = {
    /* ---------- 公共 ---------- */
    addLog(msg) {
        this.log.push({ t: Date.now(), msg: msg });
        if (this.log.length > 80) this.log = this.log.slice(-80);
    },
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                coins: this.coins, level: this.level, xp: this.xp, theme: this.theme,
                plots: this.plots, unlockedPlots: this.unlockedPlots, pond: this.pond,
                pondUnlocked: this.pondUnlocked, unlockedPonds: this.unlockedPonds,
                inventory: this.inventory, fish: this.fish, hireUntil: this.hireUntil, log: this.log,
            }));
        } catch (e) { /* 无持久化时游戏仍可运行 */ }
    },
    load() {
        let s = null;
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) s = JSON.parse(raw);
        } catch (e) { /* 忽略损坏的存档 */ }
        if (!s || !Array.isArray(s.plots) || s.plots.length !== TOTAL_PLOTS
            || !Array.isArray(s.unlockedPlots) || s.unlockedPlots.length !== TOTAL_PLOTS) return;
        this.coins = s.coins;
        this.level = s.level;
        this.xp = s.xp;
        this.theme = s.theme || 'dark';
        this.plots = s.plots;
        this.unlockedPlots = s.unlockedPlots;
        this.pond = Array.isArray(s.pond) && s.pond.length === TOTAL_PONDS
            ? s.pond : Array.from({ length: TOTAL_PONDS }, () => null);
        // 旧存档已有鱼塘内容的自动视为已解锁,避免已有进度被锁定隐藏
        this.pondUnlocked = !!s.pondUnlocked || this.pond.some(p => p !== null);
        // 各鱼塘格开放状态:缺失或长度不对时,按旧逻辑(区域解锁后随等级开放)回推
        this.unlockedPonds = (Array.isArray(s.unlockedPonds) && s.unlockedPonds.length === TOTAL_PONDS)
            ? s.unlockedPonds
            : (this.pondUnlocked
                ? Array.from({ length: TOTAL_PONDS }, (_, i) => i < POND_INITIAL_OPEN + Math.floor((this.level - POND_UNLOCK_LEVEL) / POND_EXPAND_INTERVAL))
                : Array.from({ length: TOTAL_PONDS }, () => false));
        this.inventory = s.inventory || { seeds: { luobo: 3 }, items: {}, locks: {} };
        if (!this.inventory.locks) this.inventory.locks = {};
        this.fish = s.fish || { fries: {} };
        if (!this.fish.fries) this.fish.fries = {};
        this.hireUntil = s.hireUntil || 0; // 旧存档无此字段 = 未雇佣
        this.log = Array.isArray(s.log) ? s.log : [];
        // 清理旧存档中已下架(水果)的作物/鱼,避免渲染报错
        this.plots.forEach((p, i) => {
            if (p && !CROPS[p.type]) this.$set(this.plots, i, null);
            else if (p && p.announced === undefined) this.$set(p, 'announced', false);
        });
        this.pond.forEach((p, i) => {
            if (p && !FISH[p.type]) this.$set(this.pond, i, null);
            else if (p && p.announced === undefined) this.$set(p, 'announced', false);
        });
        Object.keys(this.inventory.items).forEach((k) => { if (!CROPS[k] && !FISH[k]) this.$delete(this.inventory.items, k); });
        Object.keys(this.inventory.seeds).forEach((k) => { if (!CROPS[k]) this.$delete(this.inventory.seeds, k); });
        Object.keys(this.inventory.locks).forEach((k) => { if (!CROPS[k] && !FISH[k]) this.$delete(this.inventory.locks, k); });
        Object.keys(this.fish.fries).forEach((k) => { if (!FISH[k]) this.$delete(this.fish.fries, k); });
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
            this.pondUnlocked = d.pondUnlocked;
            this.unlockedPonds = d.unlockedPonds;
            this.qtys = { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {} };
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
            const bonus = 500;
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
        else this.doClear(this.menuPlot);
    },
    /* 时间格式化包装方法(供模板直接调用全局纯函数) */
    fmtDur(s) { return fmtDur(s); },
    fmtRemain(s) { return fmtRemain(s); },
    fmtTime(t) { return fmtTime(t); },

    /* ---------- 仓库:作物与鱼的物品统一处理 ---------- */
    itemName(key) { const it = CROPS[key] || FISH[key]; return it ? it.name : key; },
    itemSell(key) { const it = CROPS[key] || FISH[key]; return it ? it.sell : 0; },

    /* ---------- 数量步进器(默认 0) ---------- */
    qtyFor(group, key) { return this.qtys[group][key] || 0; },
    clampQty(group, key, v) {
        if (v < 0) v = 0;
        if (group === 'warehouseItems') {
            const owned = this.inventory.items[key] || 0;
            if (v > owned) v = Math.max(0, owned);
        } else if (group === 'warehouseSeeds') {
            const owned = this.inventory.seeds[key] || 0;
            if (v > owned) v = Math.max(0, owned);
        } else if (group === 'fishFries') {
            const owned = this.fish.fries[key] || 0;
            if (v > owned) v = Math.max(0, owned);
        }
        return v;
    },
    qtyChange(group, key, delta) {
        this.$set(this.qtys[group], key, this.clampQty(group, key, (this.qtys[group][key] || 0) + delta));
    },
    qtyInput(group, key, val) {
        let v = parseInt(val, 10);
        if (isNaN(v)) v = 0;
        this.$set(this.qtys[group], key, this.clampQty(group, key, v));
    },
    qtyInputLive(group, key, val) {
        let v = parseInt(val, 10);
        if (isNaN(v) || v < 0) v = 0;
        this.$set(this.qtys[group], key, v);
    },

    /* ---------- 商店 ---------- */
    seedLocked(key) { return this.level < this.seedLevelReq(key); },
    openShopDetail(tab, key) {
        // 未解锁禁止点击
        const locked = tab === 'crops' ? this.seedLocked(key) : this.fishLocked(key);
        if (locked) return;
        this.shopDetail = { tab: tab, key: key };
    },
    closeShopDetail() {
        this.shopDetail = null;
        // 关闭详情时重置数量,再次打开从 0 开始
        this.qtys.shop = {};
        this.qtys.fishshop = {};
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
            this.$set(this.qtys.shop, key, 0); // 买完重置数量框
        }
        this.save();
    },

    /* ---------- 背包 / 仓库 ---------- */
    seedSellPrice(key) { return Math.floor(CROPS[key].cost / 2); }, // 种子回收价 = 种子售价的一半
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
    setShopTab(tab) {
        // 切换标签:重置输入框数量、关闭详情、重置滚动位置
        this.qtys.shop = {};
        this.qtys.fishshop = {};
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
    // 背包页:一键回收全部种子和鱼苗(半价),与收获物品的一键出售相互独立
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
        if (n === 0) {
            this.addLog('背包里没有种子/鱼苗');
        } else {
            this.coins += total;
            this.addLog('回收全部 ' + n + ' 个种子/鱼苗,获得 ' + total + ' 金币');
        }
        this.save();
    },
    toggleLock(key) {
        this.$set(this.inventory.locks, key, !this.inventory.locks[key]);
        this.save();
    },

    /* ---------- 弹窗 ---------- */
    onOverlayClick() {
        // 详情对话框打开时,点击空白只关闭详情,不关闭商店
        if (this.shopDetail) { this.closeShopDetail(); return; }
        this.closeModal();
    },
    closeModal() {
        if (this.modalMode === 'shop') { this.qtys.shop = {}; this.qtys.fishshop = {}; }
        else if (this.modalMode === 'warehouse' || this.modalMode === 'backpack') { this.qtys.warehouseItems = {}; this.qtys.warehouseSeeds = {}; this.qtys.fishFries = {}; }
        this.shopDetail = null;
        this.modalMode = null;
        this.modalPlot = -1;
        this.modalOnOk = null;
        this.modalOnCancel = null;
        this.resetModalScroll(); // 关闭后重置滚动位置
    },
    showMessage(title, html) {
        this.hideContextMenu();
        this.modalMode = 'msg';
        this.modalTitle = title;
        this.modalHtml = html;
    },
    /* 通用确认弹窗:替代浏览器 confirm。onCancel 存在时,取消回到调用方指定的界面(而非关闭弹窗) */
    confirmModal(title, html, onOk, onCancel) {
        this.hideContextMenu();
        this.modalMode = 'confirm';
        this.modalTitle = title;
        this.modalHtml = html;
        this.modalOnOk = onOk;
        this.modalOnCancel = onCancel;
    },
    confirmOk() {
        const cb = this.modalOnOk;
        this.modalOnOk = null;
        this.modalOnCancel = null;
        this.closeModal();
        if (cb) cb();
    },
    confirmCancel() {
        const cb = this.modalOnCancel;
        this.modalOnCancel = null;
        this.modalOnOk = null;
        if (cb) cb(); // 有回调时由回调决定界面(如回到上一弹窗),否则直接关闭
        else this.closeModal();
    },
    openLogModal() {
        this.hideContextMenu();
        this.modalMode = 'log';
        this.modalTitle = '日志';
    },

    /* ---------- 设置 / 主题 ---------- */
    toggleSettings() { this.settingsOpen = !this.settingsOpen; },
    applyTheme() { document.body.dataset.theme = this.theme; },

    /* 雇佣农工:8 小时内植物不会缺水 */
    hireRemainText() {
        const secs = Math.max(0, Math.ceil((this.hireUntil - this.now) / 1000));
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        let text = '';
        if (h > 0) text += h + '小时';
        if (m > 0 || h > 0) text += m + '分';
        text += s + '秒';
        return text;
    },
    unhire() {
        this.confirmModal('解除雇佣', '确定要解除雇佣吗?剩余时长将作废', () => {
            this.hireUntil = 0;
            this.addLog('已解除雇佣,植物将恢复缺水机制');
            this.save();
        }, () => {
            // 取消:回到雇佣详情弹窗
            this.modalMode = 'hire';
            this.modalTitle = '雇佣状态';
        });
    },
    /* 雇佣农工:未雇佣时弹窗选择时长(确认后生效),已雇佣时弹窗显示状态 */
    openHireModal() {
        this.hideContextMenu();
        this.modalMode = 'hire';
        this.modalTitle = this.hired ? '雇佣状态' : '雇佣农工';
    },
    hireFarmhand(opt) {
        this.confirmModal('雇佣农工', '确定雇佣 <b>' + opt.hours + '</b> 小时?花费 <b>' + opt.cost + '</b> 金币,期间植物不会缺水', () => {
            if (this.coins < opt.cost) {
                this.addLog('金币不足,雇佣 ' + opt.hours + ' 小时需要 ' + opt.cost + ' 金币');
                return;
            }
            this.coins -= opt.cost;
            this.hireUntil = Date.now() + opt.hours * 3600 * 1000;
            // 立即浇好当前所有缺水植物,并取消已预约的干旱
            let watered = 0;
            this.plots.forEach((p) => {
                if (!p) return;
                if (p.dry) { p.dry = false; p.resumedAt = Date.now(); watered++; }
                p.droughtAt = null;
            });
            this.addLog('雇佣了农工 ' + opt.hours + ' 小时,期间植物不会缺水' + (watered > 0 ? ',已浇好 ' + watered + ' 棵缺水植物' : ''));
            this.save();
        }, () => {
            // 取消:回到雇佣选择弹窗
            this.modalMode = 'hire';
            this.modalTitle = '雇佣农工';
        });
    },

    /* ---------- 每秒定时 ---------- */
    tick() {
        this.now = Date.now();
        this.checkDrought();
        this.checkMature();
        this.checkFishMature();
    },
    checkDrought() {
        if (this.hired) return; // 雇佣期间植物不会缺水
        const now = Date.now();
        let hit = false;
        this.plots.forEach((p, i) => {
            if (p && !p.dry && !p.announced && p.droughtAt && now >= p.droughtAt && this.plotProgress(i) < 1) {
                p.accrued += now - p.resumedAt; // 冻结当前进度
                p.resumedAt = now;
                p.dry = true;
                p.droughtAt = null;
                this.addLog(CROPS[p.type].name + ' 缺水了!生长暂停,快浇水');
                hit = true;
            }
        });
        if (hit) this.save();
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
};
