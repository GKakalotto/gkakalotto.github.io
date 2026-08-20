// ============ Mixin：时间与环境（时钟/天气/温度/日志） ============
const CoreMixin = {
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
        // 温度 = 季节基准 + 昼夜波动（14 点最暖，2 点最冷，±4°C）+ 天气修正；
        // 在安全屋且篝火燃烧时，环境温度最低 23°C
        temperature() {
            const base = SEASON_BASE_TEMP[this.seasonIndex];
            const cycle = Math.round(4 * Math.cos(((this.hour - 14) / HOURS_PER_DAY) * 2 * Math.PI));
            const adj = WEATHER_TEMP_ADJ[this.weatherName] || 0;
            let temp = base + cycle + adj;
            if (this.currentScene === 'safehouse' && this.gameSeconds < this.fireFuelUntil) {
                temp = Math.max(23, temp);
            }
            return Math.round(temp);
        },
        // 日志：只显示最新 5 条
        visibleLogs() {
            return this.logs.slice(-5);
        },
        // 场景标题（固定栏显示，随场景/子页切换；占位场景显示对应地点图标与名称）
        sceneTitle() {
            if (this.currentPage === 'bag') return '🎒 背包';
            if (this.currentPage === 'bed') return '🛏️ 床';
            if (this.currentPage === 'storage') return '📦 仓库';
            if (this.currentPage === 'workbench') return '🛠️ 工作台';
            if (this.currentPage === 'fire') return '🔥 篝火';
            if (this.currentPage === 'furniture' && this.currentFurniture) {
                return `${this.currentFurniture.icon} ${this.currentFurniture.name}`;
            }
            if (this.currentScene === 'map') return '🗺️ 成都';
            if (this.currentScene === 'place' && this.currentPlace) {
                return `${this.currentPlace.icon} ${this.currentPlace.name}`;
            }
            return '🏠 安全屋';
        }
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
            // 篝火页打开时，每秒推送状态刷新燃料倒计时
            if (this.currentPage === 'fire') this.postSceneState();
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
        pushLog(text) {
            this.logs.push({ time: this.time, text });
            if (this.logs.length > 20) this.logs.shift();
        }
    }
};
