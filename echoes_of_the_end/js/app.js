// ============ 主实例：状态数据 + 生命周期；逻辑按域拆分在 js/mixins/ ============
// 常量见 js/constants.js，mixin 见 js/mixins/*.js（均须在 app.js 之前加载）

// 存档读取（loadGame 用）
function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

new Vue({
    el: '#app',
    // 时间环境（core）/ iframe 通信与移动协调（frame）/ 地图数学与路径（navigation）
    // 地图移动与弹窗（travel）/ 背包床仓库工作台操作（inventory）/ 存档（save）
    mixins: [CoreMixin, FrameMixin, NavigationMixin, TravelMixin, InventoryMixin, SaveMixin],
    data: {
        // 游戏时间（游戏秒）：开局为 startHour 对应时刻
        gameSeconds: GameData.startHour * HOUR_SECONDS,
        // 跨天 / 跨季检测
        lastDay: 0,
        lastSeason: 0,
        // 当前天气（每天 0 点随机一次）
        weatherName: GameData.startWeather,
        // 玩家状态（初始值来自数据文件）
        stats: { ...GameData.initialStats },
        // 状态面板条目（key 对应 stats 字段与 CSS 类名）
        statItems: [
            { key: 'hp',         icon: '♥',   label: '生命' },
            { key: 'hunger',     icon: '🍖',  label: '饱食' },
            { key: 'water',      icon: '💧',  label: '水分' },
            { key: 'sanity',     icon: '🧠',  label: '理智' },
            { key: 'stamina',    icon: '⚡',  label: '精力' },
            { key: 'physical',   icon: '💪',  label: '体力' },
            { key: 'health',     icon: '💚',  label: '健康' },
            { key: 'strength',   icon: '🥊',  label: '力量' },
            { key: 'speed',      icon: '💨',  label: '速度' },
            { key: 'knowledge',  icon: '📚',  label: '知识' }
        ],
        // 当前场景：'safehouse' 安全屋 / 'map' 地图 / 'place' 地点占位
        currentScene: GameData.startScene,
        // 玩家当前位置（'safehouse' 或地点名）
        playerLocation: 'safehouse',
        // 确认弹窗：action 为 'go' 前往地点 / 'home' 返回安全屋
        dialog: { show: false, icon: '', title: '', desc: '', cost: '', action: '' },
        // 待确认前往的地点
        pendingLoc: null,
        // 待确认前往的公园/树格
        pendingCell: null,
        // 本次确认的耗时（弹窗与实际移动共用，保证一致）
        pendingSeconds: 0,
        // 移动动画进行中（期间禁止发起新的移动）
        moving: false,
        // 当前进入的地点占位信息（进入地点/公园/森林后显示）
        currentPlace: null,
        // 设置面板
        showSettings: false,
        // 状态面板（❤ 按钮切换）
        showStats: false,
        // 当前 iframe 加载页：null 为场景页（safehouse/map/place），bag/bed/storage/workbench/furniture 为对应子页
        currentPage: null,
        // 当前家具详情（furniture 页用）
        currentFurniture: null,
        // 当前床（bed 页用）
        currentBed: null,
        // 正在睡觉的动画模式（'1h' / '4h' / 'dawn'），动画期间禁止重复点击
        sleeping: null,
        // 睡觉动画期间的时间加速状态
        sleepDelta: 0,    // 本次要推进的游戏秒数
        sleepTarget: 0,   // 目标 gameSeconds
        sleepRAF: null,   // requestAnimationFrame 句柄
        // 正在烹饪/榨汁的菜单项（{ kind: 'stove'|'juicer', name, output, inputs }），动画期间禁止重复点击
        cooking: null,
        cookTarget: 0,    // 烹饪结束的目标 gameSeconds
        cookRAF: null,    // requestAnimationFrame 句柄
        // 当前工作台（workbench 页用）
        currentWorkbench: null,
        // 当前仓库（storage 页用）
        currentStorage: null,
        // 当前篝火（fire 页用）
        currentFire: null,
        // 当前灶台 / 雨水收集器 / 椅子 / 榨汁机（对应子页用）
        currentStove: null,
        currentRain: null,
        currentChair: null,
        currentJuicer: null,
        // 篝火燃料烧尽时刻（游戏秒）：gameSeconds 小于它即为燃烧中，剩余时长 = (fireFuelUntil - gameSeconds) / HOUR_SECONDS
        fireFuelUntil: 0,
        // 背包物品（初始物资，来自数据文件）
        bag: GameData.bag,
        // 背包等级（0 起，升级扩充 bagMax）
        bagLevel: 0,
        // 仓库存储物品（独立于背包，可互相移动）
        storageItems: [],
        // 背包最大容量
        bagMax: 30,
        // 清除进度确认弹窗
        confirmDialog: { show: false, title: '', desc: '' },
        // 安全屋家具
        furniture: GameData.furniture,
        // 安全屋室外设施
        outdoors: GameData.outdoors,
        // 地图地点
        locations: MapData.locations,
        // 日志（上限 20 条，面板内滚动显示）
        logs: GameData.initialLogs.slice()
    },
    // 首次渲染前读取存档，避免刷新时非当前场景/弹框闪现
    created() {
        const hasSave = this.loadGame();
        const totalDay = Math.floor(this.gameSeconds / DAY_SECONDS);
        this.lastDay = totalDay;
        this.lastSeason = Math.floor(totalDay / DAYS_PER_SEASON) % SEASONS.length;
        if (hasSave) {
            // 读档：清空初始日志，按当前游戏位置打印一条正确时间的日志
            this.logs = [];
            this.pushLog(`回到存档时刻：第 ${this.day} 天 ${this.time}，${this.weather}。`);
        } else {
            // 新档随机当天天气，保留初始日志（时间与开局 6:00 一致）
            this.rollWeather();
        }
        // 读档后双帧初始 src 直接指向当前场景，避免刷新时闪现错误场景
        this.frameSrc0 = this.sceneSrc;
        this.frameSrc1 = this.sceneSrc;
        this.pendingFrame = -1;
    },
    mounted() {
        // 只有页面打开时才计时：页面隐藏/关闭即停止并保存进度
        window.addEventListener('beforeunload', this.saveGame);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        // 监听场景 iframe 发来的交互消息
        window.addEventListener('message', this.onSceneMessage);
        this.clockTimer = setInterval(() => this.tick(), 1000);
        // 等 Vue 完全加载后再显示界面（#app 初始为内联隐藏）
        this.$el.removeAttribute('v-cloak');
        this.$el.style.display = '';
        // 初始状态推送由场景帧 load 事件（onFrameLoad）负责
    },
    beforeDestroy() {
        this.saveGame(true);
        window.removeEventListener('beforeunload', this.saveGame);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('message', this.onSceneMessage);
        if (this.travelRAF) {
            cancelAnimationFrame(this.travelRAF);
            this.travelRAF = null;
        }
        clearInterval(this.clockTimer);
        this.clockTimer = null;
    }
});
