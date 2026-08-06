/* ================= 纯工具函数 ================= */
/* 升级经验:三次曲线,越往后每级所需经验越多 */
function xpNeeded(level) { return Math.floor(level * level * level / 8 + level * 100); }

function fmtDur(s) {
    if (s >= 60) {
        const m = Math.floor(s / 60), r = s % 60;
        return m + '分' + (r > 0 ? r + '秒' : '');
    }
    return s + '秒';
}
function fmtRemain(s) { return fmtDur(s) + '后成熟'; }
function fmtTime(t) {
    const d = new Date(t);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
}
/* 定位标签查找表(CROPS 与 FISH 共用同一套三定位循环,key 不重叠) */
const KIND_LABEL = {}, KIND_CLS = {};
CROP_KEYS.forEach((k, i) => { KIND_LABEL[k] = CROP_KIND[i % 3].label; KIND_CLS[k] = CROP_KIND[i % 3].cls; });
FISH_KEYS.forEach((k, i) => { KIND_LABEL[k] = CROP_KIND[i % 3].label; KIND_CLS[k] = CROP_KIND[i % 3].cls; });

/* ================= 默认状态 ================= */
function makeDefaultState() {
    return {
        coins: 100,
        level: 1,
        xp: 0,
        plots: Array.from({ length: TOTAL_PLOTS }, () => null),
        unlockedPlots: Array.from({ length: TOTAL_PLOTS }, (_, i) => i < INITIAL_UNLOCKED),
        pond: Array.from({ length: TOTAL_PONDS }, () => null), // 鱼塘 2×5 共 10 格
        pondUnlocked: false,             // 鱼塘默认锁定,10级+5000金币整体解锁
        inventory: { seeds: { luobo: 3 }, items: {}, locks: {} },
        fish: { fries: {} },             // 鱼苗库存(成鱼收获后进 inventory.items)
        tools: { hoe: false, shovel: false, fishNet: false },
        log: [{ t: Date.now(), msg: '欢迎来到 星露谷农场!点空地种菜,生长中可能随机缺水需浇水;达到等级后解锁更多土地。' }],
    };
}

