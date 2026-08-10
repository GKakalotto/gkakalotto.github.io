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

// 地图常量（15 列 × 19 行格子地图，数据来自 MapData）
const MAP_COLS = MapData.mapCols;
const MAP_ROWS = MapData.mapRows;

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
        // 地图格子列表（静态：仅依赖地点/道路数据，构建地图 DOM 用一次）
        gridCells() {
            const home = MapData.safehouseGridPos;
            const homeKey = `${home.gx},${home.gy}`;
            const locByKey = {};
            this.locations.forEach(loc => {
                const p = this.gridPosOf(loc);
                locByKey[`${p.gx},${p.gy}`] = loc;
            });
            const cells = [];
            for (let y = 0; y < MAP_ROWS; y++) {
                for (let x = 0; x < MAP_COLS; x++) {
                    const key = `${x},${y}`;
                    let base = 'park';
                    let loc = null;
                    if (key === homeKey) {
                        base = 'building';
                        loc = { isHome: true };
                    } else if (locByKey[key]) {
                        base = 'building';
                        loc = locByKey[key];
                    } else if (x === 0 || x === MAP_COLS - 1 || y === 0 || y === MAP_ROWS - 1) {
                        base = 'tree';      // 最外圈一圈树木
                    } else if (x % 2 === 1 && y % 2 === 1) {
                        base = 'road-x';    // 交叉路口
                    } else if (x % 2 === 1) {
                        base = 'road';      // 竖路
                    } else if (y % 2 === 1) {
                        base = 'road-h';    // 横路
                    }
                    cells.push({ key, x, y, base, loc });
                }
            }
            return cells;
        },
        // 场景标题（固定栏显示，随场景切换；占位场景显示对应地点图标与名称）
        sceneTitle() {
            if (this.currentScene === 'map') return '🗺️ 成都';
            if (this.currentScene === 'place' && this.currentPlace) {
                return `${this.currentPlace.icon} ${this.currentPlace.name}`;
            }
            return '🏠 安全屋';
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
        // 一次性构建静态地图（格子与建筑），此后地图 DOM 不再重建
        this.buildMap();
        // 窗口尺寸变化时重算地图尺寸
        window.addEventListener('resize', this.onResize);
        // 等 Vue 完全加载后再显示界面（#app 初始为内联隐藏）
        this.$el.removeAttribute('v-cloak');
        this.$el.style.display = '';
        // 界面可见后再计算地图尺寸：此前 #app 隐藏（display:none）量不到真实尺寸，
        // 若刷新时直接处于地图场景，否则地图会保持 auto 宽度（缩到极小）
        this.$nextTick(() => this.sizeMap());
    },
    beforeDestroy() {
        this.saveGame(true);
        window.removeEventListener('beforeunload', this.saveGame);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('resize', this.onResize);
        if (this.dotTimer) {
            clearTimeout(this.dotTimer);
            this.dotTimer = null;
        }
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
                this.saveGame(true);
            } else if (!this.clockTimer) {
                this.clockTimer = setInterval(() => this.tick(), 1000);
            }
        },
        // 每秒推进游戏时间（地图场景下时间暂停，不流动）
        tick() {
            if (this.currentScene === 'map') return;
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
        // 格子坐标 → km 坐标（地图中心 8,9 ≈ 安全屋 0,3，每格 1.0km；耗时按地图相对位置计算）
        gridToKm(gx, gy) {
            return {
                x: (gx - 8) * 1.0,
                y: (gy - 9) * 1.0 + 3
            };
        },
        // 两点 km 坐标之间的步行耗时（确定性，两地之间耗时固定；每格 1.0km 已适当延长）
        travelSeconds(from, to) {
            const dist = Math.hypot(to.x - from.x, to.y - from.y);
            return Math.max(HOUR_SECONDS / 60, Math.round((dist / MapData.walkSpeed) * HOUR_SECONDS));
        },
        // 当前所在地 km 坐标（地点/公园/树格均由格子位置换算）
        getLocationCoord() {
            if (this.playerLocation === 'safehouse') return MapData.safehouseCoord;
            const pos = this.getPlayerGrid();
            return this.gridToKm(pos.gx, pos.gy);
        },
        // 时长显示：X 小时 Y 分 / Y 分钟
        formatDuration(seconds) {
            const h = Math.floor(seconds / HOUR_SECONDS);
            const m = Math.round((seconds % HOUR_SECONDS) / MINUTE_SECONDS);
            if (h === 0) return `${m}分钟`;
            return m === 0 ? `${h}小时` : `${h}小时${m}分`;
        },
        // 画布坐标 → 格子坐标（lx/ly 百分比 → 0 基列 / 行索引）
        gridPosOf(node) {
            return {
                gx: Math.round(node.lx / 100 * (MAP_COLS - 1)),
                gy: Math.round(node.ly / 100 * (MAP_ROWS - 1))
            };
        },
        // 一次性构建静态地图（原生 DOM）：格子与建筑，此后地图 DOM 不再重建
        buildMap() {
            const container = this.$refs.mapGrid;
            if (!container || container.children.length) return;
            // 道路格集合：用于判断相邻方向是否有路，生成符合地形的虚线
            const roadKeys = new Set();
            this.gridCells.forEach(cell => {
                if (cell.base === 'road' || cell.base === 'road-h' || cell.base === 'road-x') {
                    roadKeys.add(cell.key);
                }
            });
            const frag = document.createDocumentFragment();
            this.gridCells.forEach(cell => {
                const el = document.createElement('div');
                el.className = 'map-cell ' + cell.base;
                if (cell.loc && cell.loc.isHome) {
                    el.classList.add('home-cell');
                }
                if (cell.loc) {
                    const building = document.createElement('div');
                    building.className = 'grid-building';
                    const icon = document.createElement('span');
                    icon.className = 'grid-building-icon';
                    icon.textContent = cell.loc.isHome ? '🏠' : cell.loc.icon;
                    building.appendChild(icon);
                    building.addEventListener('click', cell.loc.isHome
                        ? () => this.openHomeConfirm()
                        : () => this.openLocationConfirm(cell.loc));
                    el.appendChild(building);
                } else if (roadKeys.has(cell.key)) {
                    // 道路格：虚线只画在相邻也有路的方向，路尽头（树/空地）方向不画
                    const up = roadKeys.has(`${cell.x},${cell.y - 1}`);
                    const down = roadKeys.has(`${cell.x},${cell.y + 1}`);
                    const left = roadKeys.has(`${cell.x - 1},${cell.y}`);
                    const right = roadKeys.has(`${cell.x + 1},${cell.y}`);
                    if (up || down) {
                        const v = document.createElement('div');
                        v.className = 'road-line-v';
                        v.style.top = up ? '0' : '50%';
                        v.style.height = (up && down) ? '100%' : '50%';
                        el.appendChild(v);
                    }
                    if (left || right) {
                        const h = document.createElement('div');
                        h.className = 'road-line-h';
                        h.style.left = left ? '0' : '50%';
                        h.style.width = (left && right) ? '100%' : '50%';
                        el.appendChild(h);
                    }
                } else if (cell.base === 'park' || cell.base === 'tree') {
                    // 公园 / 树：可点击前往
                    el.addEventListener('click', () => this.openCellConfirm(cell.key, cell.base));
                }
                frag.appendChild(el);
            });
            container.appendChild(frag);
            // 创建常驻当前位置红点
            this.dot = document.createElement('div');
            this.dot.className = 'player-dot';
            container.appendChild(this.dot);
            this.updateCurrent();
        },
        // 更新当前位置标记：红点定位到所在格（建筑/公园/树通用）
        updateCurrent() {
            if (!this.dot) return;
            const pos = this.getPlayerGrid();
            this.dot.style.left = ((pos.gx + 0.5) / MAP_COLS * 100) + '%';
            this.dot.style.top = ((pos.gy + 0.5) / MAP_ROWS * 100) + '%';
            this.dot.style.display = '';
        },
        // 计算地图宽高，保证每个格子为正方形（需地图可见时调用）
        sizeMap() {
            const grid = this.$refs.mapGrid;
            if (!grid || !grid.clientWidth || !grid.clientHeight) return;
            const scene = grid.parentElement;
            const cell = Math.floor(Math.min(
                scene.clientWidth / MAP_COLS,
                scene.clientHeight / MAP_ROWS
            ));
            if (cell <= 0) return;
            grid.style.width = cell * MAP_COLS + 'px';
            grid.style.height = cell * MAP_ROWS + 'px';
        },
        // 窗口尺寸变化：地图场景可见时重算
        onResize() {
            if (this.currentScene === 'map') this.sizeMap();
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
            // 地图刚显示，等 v-show 生效后计算正方形尺寸
            this.$nextTick(() => this.sizeMap());
        },
        // 设置面板：打开 / 关闭（不记入日志）
        openSettings() {
            this.showSettings = true;
        },
        closeSettings() {
            this.showSettings = false;
        },
        // 状态面板：❤ 切换 / 关闭
        toggleStats() {
            this.showStats = !this.showStats;
        },
        closeStats() {
            this.showStats = false;
        },
        // 背包（暂为占位）
        openBag() {
            this.pushLog('🎒 背包暂未开放，等待后续版本。');
        },
        // 存档：写入 localStorage（节流：5 秒内最多一次；force 用于退出/切后台时立即保存）
        saveGame(force) {
            const now = Date.now();
            if (!force && this.lastSaveAt && now - this.lastSaveAt < 5000) return;
            this.lastSaveAt = now;
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
            if (save.currentScene) {
                // 占位场景不持久化：读档时回退到地图，避免 currentPlace 缺失
                this.currentScene = save.currentScene === 'place' ? 'map' : save.currentScene;
            }
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
            this.updateCurrent();
        },
        // 点击地点图标：不在该地先询问是否前往，到达后再询问是否进入；已在当前位置则直接询问是否进入
        openLocationConfirm(loc) {
            if (this.moving) {
                this.pushLog('⏳ 正在移动中，请稍候。');
                return;
            }
            this.pendingLoc = loc;
            // 已在当前位置：直接询问是否进入
            if (this.playerLocation === loc.name) {
                this.dialog = {
                    show: true,
                    icon: loc.icon,
                    title: loc.name,
                    desc: loc.desc,
                    cost: '',
                    action: 'enter-loc'
                };
                return;
            }
            // 不在该地：先询问是否前往
            const from = this.getLocationCoord();
            const to = this.gridToKm(this.gridPosOf(loc).gx, this.gridPosOf(loc).gy);
            this.pendingSeconds = this.travelSeconds(from, to);
            this.dialog = {
                show: true,
                icon: loc.icon,
                title: loc.name,
                desc: loc.desc,
                cost: `步行约 ${this.formatDuration(this.pendingSeconds)}`,
                action: 'go'
            };
        },
        // 点击安全屋节点：不在安全屋时先询问是否前往，移动到达后再询问是否进入
        openHomeConfirm() {
            if (this.moving) {
                this.pushLog('⏳ 正在移动中，请稍候。');
                return;
            }
            this.pendingLoc = null;
            // 已在安全屋格：直接询问是否进入
            if (this.playerLocation === 'safehouse') {
                this.dialog = {
                    show: true,
                    icon: '🏠',
                    title: '安全屋',
                    desc: '是否进入安全屋休整？',
                    cost: '',
                    action: 'home'
                };
                return;
            }
            // 不在安全屋：先询问是否前往，确认后开始移动
            this.pendingSeconds = this.secondsToHome();
            this.dialog = {
                show: true,
                icon: '🏠',
                title: '安全屋',
                desc: '是否前往安全屋？',
                cost: `步行约 ${this.formatDuration(this.pendingSeconds)}`,
                action: 'go-home'
            };
        },
        // 确认前往安全屋后：开始移动，到达后再询问是否进入
        goHomeMove() {
            this.animateDot(this.getPlayerGrid(), MapData.safehouseGridPos, this.pendingSeconds, () => {
                this.playerLocation = 'safehouse';
                this.pushLog('你回到了安全屋门前。');
                this.updateCurrent();
                this.dialog = {
                    show: true,
                    icon: '🏠',
                    title: '安全屋',
                    desc: '是否进入安全屋休整？',
                    cost: '',
                    action: 'home'
                };
            });
        },
        // 返回安全屋耗时（按当前所在地 km 距离，随机扰动）
        secondsToHome() {
            return this.travelSeconds(this.getLocationCoord(), MapData.safehouseCoord);
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
            } else if (this.dialog.action === 'go-home') {
                this.goHomeMove();
            } else if (this.dialog.action === 'enter-loc' && this.pendingLoc) {
                this.enterLocation(this.pendingLoc);
            } else if (this.dialog.action === 'enter-cell' && this.pendingCell) {
                this.enterCell(this.pendingCell);
            } else if (this.dialog.action === 'cell' && this.pendingCell) {
                this.travelToCell(this.pendingCell);
            }
            this.dialog.show = false;
        },
        // 从地点占位场景返回地图
        backToMap() {
            this.currentScene = 'map';
        },
        // 实际步行前往地点：红点沿道路移动，时间随移动过程逐步推进；到达后询问是否进入
        travelTo(loc) {
            const seconds = this.pendingSeconds;
            this.animateDot(this.getPlayerGrid(), this.gridPosOf(loc), seconds, () => {
                this.playerLocation = loc.name;
                this.pushLog(`你步行前往${loc.name}，耗时 ${this.formatDuration(seconds)}。`);
                this.updateCurrent();
                this.dialog = {
                    show: true,
                    icon: loc.icon,
                    title: loc.name,
                    desc: loc.desc,
                    cost: '',
                    action: 'enter-loc'
                };
            });
        },
        // 进入地点：切换为占位场景
        enterLocation(loc) {
            this.currentPlace = { name: loc.name, icon: loc.icon };
            this.currentScene = 'place';
            this.pushLog(`你进入了${loc.name}。`);
        },
        // 点击公园/树格：确认前往
        openCellConfirm(key, base) {
            if (this.moving) {
                this.pushLog('⏳ 正在移动中，请稍候。');
                return;
            }
            const [gx, gy] = key.split(',').map(Number);
            const from = this.getLocationCoord();
            const to = this.gridToKm(gx, gy);
            this.pendingSeconds = this.travelSeconds(from, to);
            this.pendingCell = { gx, gy, key, base };
            this.dialog = {
                show: true,
                icon: base === 'park' ? '🌳' : '🌲',
                title: base === 'park' ? '公园绿地' : '森林',
                desc: base === 'park' ? '一片安静的公园绿地，可以放松片刻。' : '地图边缘的树林，草木茂密。',
                cost: `步行约 ${this.formatDuration(this.pendingSeconds)}`,
                action: 'cell'
            };
        },
        // 前往公园/树格：到达后询问是否进入
        travelToCell(cell) {
            const seconds = this.pendingSeconds;
            const from = this.getPlayerGrid();
            this.animateDot(from, { gx: cell.gx, gy: cell.gy }, seconds, () => {
                this.playerLocation = (cell.base === 'park' ? 'park:' : 'tree:') + cell.key;
                this.pushLog(`你来到了${cell.base === 'park' ? '一片公园绿地' : '地图边缘的树林'}。`);
                this.updateCurrent();
                this.dialog = {
                    show: true,
                    icon: cell.base === 'park' ? '🌳' : '🌲',
                    title: cell.base === 'park' ? '公园绿地' : '森林',
                    desc: cell.base === 'park' ? '一片安静的公园绿地，可以放松片刻。' : '地图边缘的树林，草木茂密。',
                    cost: '',
                    action: 'enter-cell'
                };
            });
        },
        // 进入公园/树格：切换为占位场景
        enterCell(cell) {
            const isPark = cell.base === 'park';
            this.currentPlace = {
                name: isPark ? '公园绿地' : '森林',
                icon: isPark ? '🌳' : '🌲'
            };
            this.currentScene = 'place';
            this.pushLog(`你进入了${isPark ? '一片公园绿地' : '地图边缘的树林'}。`);
        },
        // 玩家当前所在格子坐标（0 基；地点名 / park: / tree: / 安全屋）
        getPlayerGrid() {
            if (this.playerLocation === 'safehouse') return MapData.safehouseGridPos;
            const m = this.playerLocation.match(/^(park|tree):(\d+),(\d+)$/);
            if (m) return { gx: +m[2], gy: +m[3] };
            const loc = this.locations.find(l => l.name === this.playerLocation);
            return loc ? this.gridPosOf(loc) : MapData.safehouseGridPos;
        },
        // 生成移动路径：在道路格（及边缘树格）上 BFS 求最短，不穿过建筑/公园；首尾为起点/终点
        buildRoute(x1, y1, x2, y2) {
            const isTarget = (x, y) => x === x2 && y === y2;
            // 可走格：内部道路（奇数列或奇数行）或最外圈树（用于前往边缘森林）
            const isWalkable = (x, y) => {
                if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
                if (x === 0 || x === MAP_COLS - 1 || y === 0 || y === MAP_ROWS - 1) return true;
                return x % 2 === 1 || y % 2 === 1;
            };
            // BFS 求最短路径
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const parent = {};
            const startKey = `${x1},${y1}`;
            parent[startKey] = null;
            const queue = [[x1, y1]];
            let head = 0;
            let found = false;
            while (head < queue.length && !found) {
                const [x, y] = queue[head++];
                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const key = `${nx},${ny}`;
                    if (key in parent) continue;
                    if (!isTarget(nx, ny) && !isWalkable(nx, ny)) continue;
                    parent[key] = `${x},${y}`;
                    if (isTarget(nx, ny)) {
                        found = true;
                        break;
                    }
                    queue.push([nx, ny]);
                }
            }
            // 回溯路径
            const path = [];
            let cur = `${x2},${y2}`;
            while (cur) {
                const [x, y] = cur.split(',').map(Number);
                path.unshift([x, y]);
                cur = parent[cur];
            }
            return path;
        },
        // 红点沿路径逐格移动动画；时间按整数步长均匀推进，到达后红点停留为当前位置标记
        animateDot(from, to, totalSeconds, cb) {
            // 移动开始：锁定，禁止点击新的地点
            this.moving = true;
            const grid = this.$refs.mapGrid;
            if (!grid || !grid.clientWidth || !this.dot) {
                this.advanceGameTime(totalSeconds);
                this.moving = false;
                cb();
                return;
            }
            this.dot.style.display = '';
            const path = this.buildRoute(from.gx, from.gy, to.gx, to.gy);
            const steps = path.length - 1;
            // 时间整数步长分配：每格推进 base 或 base+1 秒，总时间精确等于 totalSeconds
            const base = steps > 0 ? Math.floor(totalSeconds / steps) : totalSeconds;
            const extra = steps > 0 ? totalSeconds - base * steps : 0;
            const stepMs = 250;
            let i = 0;
            const move = () => {
                const p = path[i];
                this.dot.style.left = ((p[0] + 0.5) / MAP_COLS * 100) + '%';
                this.dot.style.top = ((p[1] + 0.5) / MAP_ROWS * 100) + '%';
                if (i > 0) {
                    // 前 (steps-extra) 格推进 base 秒，剩余 extra 格多推进 1 秒
                    const sec = i <= (steps - extra) ? base : base + 1;
                    this.advanceGameTime(sec);
                }
                i++;
                if (i <= steps) {
                    this.dotTimer = setTimeout(move, stepMs);
                } else {
                    // 到达：等待最后一段滑动动画完成，再解除锁定并回调（避免红点未到位就弹窗）
                    this.dotTimer = setTimeout(() => {
                        this.moving = false;
                        cb();
                    }, stepMs);
                }
            };
            move();
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
