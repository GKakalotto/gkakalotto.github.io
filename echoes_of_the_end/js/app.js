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
        // 上次睡觉的游戏时刻（用于失眠判定；开局视为刚睡醒，给予 24 小时宽限）
        lastSleepAt: GameData.startHour * HOUR_SECONDS,
        // 跨天 / 跨季检测
        lastDay: 0,
        lastSeason: 0,
        // 当前天气（每天 0 点随机一次）
        weatherName: GameData.startWeather,
        // 玩家状态（初始值来自数据文件）
        stats: { ...GameData.initialStats },
        // 人物状态条条目（key 对应 stats 字段；icon 为状态标识）
        statItems: [
            { key: 'hp',         icon: '💗',   label: '生命' },
            { key: 'hunger',     icon: '🥩',  label: '饱食' },
            { key: 'water',      icon: '💧',  label: '水分' },
            { key: 'sanity',     icon: '🧠',  label: '理智' },
            { key: 'health',     icon: '💚',  label: '健康' },
            { key: 'strength',   icon: '💪',  label: '力量' }
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
        // 状态详情弹窗（点击状态图标弹出；null 为关闭）
        statDetail: null,
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
        // 地图资源单次动作（'chop' 砍树 / 'dig' 挖黏土），进度条动画期间推进游戏时间
        activity: null,
        actionTarget: 0,  // 动作结束的目标 gameSeconds
        actionRAF: null,  // requestAnimationFrame 句柄
        // 持续搜索状态：开启后时间正常流动，每累计 SEARCH_INTERVAL 游戏秒随机产出一次
        searching: false,
        searchAccum: 0,   // 已累计的搜索游戏秒
        // 低状态阈值提示标记：各状态首次跌破 30% 时日志提示一次，回升后复位
        lowWarned: { hunger: false, water: false, sanity: false, hp: false, health: false },
        // 失眠提示标记：超过 24 小时未睡觉时提示一次，睡觉后复位
        insomniaWarned: false,
        // 健康归零后游戏结束标志（防止重复触发重开）
        gameOver: false,
        // 稀有武器整档限量：物品名 → 档内掉落上限（新档随机 1~3）
        rarityCaps: {},
        // 战斗状态：{ zombie, zombieHp, playerHp, logs, won, over, atk, def }；遇敌后进入战斗页，胜利才继续原流程
        battle: null,
        pendingAfterBattle: null,   // 战斗胜利后继续执行的移动完成回调
        battleTimer: null,          // 逐回合定时器句柄
        // 当前工作台（workbench 页用）
        currentWorkbench: null,
        // 当前仓库（storage 页用）
        currentStorage: null,
        // 当前篝火（fire 页用）
        currentFire: null,
        // 当前灶台 / 雨水收集器 / 榨汁机 / 熔炉（对应子页用）
        currentStove: null,
        currentRain: null,
        currentJuicer: null,
        currentFurnace: null,
        // 熔炉燃料：剩余可燃烧的游戏秒（每块木板 = 1 游戏小时 = 3600 游戏秒），仅加工时消耗
        furnaceFuel: 0,
        // 熔炉后台加工任务队列：最多 6 个槽同时加工；每项 { kind: 'plastic'|'iron', remaining: 剩余游戏秒 }
        furnaceJobs: [],
        // 当前种植园（plantation 页用）
        currentPlantation: null,
        // 种植园作物队列：最多当前等级槽位数；每项 { name, seed, type, total, remaining }（remaining<=0 即可收获）
        plantationJobs: [],
        // 篝火燃料烧尽时刻（游戏秒）：gameSeconds 小于它即为燃烧中，剩余时长 = (fireFuelUntil - gameSeconds) / HOUR_SECONDS
        fireFuelUntil: 0,
        // 背包物品（初始物资，来自数据文件）
        bag: GameData.bag,
        // 背包等级（0 起，升级扩充 bagMax）
        bagLevel: 0,
        // 仓库存储物品（独立于背包，可互相移动）
        storageItems: [],
        // 地图资源格状态：'park:gx,gy' / 'tree:gx,gy' → { trees, clay, herbs }（首次进入时生成，资源有限）
        cellResources: {},
        // 地点搜刮次数状态：地点名 → { roomsLeft: N }（首次进入时生成，搜刮完为止）
        locationResources: {},
        // 地点暂存区：地点名 → 物品数组（搜刮时未带走的物资，无限容量，可回来取）
        placeStash: {},
        // 当前房间搜刮出的待选取物资（搜刮结算后弹窗展示，玩家确认后清空）
        pendingLoot: null,
        // 装备槽：武器 / 帽子 / 防具（装备后从背包取出，不占背包格）
        equipment: { weapon: null, tool: null, hat: null, armor: null },
        // 背包最大容量（初始为 0 级容量，读档后按背包等级更新）
        bagMax: 20,
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
        // 稀有武器档内上限：消防斧/武士刀整档各 1 把（无条件覆盖，旧档同样生效）；撬棍随机 1~3
        this.rarityCaps['消防斧'] = 1;
        this.rarityCaps['武士刀'] = 1;
        if (!this.rarityCaps['撬棍']) this.rarityCaps['撬棍'] = this.randInt(1, 3);
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
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
        clearInterval(this.clockTimer);
        this.clockTimer = null;
    }
});