/* ================= Vue 应用 ================= */
const app = new Vue({
    el: '#app',
    data: function () {
        const d = makeDefaultState();
        return {
            coins: d.coins,
            level: d.level,
            xp: d.xp,
            plots: d.plots,
            unlockedPlots: d.unlockedPlots,
            pond: d.pond,
            pondUnlocked: d.pondUnlocked,
            inventory: d.inventory,
            fish: d.fish,
            tools: d.tools,
            log: d.log,
            theme: 'dark',
            now: Date.now(),              // 每秒刷新的时钟,驱动进度/倒计时
            settingsOpen: false,
            modalMode: null,              // 'shop' | 'warehouse' | 'unlock' | 'log' | 'msg'
            modalTitle: '',
            modalPlot: -1,
            modalHtml: '',
            modalOnOk: null,              // 通用确认弹窗的回调
            shopTab: 'crops',             // 商店标签:'crops' 作物 | 'fish' 鱼类
            warehouseTab: 'seeds',
            qtys: { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {} },
            menuVisible: false,
            menuTarget: 'plot',           // 'plot' | 'pond' 当前右键菜单属于农田还是鱼塘
            menuView: 'main',             // 'main' | 'plant' | 'stock' | 'clear'
            menuPlot: -1,
            menuX: 0,
            menuY: 0,
        };
    },
    computed: {
        crops() { return CROPS; },
        fishes() { return FISH; },
        levelText() { return 'Lv.' + this.level; },
        xpText() { return this.xp + '/' + xpNeeded(this.level); },
        toolHoeText() { return '锄头' + (this.tools.hoe ? '✓' : '(买)'); },
        toolShovelText() { return '铲子' + (this.tools.shovel ? '✓' : '(买)'); },
        netText() {
            return this.tools.fishNet ? '一键捕捞' : '渔网(买)';
        },
        netTitle() {
            if (this.tools.fishNet) return '一键捕捞鱼塘里已长大的鱼';
            return this.pondUnlocked ? '花费 ' + FISH_NET_COST + ' 金币解锁渔网' : '需先解锁鱼塘才能购买渔网';
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
        menuPlantDisabled() { return this.plots[this.menuPlot] !== null; },
        menuWaterEnabled() { const p = this.plots[this.menuPlot]; return !!p && p.dry; },
        menuHarvestEnabled() { const p = this.plots[this.menuPlot]; return !!p && this.plotProgress(this.menuPlot) >= 1; },
        menuClearDisabled() { const p = this.plots[this.menuPlot]; return !p || !this.tools.shovel; },
        menuStockDisabled() { return this.pond[this.menuPlot] !== null; },
        menuPondHarvestEnabled() { const p = this.pond[this.menuPlot]; return !!p && this.tools.fishNet && this.pondProgress(this.menuPlot) >= 1; },
        menuPondClearEnabled() { return this.pond[this.menuPlot] !== null; },
        menuClearName() {
            const i = this.menuPlot;
            if (this.menuTarget === 'pond') {
                const p = this.pond[i];
                return p ? '确定移除第 ' + (i + 1) + ' 个鱼塘的' + FISH[p.type].name + '吗?' : '';
            }
            const p = this.plots[i];
            return p ? '确定铲除第 ' + (i + 1) + ' 块地的' + CROPS[p.type].name + '吗?' : '';
        },
        pondUnlockLevel() { return POND_UNLOCK_LEVEL; },
        pondUnlockCost() { return POND_UNLOCK_COST; },
        pondBonusCount() { return POND_BONUS_COUNT; },
        pondBonusName() { return FISH[POND_BONUS_FRY].name; },
        pondTotal() { return TOTAL_PONDS; },
    },
    watch: {
        theme() {
            this.applyTheme();
            this.save();
        },
    },
    created() {
        document.addEventListener('mousedown', this.onDocMousedown);
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('contextmenu', this.onContextMenu);
        this.load();
        this.applyTheme();
        this.timer = setInterval(this.tick, 1000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
        document.removeEventListener('mousedown', this.onDocMousedown);
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('contextmenu', this.onContextMenu);
    },
    methods: {
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
                    pondUnlocked: this.pondUnlocked,
                    inventory: this.inventory, fish: this.fish, tools: this.tools, log: this.log,
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
            this.inventory = s.inventory || { seeds: { luobo: 3 }, items: {}, locks: {} };
            if (!this.inventory.locks) this.inventory.locks = {};
            this.fish = s.fish || { fries: {} };
            if (!this.fish.fries) this.fish.fries = {};
            this.tools = s.tools || { hoe: false, shovel: false };
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
                this.inventory = d.inventory;
                this.fish = d.fish;
                this.tools = d.tools;
                this.log = d.log;
                this.closeModal();
                this.save();
            });
        },

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
        seedLevelReq(key) { return SEED_LEVEL_REQ[key]; },
        plotLevelReq(i) { return PLOT_LEVEL_REQ[i]; },
        plotUnlockCost(i) { return PLOT_UNLOCK_COST[i]; },
        fmtDur(s) { return fmtDur(s); },
        fmtRemain(s) { return fmtRemain(s); },
        fmtTime(t) { return fmtTime(t); },

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
            return this.plots[i] === null ? '点击查看' : '';
        },
        onPlotClick(i, e) {
            if (!this.unlockedPlots[i]) { this.openUnlockModal(i); return; }
            this.openPlotMenu(i, e);
        },

        /* ---------- 地块/鱼塘右键菜单 ---------- */
        openPlotMenu(i, e) {
            this.menuTarget = 'plot';
            this.menuPlot = i;
            this.menuX = e.clientX;
            this.menuY = e.clientY;
            this.menuView = 'main';
            this.menuVisible = true;
        },
        openPondMenu(i, e) {
            this.menuTarget = 'pond';
            this.menuPlot = i;
            this.menuX = e.clientX;
            this.menuY = e.clientY;
            this.menuView = 'main';
            this.menuVisible = true;
        },
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
        doClear(i) {
            const p = this.plots[i];
            if (!p) return;
            this.$set(this.plots, i, null);
            this.hideContextMenu();
            this.addLog('铲除了第 ' + (i + 1) + ' 块地的' + CROPS[p.type].name);
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
            // 随机干旱事件:种植时掷骰,在生长的 30%~80% 时刻触发
            const willDrought = Math.random() < DROUGHT_CHANCE;
            const droughtAt = willDrought ? now + c.grow * 1000 * (0.3 + Math.random() * 0.5) : null;
            this.$set(this.plots, i, {
                type: key,
                accrued: 0,
                resumedAt: now,
                dry: false,
                droughtAt: droughtAt,
                announced: false,
            });
            this.addLog('种下了 ' + c.name + (willDrought ? '(这颗可能遭遇干旱)' : ''));
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
            this.$set(this.inventory.items, type, (this.inventory.items[type] || 0) + 1);
            this.$set(this.plots, i, null);
            this.addLog('收获 ' + c.name + ' x1,已放入仓库 +' + c.xp + ' 经验');
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
                    this.$set(this.inventory.items, type, (this.inventory.items[type] || 0) + 1);
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
        addXp(n) {
            this.xp += n;
            while (this.xp >= xpNeeded(this.level)) {
                this.xp -= xpNeeded(this.level);
                this.level += 1;
                const bonus = this.level * 20;
                this.coins += bonus;
                this.addLog('等级提升!升到 Lv.' + this.level + ',奖励 ' + bonus + ' 金币,商店可能有新种子');
            }
        },

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
            const p = this.pond[i];
            if (p === null) return 'plot empty';
            return this.pondProgress(i) >= 1 ? 'plot mature' : 'plot growing';
        },
        pondTitle(i) { return this.pond[i] === null ? '点击查看' : ''; },
        onPondClick(i, e) { this.openPondMenu(i, e); },

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
                this.$set(this.fish.fries, POND_BONUS_FRY, (this.fish.fries[POND_BONUS_FRY] || 0) + POND_BONUS_COUNT);
                this.addLog('解锁了鱼塘!一次开放全部 ' + TOTAL_PONDS + ' 格,赠送 ' + FISH[POND_BONUS_FRY].name + ' 鱼苗 x' + POND_BONUS_COUNT);
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
            this.addLog('投放了 ' + FISH[key].name + ' 鱼苗');
            this.hideContextMenu();
            this.save();
        },
        harvestFish(i) {
            if (!this.tools.fishNet) {
                this.addLog('需要购买渔网才能收鱼');
                return;
            }
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
            if (Math.random() < SEED_DROP_CHANCE) {
                this.$set(this.fish.fries, type, (this.fish.fries[type] || 0) + 1);
                this.addLog('掉落鱼苗!获得 ' + f.name + ' 鱼苗 x1');
            }
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
            if (!this.tools.fishNet) return; // 防御:无渔网不可一键捕捞
            let n = 0, xp = 0, fries = 0;
            this.pond.forEach((p, i) => {
                if (p && this.pondProgress(i) >= 1) {
                    const type = p.type;
                    this.$set(this.inventory.items, type, (this.inventory.items[type] || 0) + 1);
                    this.$set(this.pond, i, null);
                    n++;
                    xp += FISH[type].xp;
                    if (Math.random() < SEED_DROP_CHANCE) {
                        this.$set(this.fish.fries, type, (this.fish.fries[type] || 0) + 1);
                        fries++;
                    }
                }
            });
            if (n > 0) {
                this.addLog('一键捕捞 ' + n + ' 条,已放入仓库 +' + xp + ' 经验' + (fries > 0 ? ',掉落 ' + fries + ' 条鱼苗' : ''));
                this.addXp(xp);
            } else {
                this.addLog('鱼塘没有可捕捞的鱼');
            }
            this.save();
        },

        /* ---------- 商店鱼类 / 鱼苗 ---------- */
        fishName(key) { return FISH[key].name; },
        fishKindLabel(key) { return KIND_LABEL[key]; },
        fishKindCls(key) { return KIND_CLS[key]; },
        fishLevelReq(key) { return FISH_LEVEL_REQ[key]; },
        fishLocked(key) { return !this.pondUnlocked || this.level < FISH_LEVEL_REQ[key]; }, // 鱼塘未解锁时鱼苗全部锁定
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
        openShop() {
            this.hideContextMenu();
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

        /* ---------- 仓库 ---------- */
        seedSellPrice(key) { return Math.floor(CROPS[key].cost / 2); }, // 种子回收价 = 种子售价的一半
        openWarehouse() {
            this.hideContextMenu();
            this.modalMode = 'warehouse';
            this.modalTitle = '仓库';
            this.warehouseTab = 'seeds';
        },
        setWarehouseTab(tab) {
            // 切换标签:重置输入框数量与滚动位置
            this.qtys.warehouseSeeds = {};
            this.qtys.fishFries = {};
            this.qtys.warehouseItems = {};
            this.warehouseTab = tab;
            this.resetModalScroll();
        },
        setShopTab(tab) {
            // 切换标签:重置输入框数量与滚动位置
            this.qtys.shop = {};
            this.qtys.fishshop = {};
            this.shopTab = tab;
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
            const qty = Math.min(this.qtyFor('warehouseItems', key), this.inventory.items[key] || 0);
            if (qty <= 0) return;
            this.inventory.items[key] -= qty;
            if (this.inventory.items[key] <= 0) this.$delete(this.inventory.items, key);
            const price = this.itemSell(key);
            this.coins += price * qty;
            this.addLog('出售 ' + this.itemName(key) + ' x' + qty + ',获得 ' + (price * qty) + ' 金币');
            this.save();
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

        /* ---------- 解锁土地 ---------- */
        openUnlockModal(i) {
            this.hideContextMenu();
            this.modalPlot = i;
            this.modalMode = 'unlock';
            this.modalTitle = '解锁土地(第 ' + (i + 1) + ' 块)';
        },
        unlockOk(i) {
            return this.level >= this.plotLevelReq(i) && this.coins >= this.plotUnlockCost(i) && !!this.tools.hoe;
        },
        doUnlock(i) {
            const req = this.plotLevelReq(i);
            const cost = this.plotUnlockCost(i);
            if (!this.tools.hoe) { this.addLog('需要先购买锄头才能扩建土地'); }
            else if (this.level < req) { this.addLog('等级不足,需要 Lv.' + req + ' 才能解锁这块地'); }
            else if (this.coins < cost) { this.addLog('金币不足,解锁需要 ' + cost + ' 金币'); }
            else {
                this.coins -= cost;
                this.$set(this.unlockedPlots, i, true);
                this.addLog('解锁了第 ' + (i + 1) + ' 块地');
            }
            this.closeModal();
            this.save();
        },

        /* ---------- 弹窗 ---------- */
        closeModal() {
            if (this.modalMode === 'shop') { this.qtys.shop = {}; this.qtys.fishshop = {}; }
            else if (this.modalMode === 'warehouse') { this.qtys.warehouseItems = {}; this.qtys.warehouseSeeds = {}; this.qtys.fishFries = {}; }
            this.modalMode = null;
            this.modalPlot = -1;
            this.modalOnOk = null;
            this.resetModalScroll(); // 关闭后重置滚动位置
        },
        showMessage(title, html) {
            this.hideContextMenu();
            this.modalMode = 'msg';
            this.modalTitle = title;
            this.modalHtml = html;
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
        openLogModal() {
            this.hideContextMenu();
            this.modalMode = 'log';
            this.modalTitle = '日志';
        },

        /* ---------- 设置 / 主题 ---------- */
        toggleSettings() { this.settingsOpen = !this.settingsOpen; },
        applyTheme() { document.body.dataset.theme = this.theme; },

        /* ---------- 工具 ---------- */
        buyTool(key) {
            const t = TOOLS[key];
            if (this.tools[key]) {
                this.addLog(t.name + ' 已拥有');
                return;
            }
            if (this.level < t.levelReq) {
                this.showMessage('无法购买', t.name + '需要达到 <b>Lv.' + t.levelReq + '</b> 才能解锁,当前 Lv.' + this.level);
                return;
            }
            if (this.coins < t.cost) {
                this.showMessage('无法购买', '金币不足,购买' + t.name + '需要 <b>' + t.cost + '</b> 金币,当前仅 ' + this.coins + ' 金币');
                return;
            }
            this.confirmModal('购买' + t.name, '确定购买' + t.name + '?需要 <b>' + t.cost + '</b> 金币', () => {
                this.coins -= t.cost;
                this.$set(this.tools, key, true);
                this.addLog('购买了' + t.name + (key === 'hoe' ? ',现在可以扩建土地了' : ',可在地块菜单中铲除作物'));
                this.save();
            });
        },
        /* 渔网:鱼塘解锁后可花金币购买,购买后按钮变成一键捕捞 */
        buyNet() {
            if (this.tools.fishNet) { this.harvestFishAll(); return; }
            if (!this.pondUnlocked) {
                this.showMessage('无法购买', '需先解锁鱼塘才能购买渔网');
                return;
            }
            if (this.coins < FISH_NET_COST) {
                this.showMessage('无法购买', '金币不足,购买渔网需要 <b>' + FISH_NET_COST + '</b> 金币,当前仅 ' + this.coins + ' 金币');
                return;
            }
            this.confirmModal('购买渔网', '确定购买渔网?需要 <b>' + FISH_NET_COST + '</b> 金币', () => {
                this.coins -= FISH_NET_COST;
                this.$set(this.tools, 'fishNet', true);
                this.addLog('购买了渔网,现在可以一键捕捞鱼塘');
                this.save();
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
    },
});
