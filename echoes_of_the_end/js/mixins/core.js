// ============ Mixin：时间与环境（时钟/天气/温度/日志） ============
const CoreMixin = {
    computed: {
        // 总生存天数（跨季累计，用于丧尸强度/遇敌概率等长期难度）
        totalDay() {
            return Math.floor(this.gameSeconds / DAY_SECONDS);
        },
        // 血量上限：固定 200（健康值独立，不再影响生命值）
        hpMax() {
            return 200;
        },
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
            return this.logs.slice(-4);
        },
        // 场景标题（固定栏显示，随场景/子页切换；占位场景显示对应地点图标与名称）
        sceneTitle() {
            if (this.currentPage === 'bag') return '🎒 背包';
            if (this.currentPage === 'bed') return '🛏️ 床';
            if (this.currentPage === 'storage') return '📦 仓库';
            if (this.currentPage === 'workbench') return '🛠️ 工作台';
            if (this.currentPage === 'fire') return '🔥 取暖';
            if (this.currentPage === 'stove') return '🍳 灶台';
            if (this.currentPage === 'rain') return '🚿 雨水收集器';
            if (this.currentPage === 'juicer') return '🥤 榨汁机';
            if (this.currentPage === 'furnace') return '🏭 熔炉';
            if (this.currentPage === 'plantation') return '🌱 种植园';
            if (this.currentPage === 'battle') return '⚔️ 战斗';
            if (this.currentPage === 'furniture' && this.currentFurniture) {
                return `${this.currentFurniture.icon} ${this.currentFurniture.name}`;
            }
            if (this.currentScene === 'map') return '🗺️ 成都';
            if (this.currentScene === 'place' && this.currentPlace) {
                return `${this.currentPlace.icon} ${this.currentPlace.name}`;
            }
            return '🏠 安全屋';
        },
        // 升级弹窗（带 costMap）材料/力量是否足够：不足时确认按钮禁用
        canAffordDialog() {
            if (!this.dialog) return true;
            if (this.dialog.needStr && this.stats.strength < this.dialog.needStr) return false;
            if (this.dialog.costMap && !this.hasMaterials(this.dialog.costMap)) return false;
            return true;
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
        // 每秒推进游戏时间（地图场景下时间暂停；战斗时也不流动，避免战斗期间天气/时间变化）
        tick() {
            if (this.currentScene === 'map') return;
            if (this.currentPage === 'battle') return;
            this.advanceGameTime(GAME_SECONDS_PER_REAL_SECOND);
            // 篝火页打开时，每秒推送状态刷新燃料倒计时
            if (this.currentPage === 'fire') this.postSceneState();
            // 雨水收集器雨天自动收集（仅在安全屋时间流动时生效）
            this.autoCollectRain();
            if (this.currentPage === 'rain') this.postSceneState();
            // 持续搜索：每累计 30 游戏分钟随机产出一次
            if (this.searching) {
                this.searchAccum += GAME_SECONDS_PER_REAL_SECOND;
                if (this.searchAccum >= SEARCH_INTERVAL) {
                    this.searchAccum -= SEARCH_INTERVAL;
                    this.searchDrop();
                    this.postSceneState();
                }
            }
            // 熔炉后台加工：最多 6 个槽同时加工；仅在有任务且燃料充足时推进，燃尽则全部暂停（不工作时燃料不消耗）
            if (this.furnaceJobs.length > 0) {
                if (this.furnaceFuel > 0) {
                    const dt = GAME_SECONDS_PER_REAL_SECOND;
                    // 炉子整体以固定速率烧燃料（1 木板 = 1 游戏小时），与同时在加工的槽数无关；
                    // burn ≤ dt，燃料与所有槽按同一刻度推进，燃料耗尽则一并暂停
                    const burn = Math.min(dt, this.furnaceFuel);
                    this.furnaceFuel -= burn;
                    let finished = false;
                    for (const job of this.furnaceJobs) {
                        job.remaining -= burn;
                        if (job.remaining <= 0) finished = true;
                    }
                    if (finished) {
                        const done = this.furnaceJobs.filter(j => j.remaining <= 0);
                        this.furnaceJobs = this.furnaceJobs.filter(j => j.remaining > 0);
                        done.forEach(j => this.furnaceOutput(j));
                    }
                }
                if (this.currentPage === 'furnace') this.postSceneState();
            }
            // 种植园后台生长：作物随时间自然生长（无燃料消耗），成熟后等待手动收获
            if (this.plantationJobs.length > 0) {
                const dt = GAME_SECONDS_PER_REAL_SECOND;
                for (const c of this.plantationJobs) {
                    if (c.remaining > 0) c.remaining = Math.max(0, c.remaining - dt);
                }
                if (this.currentPage === 'plantation') this.postSceneState();
            }
        },
        // 推进游戏时间（秒），处理状态消耗/恢复、跨天/跨季
        advanceGameTime(seconds) {
            if (this.gameOver) return;
            this.gameSeconds += seconds;
            // 状态随时间变化：饱食/水分/理智持续消耗
            const s = this.stats;
            const hours = seconds / HOUR_SECONDS;
            const wasHungry = s.hunger > 0, wasThirsty = s.water > 0;
            // 铁甲等防具可能加快饱食消耗（hungerMult）
            const hMult = (this.equipment && this.equipment.armor && this.equipment.armor.hungerMult) || 1;
            s.hunger = Math.max(0, s.hunger - 3 * hours * hMult);
            s.water = Math.max(0, s.water - 3 * hours);
            // 理智（精神值）：基础缓慢流失；超过 24 游戏小时未睡觉则额外加速流失
            s.sanity = Math.max(0, s.sanity - 0.5 * hours);
            if (this.gameSeconds - this.lastSleepAt > 24 * HOUR_SECONDS) {
                s.sanity = Math.max(0, s.sanity - 3 * hours);
                if (!this.insomniaWarned) {
                    this.insomniaWarned = true;
                    this.pushLog('😵 你已超过 24 小时没有睡觉，精神（理智）开始加速流失……');
                }
            } else {
                this.insomniaWarned = false;
            }
            if (wasHungry && s.hunger <= 0) this.pushLog('你饿得头晕眼花，身体开始透支……');
            if (wasThirsty && s.water <= 0) this.pushLog('你口渴难耐，急需饮水……');
            // 饥饿或缺水归零后持续损耗健康：每分钟 -1
            if (s.hunger <= 0 || s.water <= 0) {
                s.health = Math.max(0, s.health - seconds / MINUTE_SECONDS);
            }
            // 健康归零：游戏结束（清档重开）
            if (s.health <= 0) {
                this.gameOver = true;
                this.pushLog('💀 健康值归零，你在末日中倒下了……');
                setTimeout(() => this.resetGame(), 1500);
                return;
            }
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
            // 状态阈值检查：任一状态低于上限 30% 时日志提示一次
            this.checkLowStats();
            this.saveGame();
        },
        // 低状态阈值提示：各状态首次跌破 30% 时提示，回升后复位以便下次再提醒
        checkLowStats() {
            const warnMap = {
                hunger: '饱食', water: '水分', sanity: '理智',
                hp: '血量', health: '健康'
            };
            const maxMap = {
                hunger: 150, water: 150, sanity: 200,
                hp: this.hpMax, health: 100
            };
            for (const key in warnMap) {
                const max = maxMap[key];
                const pct = max ? this.stats[key] / max : 1;
                if (pct < 0.3) {
                    if (!this.lowWarned[key]) {
                        this.lowWarned[key] = true;
                        this.pushLog(`⚠️ ${warnMap[key]}低于 30%，请注意补充或休息！`);
                    }
                } else {
                    this.lowWarned[key] = false;
                }
            }
        },
        // 雨水收集器：雨天按雨量自动收集，封顶当前容量；储量允许小数，显示时取整
        autoCollectRain() {
            if (this.currentScene !== 'safehouse') return;
            const rate = GameData.rainRates[this.weatherName];
            if (!rate) return;
            const st = this.furniture.find(f => f.isRainCollector);
            if (!st || !st.unlocked) return;
            const cap = st.rainLevels[st.rainLevel].capacity;
            if (st.rainWater >= cap) return;
            const perSec = rate * GAME_SECONDS_PER_REAL_SECOND / 3600;
            st.rainWater = Math.min(cap, st.rainWater + perSec);
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
        },
        // 弹窗取消按钮：优先执行 dialog.onCancel（如遇敌弹窗的「逃跑」），否则仅关闭
        onDialogCancel() {
            const fn = this.dialog.onCancel;
            if (fn) {
                this.dialog.onCancel = null;
                fn.call(this);
            } else {
                this.closeDialog();
            }
        }
    }
};
