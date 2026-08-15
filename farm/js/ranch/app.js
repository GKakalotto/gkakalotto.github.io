/* ================= 牧场页 Vue 应用装配 =================
   只加载牧场相关数据(js/ranch/data.js、js/ranch/pond.js、js/ranch/ranch.js)与共享逻辑;
   金币与牧草(siliao)来自共享段,其余(等级/经验/鱼塘/栏位/牧槽)各自独立存档。 */
const ranchApp = new Vue({
    el: '#app',
    data: function () {
        const d = makeDefaultRanch();
        return Object.assign(makeUiData(), {
            coins: d.coins,
            level: d.level,
            xp: d.xp,
            pond: d.pond,
            unlockedPonds: d.unlockedPonds,
            animals: d.animals,
            unlockedRanches: d.unlockedRanches,
            feedTrough: d.feedTrough,
            fish: d.fish,
            inventory: d.inventory,
            log: d.log,
            defaultShopTab: 'fish',
            shopTab: 'fish',
        });
    },
    computed: Object.assign({}, uiComputed, pondComputed, ranchComputed),
    watch: {
        theme() { this.applyTheme(); this.save(); },
        modalMode(val) { document.body.style.overflow = val ? 'hidden' : ''; },
    },
    created() {
        document.addEventListener('mousedown', this.onDocMousedown);
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('resize', this.checkMobile);
        this.load();
        this.applyTheme();
        this.timer = setInterval(this.tick, 1000);
    },
    beforeDestroy() {
        clearInterval(this.timer);
        document.removeEventListener('mousedown', this.onDocMousedown);
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('contextmenu', this.onContextMenu);
        window.removeEventListener('resize', this.checkMobile);
    },
    methods: Object.assign({}, uiMethods, pondMethods, ranchMethods, {
        /* ---------- 存档:牧场进度各自存,金币/仓库/锁定/主题写入共享段 ---------- */
        save() {
            try {
                const state = {
                    level: this.level,
                    xp: this.xp,
                    pond: this.pond,
                    unlockedPonds: this.unlockedPonds,
                    animals: this.animals,
                    unlockedRanches: this.unlockedRanches,
                    feedTrough: this.feedTrough,
                    inventory: { young: this.inventory.young }, // items(仓库)与 locks(锁定)在共享段
                    fish: this.fish,
                    log: this.log,
                };
                localStorage.setItem(RANCH_SAVE_KEY, JSON.stringify(state));
                writeShared(this.coins, this.inventory.items, this.inventory.locks, this.theme); // 金币 + 仓库 + 锁定 + 主题共享
            } catch (e) { /* 无持久化时游戏仍可运行 */ }
        },
        load() {
            let s = null;
            try {
                const raw = localStorage.getItem(RANCH_SAVE_KEY);
                if (raw) s = JSON.parse(raw);
            } catch (e) { /* 忽略损坏的存档 */ }
            const shared = readShared();
            const items = shared.items || {};
            const locks = shared.locks || {};
            if (!s || !Array.isArray(s.pond) || s.pond.length !== TOTAL_PONDS
                || !Array.isArray(s.unlockedPonds) || s.unlockedPonds.length !== TOTAL_PONDS
                || !Array.isArray(s.animals) || s.animals.length !== RANCH_TOTAL
                || !Array.isArray(s.unlockedRanches) || s.unlockedRanches.length !== RANCH_TOTAL
                || !s.fish) {
                const d = makeDefaultRanch();
                this.coins = shared.coins;
                this.level = d.level;
                this.xp = d.xp;
                this.theme = shared.theme;
                this.pond = d.pond;
                this.unlockedPonds = d.unlockedPonds;
                this.animals = d.animals;
                this.unlockedRanches = d.unlockedRanches;
                this.feedTrough = d.feedTrough;
                this.fish = d.fish;
                this.inventory = { young: d.inventory.young, items: items, locks: locks };
                this.log = d.log;
                return;
            }
            this.coins = shared.coins;
            this.level = s.level;
            this.xp = s.xp;
            this.theme = shared.theme;
            this.pond = s.pond;
            this.unlockedPonds = s.unlockedPonds;
            this.animals = s.animals;
            this.unlockedRanches = s.unlockedRanches;
            this.feedTrough = s.feedTrough || 0;
            this.fish = s.fish;
            this.inventory = { young: (s.inventory && s.inventory.young) || {}, items: items, locks: locks };
            this.log = Array.isArray(s.log) ? s.log : makeDefaultRanch().log;
        },
        resetGame() {
            this.settingsOpen = false;
            this.confirmModal('重置进度', '确定要重置牧场、农场及共享数据吗?此操作不可恢复', () => {
                clearAllSaves(); // 牧场 + 农场 + 共享三段存档一并清除
                const d = makeDefaultRanch();
                this.coins = d.coins;
                this.level = d.level;
                this.xp = d.xp;
                this.pond = d.pond;
                this.unlockedPonds = d.unlockedPonds;
                this.animals = d.animals;
                this.unlockedRanches = d.unlockedRanches;
                this.feedTrough = d.feedTrough;
                this.fish = d.fish;
                this.qtys = { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {}, young: {}, ranch: {}, ranchfeed: {}, feedadd: {} };
                this.inventory = { young: d.inventory.young, items: {}, locks: {} };
                this.log = d.log;
                this.theme = 'dark';
                this.applyTheme();
                this.closeModal();
                this.save();
            });
        },
        tick() {
            this.now = Date.now();
            this.checkFishMature();
            this.checkAnimals();
        },
    }),
});
