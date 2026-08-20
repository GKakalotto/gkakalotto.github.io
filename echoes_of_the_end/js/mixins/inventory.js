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
        openFire(item) {
            this.currentFire = item;
            this.currentPage = 'fire';
        },
        // 按索引打开家具：按类型分发到床 / 工作台 / 仓库 / 篝火 / 家具详情
        openFurnitureByIndex(i) {
            const f = this.furniture[i];
            if (!f) return;
            if (f.isBed) this.openBed(f);
            else if (f.isWorkbench) this.openWorkbench(f);
            else if (f.isStorage) this.openStorage(f);
            else if (f.isFireplace) this.openFire(f);
            else this.openFurniture(f);
        },
        // 床/仓库升级与工作台制作共用的材料查询
        materialCount(name) {
            const it = this.bag.find(i => i.name === name);
            return it ? (it.count || 0) : 0;
        },
        // 材料消耗文案：{废铁:2, 布料:1} → '废铁 ×2、布料 ×1'
        costText(cost) {
            return Object.keys(cost).map(k => `${k} ×${cost[k]}`).join('、');
        },
        // 消耗材料：cost {材料:数量} 从背包扣减；扣减后数量为 0 的材料条目移除，避免背包残留空卡
        spendMaterials(cost) {
            for (const mat in cost) {
                const it = this.bag.find(i => i.name === mat);
                if (it) it.count -= cost[mat];
            }
            this.bag = this.bag.filter(i => i.count === undefined || i.count > 0);
        },
        // 仓库：点击升级 → 弹窗确认
        upgradeStorage() {
            const st = this.currentStorage;
            if (!st || st.storageLevel >= st.storageLevels.length - 1) return;
            const level = st.storageLevels[st.storageLevel];
            const next = st.storageLevels[st.storageLevel + 1];
            this.dialog = {
                show: true,
                icon: '📦',
                title: `升级仓库：${next.name}`,
                desc: `容量 ${level.capacity} → ${next.capacity}，升级后能存放更多物资。`,
                cost: `消耗：${this.costText(level.upgrade)}`,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeStorage()
            };
        },
        // 执行仓库升级（满足材料时扣减并升级）
        doUpgradeStorage() {
            const st = this.currentStorage;
            if (!st || st.storageLevel >= st.storageLevels.length - 1) return;
            const cost = st.storageLevels[st.storageLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            st.storageLevel++;
            this.pushLog(`仓库升级为「${st.storageLevels[st.storageLevel].name}」，容量提升到 ${st.storageLevels[st.storageLevel].capacity}。`);
            this.postSceneState();
        },
        // 工作台：点击制作 → 弹窗确认
        craft(bp) {
            const cat = GameData.itemCategories[bp.type];
            this.dialog = {
                show: true,
                icon: cat ? cat.icon : '❓',
                title: `制作「${bp.name}」`,
                desc: '确认消耗材料并制作？产物将放入背包。',
                cost: `消耗：${this.costText(bp.cost)}`,
                confirmText: '制作',
                onConfirm: () => this.doCraft(bp)
            };
        },
        // 执行制作（消耗材料并把产物加入背包）
        doCraft(bp) {
            if (!this.hasMaterials(bp.cost)) return;
            this.spendMaterials(bp.cost);
            this.bag.push({ type: bp.type, name: bp.name, weight: bp.weight, count: 1 });
            this.pushLog(`你制作了「${bp.name}」。`);
            // 刷新工作台材料颜色 / 背包子页
            this.postSceneState();
        },
        // 仓库当前容量上限（按仓库等级）
        storageCapacity() {
            const st = this.furniture.find(f => f.isStorage);
            return st ? st.storageLevels[st.storageLevel].capacity : 0;
        },
        // 背包 → 仓库（仅安全屋可存取；仓库容量未满时移动）
        moveToStorage(index) {
            const it = this.bag[index];
            if (!it) return;
            if (this.currentScene !== 'safehouse') return;
            if (this.storageItems.length >= this.storageCapacity()) {
                this.pushLog('仓库已满，无法放入。');
                return;
            }
            this.bag.splice(index, 1);
            this.storageItems.push(it);
            this.postSceneState();
        },
        // 仓库 → 背包（背包容量未满时移动）
        moveToBag(index) {
            const it = this.storageItems[index];
            if (!it) return;
            if (this.bag.length >= this.bagMax) {
                this.pushLog('背包已满，无法取出。');
                return;
            }
            this.storageItems.splice(index, 1);
            this.bag.push(it);
            this.postSceneState();
        },
        // 丢弃物品（source: 'bag' / 'storage'）
        discard(source, index) {
            const list = source === 'storage' ? this.storageItems : this.bag;
            const it = list[index];
            if (!it) return;
            list.splice(index, 1);
            this.pushLog(`你丢弃了「${it.name}」。`);
            this.postSceneState();
        },
        // 使用物品（吃/喝/使用药品）：恢复对应状态，状态已满时提示
        useItem(source, index) {
            const list = source === 'storage' ? this.storageItems : this.bag;
            const it = list[index];
            if (!it) return;
            const cfg = GameData.itemUse[it.type];
            if (!cfg) return;
            if (this.stats[cfg.stat] >= cfg.max) {
                this.pushLog(`「${it.name}」：${cfg.statName}已满，暂时不需要。`);
                return;
            }
            this.stats[cfg.stat] = Math.min(cfg.max, this.stats[cfg.stat] + cfg.amount);
            // 单件消耗：count > 1 时扣 1，否则移除条目
            if (it.count && it.count > 1) it.count--;
            else list.splice(index, 1);
            this.pushLog(`你${cfg.label}了「${it.name}」，${cfg.statName} +${cfg.amount}。`);
            this.postSceneState();
        },
        // 篝火：添加木板燃料（1/2/4/8 块），每块按当前等级燃烧时长累计
        addFuel(count) {
            const fire = this.currentFire;
            if (!fire) return;
            const have = this.materialCount('木板');
            if (have < count) {
                this.pushLog(`木板不足，还需要 ${count - have} 块。`);
                return;
            }
            this.spendMaterials({ '木板': count });
            const hours = count * fire.fireLevels[fire.fireLevel].hoursPerWood;
            // 从当前时刻（或剩余燃料烧尽时刻，取较晚者）起累加，燃尽后重新点燃
            this.fireFuelUntil = Math.max(this.gameSeconds, this.fireFuelUntil) + hours * HOUR_SECONDS;
            this.pushLog(`添加 ${count} 块木板，篝火可再燃烧 ${hours} 小时。`);
            this.postSceneState();
        },
        // 篝火：点击升级 → 弹窗确认
        upgradeFire() {
            const fire = this.currentFire;
            if (!fire || fire.fireLevel >= fire.fireLevels.length - 1) return;
            const level = fire.fireLevels[fire.fireLevel];
            const next = fire.fireLevels[fire.fireLevel + 1];
            this.dialog = {
                show: true,
                icon: '🔥',
                title: `升级篝火：${next.name}`,
                desc: `每块木板燃烧 ${level.hoursPerWood} 小时 → ${next.hoursPerWood} 小时，更耐烧。`,
                cost: `消耗：${this.costText(level.upgrade)}`,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeFire()
            };
        },
        // 执行篝火升级（满足材料时扣减并升级）
        doUpgradeFire() {
            const fire = this.currentFire;
            if (!fire || fire.fireLevel >= fire.fireLevels.length - 1) return;
            const cost = fire.fireLevels[fire.fireLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            fire.fireLevel++;
            this.pushLog(`篝火升级为「${fire.fireLevels[fire.fireLevel].name}」，燃料效率提升。`);
            this.postSceneState();
        },
        // 是否满足 cost 中全部材料需求
        hasMaterials(cost) {
            for (const mat in cost) {
                if (this.materialCount(mat) < cost[mat]) return false;
            }
            return true;
        },
        // 床：点击升级 → 弹窗确认
        upgradeBed() {
            const bed = this.currentBed;
            if (!bed || bed.bedLevel >= bed.bedLevels.length - 1) return;
            const level = bed.bedLevels[bed.bedLevel];
            const next = bed.bedLevels[bed.bedLevel + 1];
            this.dialog = {
                show: true,
                icon: '🛏️',
                title: `升级床：${next.name}`,
                desc: `恢复倍率 ${level.recover}× → ${next.recover}×，睡得更安稳。`,
                cost: `消耗：${this.costText(level.upgrade)}`,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeBed()
            };
        },
        // 执行床升级（满足材料时扣减并升级）
        doUpgradeBed() {
            const bed = this.currentBed;
            if (!bed || bed.bedLevel >= bed.bedLevels.length - 1) return;
            const cost = bed.bedLevels[bed.bedLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            bed.bedLevel++;
            this.pushLog(`床升级为「${bed.bedLevels[bed.bedLevel].name}」，恢复效果更好了。`);
            this.postSceneState();
        },
        // 床：点击睡眠 → 弹窗确认（确认后触发进度条动画，并在动画期间加速推进游戏时间）
        startSleep(mode) {
            if (this.sleeping) return;   // 动画进行中，禁止重复点击
            const label = mode === '1h' ? '睡 1 小时' : mode === '4h' ? '睡 4 小时' : '睡到天亮';
            this.dialog = {
                show: true,
                icon: '🛏️',
                title: label,
                desc: '确认睡觉？睡眠期间时间加速，恢复精力、血量与体力。',
                cost: '',
                confirmText: '睡觉',
                onConfirm: () => this.doStartSleep(mode)
            };
        },
        // 执行睡眠（开始动画并加速推进游戏时间；通知床子页播放进度条）
        doStartSleep(mode) {
            if (this.sleeping) return;   // 动画进行中，禁止重复点击
            const delta = this.sleepSeconds(mode);
            this.sleepDelta = delta;
            this.sleepTarget = this.gameSeconds + delta;
            this.sleeping = mode;
            this.postSceneState();   // 通知床子页开始进度条动画
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
