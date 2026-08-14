/* ================= 农场页 Vue 应用装配 =================
   只加载农场相关数据(js/farm/data.js)与共享逻辑(js/public/ui.js、js/farm/farm.js);
   金币与牧草(siliao)来自共享段,其余(等级/经验/地块/仓库种子)各自独立存档。 */
const farmApp = new Vue({
    el: '#app',
    data: function () {
        const d = makeDefaultFarm();
        return Object.assign(makeUiData(), {
            coins: d.coins,
            level: d.level,
            xp: d.xp,
            plots: d.plots,
            unlockedPlots: d.unlockedPlots,
            plotGrade: d.plotGrade,
            inventory: d.inventory,
            log: d.log,
            upgradeSelecting: false,
            defaultShopTab: 'crops',
            shopTab: 'crops',
        });
    },
    computed: Object.assign({}, uiComputed, farmComputed),
    watch: {
        theme() { this.applyTheme(); this.save(); },
        modalMode(val) { document.body.style.overflow = val ? 'hidden' : ''; },
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
    methods: Object.assign({}, uiMethods, farmMethods, {
        /* ---------- 存档:农场进度各自存,金币/仓库/锁定/主题写入共享段 ---------- */
        save() {
            try {
                const state = {
                    level: this.level,
                    xp: this.xp,
                    plots: this.plots,
                    unlockedPlots: this.unlockedPlots,
                    plotGrade: this.plotGrade,
                    inventory: { seeds: this.inventory.seeds }, // items(仓库)与 locks(锁定)在共享段
                    log: this.log,
                };
                localStorage.setItem(FARM_SAVE_KEY, JSON.stringify(state));
                writeShared(this.coins, this.inventory.items, this.inventory.locks, this.theme); // 金币 + 仓库 + 锁定 + 主题共享
            } catch (e) { /* 无持久化时游戏仍可运行 */ }
        },
        load() {
            let s = null;
            try {
                const raw = localStorage.getItem(FARM_SAVE_KEY);
                if (raw) s = JSON.parse(raw);
            } catch (e) { /* 忽略损坏的存档 */ }
            const shared = readShared();
            const items = shared.items || {};
            const locks = shared.locks || {};
            // 结构校验:损坏/不完整则回退默认,金币/仓库/锁定/主题始终来自共享段
            if (!s || !Array.isArray(s.plots) || s.plots.length !== TOTAL_PLOTS
                || !Array.isArray(s.unlockedPlots) || s.unlockedPlots.length !== TOTAL_PLOTS
                || !Array.isArray(s.plotGrade) || s.plotGrade.length !== TOTAL_PLOTS) {
                const d = makeDefaultFarm();
                this.coins = shared.coins;
                this.level = d.level;
                this.xp = d.xp;
                this.theme = shared.theme;
                this.plots = d.plots;
                this.unlockedPlots = d.unlockedPlots;
                this.plotGrade = d.plotGrade;
                this.inventory = { seeds: d.inventory.seeds, items: items, locks: locks };
                this.log = d.log;
                return;
            }
            this.coins = shared.coins;
            this.level = s.level;
            this.xp = s.xp;
            this.theme = shared.theme;
            this.plots = s.plots;
            this.unlockedPlots = s.unlockedPlots;
            this.plotGrade = s.plotGrade;
            this.inventory = { seeds: (s.inventory && s.inventory.seeds) || {}, items: items, locks: locks };
            this.log = Array.isArray(s.log) ? s.log : makeDefaultFarm().log;
        },
        resetGame() {
            this.settingsOpen = false;
            this.confirmModal('重置进度', '确定要重置当前存档吗? 此操作不可恢复', () => {
                clearAllSaves(); // 农场 + 牧场 + 共享三段存档一并清除
                const d = makeDefaultFarm();
                this.coins = d.coins;
                this.level = d.level;
                this.xp = d.xp;
                this.plots = d.plots;
                this.unlockedPlots = d.unlockedPlots;
                this.plotGrade = d.plotGrade;
                this.qtys = { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {}, young: {}, ranch: {}, ranchfeed: {}, feedadd: {} };
                this.inventory = { seeds: d.inventory.seeds, items: {}, locks: {} };
                this.log = d.log;
                this.theme = 'dark';
                this.applyTheme();
                this.closeModal();
                this.save();
            });
        },
        tick() {
            this.now = Date.now();
            this.checkMature();
        },
    }),
});
