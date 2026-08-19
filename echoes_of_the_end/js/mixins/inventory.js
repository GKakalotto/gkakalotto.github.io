// ============ Mixin：背包 / 床 / 仓库 / 工作台 / 家具操作（子页触发，外壳执行） ============
const InventoryMixin = {
    methods: {
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
        // 背包 / 家具 / 床 / 工作台 / 仓库：点击均改为 iframe 加载对应子页
        openBag() {
            this.currentPage = 'bag';
        },
        openFurniture(item) {
            this.currentFurniture = item;
            this.currentPage = 'furniture';
        },
        openBed(item) {
            this.currentBed = item;
            this.currentPage = 'bed';
        },
        openWorkbench(item) {
            this.currentWorkbench = item;
            this.currentPage = 'workbench';
        },
        openStorage(item) {
            this.currentStorage = item;
            this.currentPage = 'storage';
        },
        // 按索引打开家具：按类型分发到床 / 工作台 / 仓库 / 家具详情
        openFurnitureByIndex(i) {
            const f = this.furniture[i];
            if (!f) return;
            if (f.isBed) this.openBed(f);
            else if (f.isWorkbench) this.openWorkbench(f);
            else if (f.isStorage) this.openStorage(f);
            else this.openFurniture(f);
        },
        // 床/仓库升级与工作台制作共用的材料查询
        materialCount(name) {
            const it = this.bag.find(i => i.name === name);
            return it ? (it.count || 0) : 0;
        },
        // 消耗材料：cost {材料:数量} 从背包扣减
        spendMaterials(cost) {
            for (const mat in cost) {
                const it = this.bag.find(i => i.name === mat);
                if (it) it.count -= cost[mat];
            }
        },
        // 仓库：升级到下一级（满足材料时扣减并升级，否则按钮置灰不可点）
        upgradeStorage() {
            const st = this.currentStorage;
            if (!st || st.storageLevel >= st.storageLevels.length - 1) return;
            const cost = st.storageLevels[st.storageLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            st.storageLevel++;
            this.pushLog(`仓库升级为「${st.storageLevels[st.storageLevel].name}」，容量提升到 ${st.storageLevels[st.storageLevel].capacity}。`);
            this.postSceneState();
        },
        // 工作台：制作（消耗材料并把产物加入背包）
        craft(bp) {
            if (!this.hasMaterials(bp.cost)) return;
            this.spendMaterials(bp.cost);
            this.bag.push({ type: bp.type, name: bp.name, weight: bp.weight, count: 1 });
            this.pushLog(`你制作了「${bp.name}」。`);
            // 刷新工作台材料颜色 / 背包子页
            this.postSceneState();
        },
        // 是否满足 cost 中全部材料需求
        hasMaterials(cost) {
            for (const mat in cost) {
                if (this.materialCount(mat) < cost[mat]) return false;
            }
            return true;
        },
        // 床：升级到下一级（满足材料时扣减并升级，否则按钮置灰不可点）
        upgradeBed() {
            const bed = this.currentBed;
            if (!bed || bed.bedLevel >= bed.bedLevels.length - 1) return;
            const cost = bed.bedLevels[bed.bedLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            bed.bedLevel++;
            this.pushLog(`床升级为「${bed.bedLevels[bed.bedLevel].name}」，恢复效果更好了。`);
            this.postSceneState();
        },
        // 床：点击睡眠（触发进度条动画，并在动画期间加速推进游戏时间，让顶部时钟快速流逝）
        startSleep(mode) {
            if (this.sleeping) return;   // 动画进行中，禁止重复点击
            const delta = this.sleepSeconds(mode);
            this.sleepDelta = delta;
            this.sleepTarget = this.gameSeconds + delta;
            this.sleeping = mode;
            // 时间加速：在 SLEEP_MS 内把 delta 游戏秒均匀推进完（顶部日期/时间随之快速流动）
            const SLEEP_MS = 1500;
            const speed = delta / SLEEP_MS;   // 游戏秒 / 毫秒
            let last = performance.now();
            const step = (now) => {
                if (!this.sleeping) return;
                const dt = now - last;
                last = now;
                this.advanceGameTime(speed * dt);
                if (this.gameSeconds < this.sleepTarget) {
                    this.sleepRAF = requestAnimationFrame(step);
                }
            };
            this.sleepRAF = requestAnimationFrame(step);
        },
        // 计算某睡眠模式要推进的游戏秒数
        sleepSeconds(mode) {
            if (mode === '1h') return HOUR_SECONDS;
            if (mode === '4h') return 4 * HOUR_SECONDS;
            const intoDay = this.gameSeconds % DAY_SECONDS;
            const dawn = 6 * HOUR_SECONDS;
            return intoDay < dawn ? dawn - intoDay : DAY_SECONDS - intoDay + dawn;
        },
        // 进度条动画结束：补齐剩余时间并结算恢复
        finishSleep() {
            const mode = this.sleeping;
            if (!mode) return;
            if (this.sleepRAF) { cancelAnimationFrame(this.sleepRAF); this.sleepRAF = null; }
            // 补齐因帧间隔误差未走完的剩余游戏秒，确保精确推进到目标时刻
            const remain = this.sleepTarget - this.gameSeconds;
            if (remain > 0) this.advanceGameTime(remain);
            const bed = this.currentBed;
            this.applySleep(bed, this.sleepDelta / HOUR_SECONDS);
            // 睡眠小结与恢复后的状态分两行打印
            if (mode === 'dawn') {
                this.pushLog(`你睡到天亮（第 ${this.day} 天 ${this.time}），精神焕发。`);
            } else {
                this.pushLog(`你睡了 ${mode === '1h' ? 1 : 4} 小时，恢复完毕。`);
            }
            const s = this.stats;
            this.pushLog(`当前状态：精力 ${Math.round(s.stamina)} / 血量 ${Math.round(s.hp)} / 体力 ${Math.round(s.physical)}`);
            this.sleeping = null;
            // 通知床子页清除动画状态
            this.postSceneState();
        },
        // 按当前床倍率结算 精力 / 血量 / 体力 恢复（不超过上限）
        applySleep(bed, hours) {
            const cfg = GameData.bedSleep;
            const mult = bed.bedLevels[bed.bedLevel].recover;
            ['stamina', 'hp', 'physical'].forEach(k => {
                const gain = cfg.base[k] * hours * mult;
                this.stats[k] = Math.min(cfg.max[k], this.stats[k] + gain);
            });
        }
    }
};
