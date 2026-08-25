// ============ Mixin：存档 / 清除进度 ============
const SaveMixin = {
    methods: {
        // 存档：写入 localStorage（节流：5 秒内最多一次；force 用于退出/切后台时立即保存）
        saveGame(force) {
            const now = Date.now();
            if (!force && this.lastSaveAt && now - this.lastSaveAt < 5000) return;
            this.lastSaveAt = now;
            try {
                const save = {
                    gameSeconds: this.gameSeconds,
                    weatherName: this.weatherName,
                    lastSleepAt: this.lastSleepAt,
                    stats: { ...this.stats },
                    currentScene: this.currentScene,
                    playerLocation: this.playerLocation,
                    bag: this.bag,
                    bagLevel: this.bagLevel,
                    storageItems: this.storageItems,
                    cellResources: this.cellResources,
                    locationResources: this.locationResources,
                    placeStash: this.placeStash,
                    equipment: this.equipment,
                    rarityCaps: this.rarityCaps,
                    fireFuelUntil: this.fireFuelUntil,
                    stoveFuelUntil: this.stoveFuelUntil,
                    furnaceFuel: this.furnaceFuel,
                    furnaceJobs: this.furnaceJobs,
                    plantationJobs: this.plantationJobs,
                    // 只存可变状态（升级等级 / 解锁状态），静态结构仍以数据文件为准
                    furnitureState: this.furniture.map(f => ({
                        bedLevel: f.bedLevel,
                        storageLevel: f.storageLevel,
                        fireLevel: f.fireLevel,
                        stoveLevel: f.stoveLevel,
                        rainLevel: f.rainLevel,
                        plantationLevel: f.plantationLevel,
                        rainWater: f.rainWater,
                        fireHasPot: f.hasPot,
                        unlocked: f.unlocked
                    })),
                    outdoorState: this.outdoors.map(o => ({ unlocked: o.unlocked }))
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
            // 上次睡觉时刻（旧档无此字段时视为刚睡醒，避免立即触发失眠惩罚）
            if (typeof save.lastSleepAt === 'number') this.lastSleepAt = save.lastSleepAt;
            else this.lastSleepAt = this.gameSeconds;
            if (typeof save.weatherName === 'string') this.weatherName = save.weatherName;
            if (save.stats) {
                Object.assign(this.stats, save.stats);
                // 旧档可能残留已移除的体力/精力字段，清除避免冗余
                delete this.stats.stamina;
                delete this.stats.physical;
            }
            if (save.currentScene) {
                // 占位场景不持久化：读档时回退到地图，避免 currentPlace 缺失
                this.currentScene = save.currentScene === 'place' ? 'map' : save.currentScene;
            }
            if (save.playerLocation) this.playerLocation = save.playerLocation;
            // 背包直接替换（旧档无此字段时保留初始物资）
            if (save.bag) this.bag = save.bag;
            // 背包等级（旧档无此字段时保持 0 级，越界值钳制到合法范围）
            if (typeof save.bagLevel === 'number') {
                this.bagLevel = Math.max(0, Math.min(save.bagLevel, GameData.bagLevels.length - 1));
                this.bagMax = GameData.bagLevels[this.bagLevel].capacity;
            }
            // 仓库存储物品（旧档无此字段时保持空仓库）
            if (Array.isArray(save.storageItems)) this.storageItems = save.storageItems;
            // 地图资源格状态（旧档无此字段时保持空，进入时重新生成）
            if (save.cellResources) this.cellResources = save.cellResources;
            // 地点搜刮次数（旧档无此字段时保持空，进入时重新生成；旧格式 searches 迁移为 roomsLeft）
            if (save.locationResources) {
                this.locationResources = save.locationResources;
                for (const key in this.locationResources) {
                    const r = this.locationResources[key];
                    if (r && typeof r.searches === 'number' && r.roomsLeft === undefined) {
                        r.roomsLeft = r.searches;
                        delete r.searches;
                    }
                }
            }
            // 地点暂存区（旧档无此字段时保持空）
            if (save.placeStash) this.placeStash = save.placeStash;
            // 装备槽（旧档无此字段时保持空）
            if (save.equipment) {
                this.equipment = {
                    weapon: save.equipment.weapon || null,
                    tool: save.equipment.tool || null,
                    hat: save.equipment.hat || null,
                    armor: save.equipment.armor || null
                };
            }
            // 篝火燃料烧尽时刻（旧档无此字段时默认 0，即熄灭）
            if (typeof save.fireFuelUntil === 'number') this.fireFuelUntil = save.fireFuelUntil;
            // 烹饪锅燃料烧尽时刻
            if (typeof save.stoveFuelUntil === 'number') this.stoveFuelUntil = save.stoveFuelUntil;
            // 熔炉燃料剩余游戏秒 / 后台加工队列（旧档无此字段时保持默认）
            if (typeof save.furnaceFuel === 'number') this.furnaceFuel = save.furnaceFuel;
            if (Array.isArray(save.furnaceJobs)) {
                const valid = { '铁': 1, '塑料': 1, '玻璃': 1 };
                this.furnaceJobs = save.furnaceJobs
                    .filter(j => j && valid[j.kind] && typeof j.remaining === 'number')
                    .map(j => ({ kind: j.kind, remaining: j.remaining }));
            }
            // 种植园作物队列（旧档无此字段时保持默认）
            if (Array.isArray(save.plantationJobs)) {
                this.plantationJobs = save.plantationJobs
                    .filter(c => c && typeof c.name === 'string' && typeof c.remaining === 'number')
                    .map(c => ({ name: c.name, seed: c.seed, type: c.type, total: c.total, remaining: c.remaining }));
            }
            // 稀有武器档内上限（旧档无此字段时保持空，由 created 随机补全）
            if (save.rarityCaps) this.rarityCaps = save.rarityCaps;
            // 家具可变状态按下标回填到数据文件的静态结构上
            if (Array.isArray(save.furnitureState)) {
                save.furnitureState.forEach((st, i) => {
                    const f = this.furniture[i];
                    if (!f) return;
                    if (typeof st.bedLevel === 'number') f.bedLevel = st.bedLevel;
                    if (typeof st.storageLevel === 'number') f.storageLevel = st.storageLevel;
                    if (typeof st.fireLevel === 'number') f.fireLevel = st.fireLevel;
                    if (typeof st.stoveLevel === 'number') f.stoveLevel = st.stoveLevel;
                    if (typeof st.rainLevel === 'number') f.rainLevel = st.rainLevel;
                    if (typeof st.plantationLevel === 'number') f.plantationLevel = st.plantationLevel;
                    if (typeof st.rainWater === 'number') f.rainWater = st.rainWater;
                    if (typeof st.fireHasPot === 'boolean') f.hasPot = st.fireHasPot;
                    if (typeof st.unlocked === 'boolean') f.unlocked = st.unlocked;
                });
            }
            // 室外设施解锁状态
            if (Array.isArray(save.outdoorState)) {
                save.outdoorState.forEach((st, i) => {
                    const o = this.outdoors[i];
                    if (o && typeof st.unlocked === 'boolean') o.unlocked = st.unlocked;
                });
            }
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
        }
    }
};
