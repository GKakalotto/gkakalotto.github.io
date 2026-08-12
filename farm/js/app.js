/* ================= Vue 应用装配 =================
   各功能模块(util/farm/pond/common)已分别定义常量对象,这里用 Object.assign 合并后实例化。 */
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
            unlockedPonds: d.unlockedPonds,
            animals: d.animals,
            unlockedRanches: d.unlockedRanches,
            feedTrough: d.feedTrough,
            inventory: d.inventory,
            fish: d.fish,
            log: d.log,
            theme: 'dark',
            now: Date.now(),              // 每秒刷新的时钟,驱动进度/倒计时
            scene: 'farm',                // 'farm' 农场 | 'ranch' 养殖场
            settingsOpen: false,
            modalMode: null,              // 'shop' | 'backpack' | 'warehouse' | 'unlock' | 'pondcell' | 'ranchcell' | 'feedadd' | 'log' | 'confirm'
            modalTitle: '',
            modalPlot: -1,
            modalHtml: '',
            modalOnOk: null,              // 通用确认弹窗的回调
            shopTab: 'crops',             // 商店标签:'crops' 作物 | 'fish' 鱼类 | 'ranch' 牧场
            shopDetail: null,             // 商店详情小窗:null 或 { tab:'crops'|'fish', key }
            invDetail: null,              // 背包/仓库二级详情:null 或 { mode:'backpack'|'warehouse', kind, key }
            qtys: { shop: {}, fishshop: {}, warehouseItems: {}, warehouseSeeds: {}, fishFries: {}, young: {}, ranch: {}, ranchfeed: {}, feedadd: {} },
            menuVisible: false,
            menuTarget: 'plot',           // 'plot' | 'pond' | 'ranch' 当前右键菜单属于哪个场景
            menuView: 'main',             // 'main' | 'plant' | 'stock' | 'clear'
            menuDirect: false,            // 是否由点击空地/空栏位直接进入列表(直接列表不显示返回按钮)
            menuPlot: -1,
            menuX: 0,
            menuY: 0,
        };
    },
    computed: Object.assign({}, commonComputed, farmComputed, pondComputed, ranchComputed),
    watch: {
        theme() {
            this.applyTheme();
            this.save();
        },
        modalMode(val) {
            // 弹窗打开时锁定页面滚动,关闭后恢复
            document.body.style.overflow = val ? 'hidden' : '';
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
    methods: Object.assign({}, commonMethods, farmMethods, pondMethods, ranchMethods),
});
