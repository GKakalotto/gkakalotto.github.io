// ============ 逻辑层：数据/配置来自 GameData（js/data.js） ============
const SEASONS = GameData.seasons;
const SEASON_BASE_TEMP = GameData.seasonBaseTemp;
const WEATHER_ICON = GameData.weatherIcon;
const WEATHER_TEMP_ADJ = GameData.weatherTempAdj;
const WEATHER_TABLE = GameData.weatherTable;
const SAVE_KEY = GameData.saveKey;

// 时间规则常量（由数据推导）
const MINUTE_SECONDS = GameData.secondsPerMinute;
const HOUR_SECONDS = GameData.minutesPerHour * MINUTE_SECONDS;
const HOURS_PER_DAY = GameData.hoursPerDay;
const DAY_SECONDS = HOURS_PER_DAY * HOUR_SECONDS;
const DAYS_PER_SEASON = GameData.daysPerSeason;
const GAME_SECONDS_PER_REAL_SECOND = GameData.realSecondToGameSecond;

// ============ 存档系统 ============
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
        // 当前场景：'safehouse' 安全屋 / 'map' 地图
        currentScene: GameData.startScene,
        // 玩家当前位置（'safehouse' 或地点名）
        playerLocation: 'safehouse',
        // 确认弹窗：action 为 'go' 前往地点 / 'home' 返回安全屋
        dialog: { show: false, icon: '', title: '', desc: '', cost: '', action: '' },
        // 待确认前往的地点
        pendingLoc: null,
        // 设置面板
        showSettings: false,
        // 清除进度确认弹窗
        confirmDialog: { show: false, title: '', desc: '' },
        // 安全屋家具
        furniture: GameData.furniture,
        // 安全屋室外设施
        outdoors: GameData.outdoors,
        // 地图地点
        locations: GameData.locations,
        // 日志（上限 20 条，面板内滚动显示）
        logs: GameData.initialLogs.slice()
    },
    computed: {
        // 季节内天数 1-30
        day() {
            return Math.floor(this.gameSeconds / DAY_SECONDS) % DAYS_PER_SEASON + 1;
        },
        // 季节序号：0 秋 / 1 冬 / 2 春 / 3 夏
        seasonIndex() {
            return Math.floor(Math.floor(this.gameSeconds / DAY_SECONDS) / DAYS_PER_SEASON) % SEASONS.length;
        },
        season() {
            const s = SEASONS[this.seasonIndex];
            return `${s.icon} ${s.name}`;
        },
        hour() {
            return Math.floor(this.gameSeconds / HOUR_SECONDS) % HOURS_PER_DAY;
        },
        minute() {
            return Math.floor(this.gameSeconds / MINUTE_SECONDS) % MINUTE_SECONDS;
        },
        time() {
            return `${this.pad(this.hour)}:${this.pad(this.minute)}`;
        },
        weather() {
            return `${WEATHER_ICON[this.weatherName]} ${this.weatherName}`;
        },
        // 温度 = 季节基准 + 昼夜波动（14 点最暖，2 点最冷，±4°C）+ 天气修正
        temperature() {
            const base = SEASON_BASE_TEMP[this.seasonIndex];
            const cycle = Math.round(4 * Math.cos(((this.hour - 14) / HOURS_PER_DAY) * 2 * Math.PI));
            const adj = WEATHER_TEMP_ADJ[this.weatherName] || 0;
            return Math.round(base + cycle + adj);
        },
        // 日志：只显示最新 5 条
        visibleLogs() {
            return this.logs.slice(-5);
        },
        // 安全屋节点画布位置（左下角，固定不变）
        safePos() {
            return {
                left: GameData.safehouseMapPos.lx + '%',
                top: GameData.safehouseMapPos.ly + '%'
            };
        },
        // 场景标题（固定栏显示，随场景切换）
        sceneTitle() {
            return this.currentScene === 'map' ? '🗺️ 成都' : '🏠 安全屋';
        },
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
    },
    mounted() {
        // 只有页面打开时才计时：页面隐藏/关闭即停止并保存进度
        window.addEventListener('beforeunload', this.saveGame);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.clockTimer = setInterval(() => this.tick(), 1000);
        // 等 Vue 完全加载后再显示界面（#app 初始为内联隐藏）
        this.$el.removeAttribute('v-cloak');
        this.$el.style.display = '';
    },
    beforeDestroy() {
        this.saveGame();
        window.removeEventListener('beforeunload', this.saveGame);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        clearInterval(this.clockTimer);
        this.clockTimer = null;
    },
    methods: {
        pad(n) {
            return n < 10 ? '0' + n : '' + n;
        },
        // 页面可见性变化：隐藏 → 停止计时并保存；可见 → 恢复计时
        onVisibilityChange() {
            if (document.hidden) {
                clearInterval(this.clockTimer);
                this.clockTimer = null;
                this.saveGame();
            } else if (!this.clockTimer) {
                this.clockTimer = setInterval(() => this.tick(), 1000);
            }
        },
        // 每秒推进游戏时间
        tick() {
            this.advanceGameTime(GAME_SECONDS_PER_REAL_SECOND);
        },
        // 推进游戏时间（秒），处理跨天/跨季
        advanceGameTime(seconds) {
            this.gameSeconds += seconds;
            const totalDay = Math.floor(this.gameSeconds / DAY_SECONDS);
            // 逐日推进：跨天重新随机天气
            while (this.lastDay < totalDay) {
                this.lastDay++;
                this.rollWeather();
                this.pushLog(`新的一天，第 ${this.day} 天，${this.weather}。`);
            }
            // 跨季节提示
            const si = Math.floor(totalDay / DAYS_PER_SEASON) % SEASONS.length;
            if (si !== this.lastSeason) {
                this.lastSeason = si;
                this.pushLog(`季节更替，${this.season}来临。`);
            }
            this.saveGame();
        },
        // 当前所在地坐标
        getLocationCoord() {
            if (this.playerLocation === 'safehouse') return GameData.safehouseCoord;
            const loc = this.locations.find(l => l.name === this.playerLocation);
            return loc ? { x: loc.x, y: loc.y } : GameData.safehouseCoord;
        },
        // 时长显示：X 小时 Y 分 / Y 分钟
        formatDuration(seconds) {
            const h = Math.floor(seconds / HOUR_SECONDS);
            const m = Math.round((seconds % HOUR_SECONDS) / MINUTE_SECONDS);
            if (h === 0) return `${m}分钟`;
            return m === 0 ? `${h}小时` : `${h}小时${m}分`;
        },
        // 画布坐标 → 百分比字符串（地图节点定位）
        posOf(node) {
            return { left: node.lx + '%', top: node.ly + '%' };
        },
        // 按当前季节权重随机天气
        rollWeather() {
            const table = WEATHER_TABLE[this.seasonIndex];
            const total = table.reduce((sum, item) => sum + item.w, 0);
            let r = Math.random() * total;
            for (const item of table) {
                r -= item.w;
                if (r <= 0) {
                    this.weatherName = item.n;
                    return;
                }
            }
            this.weatherName = table[0].n;
        },
        // 推开大门 → 地图
        goToMap() {
            this.currentScene = 'map';
            this.pushLog('你推开大门，湿冷的风迎面扑来。');
        },
        // 设置面板：打开 / 关闭（不记入日志）
        openSettings() {
            this.showSettings = true;
        },
        closeSettings() {
            this.showSettings = false;
        },
        // 背包（暂为占位）
        openBag() {
            this.pushLog('🎒 背包暂未开放，等待后续版本。');
        },
        // 存档：写入 localStorage
        saveGame() {
            try {
                const save = {
                    gameSeconds: this.gameSeconds,
                    weatherName: this.weatherName,
                    stats: { ...this.stats },
                    currentScene: this.currentScene,
                    playerLocation: this.playerLocation
                };
                localStorage.setItem(SAVE_KEY, JSON.stringify(save));
            } catch (e) {
                // 本地存储不可用时静默忽略
            }
        },
        // 读档：从 localStorage 恢复进度
        loadGame() {
            const save = loadSave();
            if (!save) return false;
            if (typeof save.gameSeconds === 'number') this.gameSeconds = save.gameSeconds;
            if (typeof save.weatherName === 'string') this.weatherName = save.weatherName;
            if (save.stats) Object.assign(this.stats, save.stats);
            if (save.currentScene) this.currentScene = save.currentScene;
            if (save.playerLocation) this.playerLocation = save.playerLocation;
            return true;
        },
        // 打开清除进度确认弹窗（不用浏览器 confirm）
        openClearConfirm() {
            this.confirmDialog = {
                show: true,
                title: '🗑️ 清除进度',
                desc: '确定清除所有进度吗？此操作不可恢复。'
            };
        },
        confirmCancel() {
            this.confirmDialog.show = false;
        },
        // 确认清除：先移除自动存档监听再清档刷新，避免刷新时进度被重新保存
        confirmClear() {
            this.confirmDialog.show = false;
            window.removeEventListener('beforeunload', this.saveGame);
            document.removeEventListener('visibilitychange', this.onVisibilityChange);
            localStorage.removeItem(SAVE_KEY);
            window.location.reload();
        },
        // 地图 → 返回安全屋
        backToSafehouse() {
            this.currentScene = 'safehouse';
            this.playerLocation = 'safehouse';
            this.pushLog('你回到安全屋，反手关上了门。');
        },
        // 点击地点图标：弹窗显示信息与耗时，确认后出发
        openLocationConfirm(loc) {
            const from = this.getLocationCoord();
            const dist = Math.hypot(loc.x - from.x, loc.y - from.y);
            const seconds = Math.round((dist / GameData.walkSpeed) * HOUR_SECONDS);
            this.pendingLoc = loc;
            this.dialog = {
                show: true,
                icon: loc.icon,
                title: loc.name,
                desc: loc.desc,
                cost: `步行约 ${this.formatDuration(seconds)}`,
                action: 'go'
            };
        },
        // 点击安全屋节点：弹窗确认是否返回
        openHomeConfirm() {
            const atHome = this.playerLocation === 'safehouse';
            this.pendingLoc = null;
            this.dialog = {
                show: true,
                icon: '🏠',
                title: '安全屋',
                desc: atHome ? '你已经在安全屋里了。' : '是否返回安全屋休整？',
                cost: '',
                action: 'home'
            };
        },
        // 点击大门：弹窗确认是否出门探索
        openDoorConfirm() {
            this.pendingLoc = null;
            this.dialog = {
                show: true,
                icon: '🚪',
                title: '大门',
                desc: '是否出门探索？',
                cost: '',
                action: 'door'
            };
        },
        // 确认弹窗按钮
        closeDialog() {
            this.dialog.show = false;
        },
        confirmAction() {
            if (this.dialog.action === 'go' && this.pendingLoc) {
                this.travelTo(this.pendingLoc);
            } else if (this.dialog.action === 'home') {
                this.backToSafehouse();
            } else if (this.dialog.action === 'door') {
                this.goToMap();
            }
            this.dialog.show = false;
        },
        // 实际步行前往：计算耗时并推进游戏时间
        travelTo(loc) {
            const from = this.getLocationCoord();
            const dist = Math.hypot(loc.x - from.x, loc.y - from.y);
            const seconds = Math.round((dist / GameData.walkSpeed) * HOUR_SECONDS);
            this.advanceGameTime(seconds);
            this.playerLocation = loc.name;
            this.pushLog(`你步行前往${loc.name}，耗时 ${this.formatDuration(seconds)}。`);
        },
        // 点击室外设施（狗窝/防御栅栏）：锁定则提示未解锁
        outdoorClick(item) {
            if (!item.unlocked) {
                this.pushLog(`🔒「${item.name}」尚未解锁。`);
                return;
            }
            this.pushLog(`你查看了「${item.name}」。`);
        },
        pushLog(text) {
            this.logs.push({ time: this.time, text });
            if (this.logs.length > 20) this.logs.shift();
        }
    }
});
