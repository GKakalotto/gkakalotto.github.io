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
                    stats: { ...this.stats },
                    currentScene: this.currentScene,
                    playerLocation: this.playerLocation,
                    bag: this.bag,
                    bagLevel: this.bagLevel,
                    storageItems: this.storageItems,
                    fireFuelUntil: this.fireFuelUntil,
                    // 只存可变状态（升级等级 / 解锁状态），静态结构仍以数据文件为准
                    furnitureState: this.furniture.map(f => ({
                        bedLevel: f.bedLevel,
                        storageLevel: f.storageLevel,
                        fireLevel: f.fireLevel,
                        stoveLevel: f.stoveLevel,
                        rainLevel: f.rainLevel,
                        chairLevel: f.chairLevel,
                        rainWater: f.rainWater,
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
            if (typeof save.weatherName === 'string') this.weatherName = save.weatherName;
            if (save.stats) Object.assign(this.stats, save.stats);
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
            // 篝火燃料烧尽时刻（旧档无此字段时默认 0，即熄灭）
            if (typeof save.fireFuelUntil === 'number') this.fireFuelUntil = save.fireFuelUntil;
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
                    if (typeof st.chairLevel === 'number') f.chairLevel = st.chairLevel;
                    if (typeof st.rainWater === 'number') f.rainWater = st.rainWater;
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
