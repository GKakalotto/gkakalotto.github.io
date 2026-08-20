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
        // 背包：点击升级 → 弹窗确认（扩充容量）
        upgradeBag() {
            if (this.bagLevel >= GameData.bagLevels.length - 1) return;
            const level = GameData.bagLevels[this.bagLevel];
            const next = GameData.bagLevels[this.bagLevel + 1];
            this.dialog = {
                show: true, icon: '🎒',
                title: `升级背包：${next.name}`,
                desc: `容量 ${level.capacity} → ${next.capacity}，能携带更多物资。`,
                costMap: level.upgrade,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeBag()
            };
        },
        // 执行背包升级（满足材料时扣减并升级，bagMax 随等级更新）
        doUpgradeBag() {
            if (this.bagLevel >= GameData.bagLevels.length - 1) return;
            const cost = GameData.bagLevels[this.bagLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            this.bagLevel++;
            this.bagMax = GameData.bagLevels[this.bagLevel].capacity;
            this.pushLog(`背包升级为「${GameData.bagLevels[this.bagLevel].name}」，容量提升到 ${this.bagMax}。`);
            this.postSceneState();
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
        openStove(item) {
            this.currentStove = item;
            this.currentPage = 'stove';
        },
        openRain(item) {
            this.currentRain = item;
            this.currentPage = 'rain';
        },
        openChair(item) {
            this.currentChair = item;
            this.currentPage = 'chair';
        },
        openJuicer(item) {
            this.currentJuicer = item;
            this.currentPage = 'juicer';
        },
        // 按索引打开家具：按类型分发；未解锁的新设施先弹详情页（含解锁按钮），解锁后再进功能页
        openFurnitureByIndex(i) {
            const f = this.furniture[i];
            if (!f) return;
            if (f.isBed) this.openBed(f);
            else if (f.isWorkbench) this.openWorkbench(f);
            else if (f.isStorage) this.openStorage(f);
            else if (f.isFireplace) this.openFire(f);
            else if (f.isStove) { if (!f.unlocked) this.openFurniture(f); else this.openStove(f); }
            else if (f.isRainCollector) { if (!f.unlocked) this.openFurniture(f); else this.openRain(f); }
            else if (f.isChair) { if (!f.unlocked) this.openFurniture(f); else this.openChair(f); }
            else if (f.isJuicer) { if (!f.unlocked) this.openFurniture(f); else this.openJuicer(f); }
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
                costMap: level.upgrade,
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
            // 熟食/菜谱等物品自带 restore，否则按类型取默认使用效果
            const cfg = it.restore || GameData.itemUse[it.type];
            if (!cfg) return;
            if (this.stats[cfg.stat] >= cfg.max) {
                this.pushLog(`「${it.name}」：${cfg.statName}已满，暂时不需要。`);
                return;
            }
            this.stats[cfg.stat] = Math.min(cfg.max, this.stats[cfg.stat] + cfg.amount);
            // 单件消耗：count > 1 时扣 1，否则移除条目
            if (it.count && it.count > 1) it.count--;
            else list.splice(index, 1);
            const label = cfg.label || ((it.type === 'water' || it.type === 'drink') ? '喝' : '吃');
            this.pushLog(`你${label}了「${it.name}」，${cfg.statName} +${cfg.amount}。`);
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
                costMap: level.upgrade,
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
                costMap: level.upgrade,
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
        },
        // ============ 灶台 / 烹饪锅 ============
        upgradeStove() {
            const st = this.currentStove;
            if (!st || st.stoveLevel >= st.stoveLevels.length - 1) return;
            const level = st.stoveLevels[st.stoveLevel];
            const next = st.stoveLevels[st.stoveLevel + 1];
            this.dialog = {
                show: true, icon: '🍳',
                title: `升级灶台：${next.name}`,
                desc: st.stoveLevel === 0
                    ? `当前可加热食物、净水；升级为「${next.name}」后解锁菜谱做饭。`
                    : `升级为「${next.name}」。`,
                costMap: level.upgrade,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeStove()
            };
        },
        doUpgradeStove() {
            const st = this.currentStove;
            if (!st || st.stoveLevel >= st.stoveLevels.length - 1) return;
            const cost = st.stoveLevels[st.stoveLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            st.stoveLevel++;
            this.pushLog(`灶台升级为「${st.stoveLevels[st.stoveLevel].name}」，烹饪能力更强了。`);
            this.postSceneState();
        },
        // 灶台/榨汁共用：背包+仓库某物品总数量
        combinedCount(name) {
            const b = this.bag.filter(i => i.name === name).reduce((s, i) => s + (i.count || 1), 0);
            const s = this.storageItems.filter(i => i.name === name).reduce((s2, i) => s2 + (i.count || 1), 0);
            return b + s;
        },
        // 灶台/榨汁共用：材料是否充足（背包+仓库联合）
        hasCombined(cost) {
            for (const mat in cost) {
                if (this.combinedCount(mat) < cost[mat]) return false;
            }
            return true;
        },
        // 灶台/榨汁共用：扣料（背包优先，不足从仓库补）
        spendCombined(cost) {
            for (const mat in cost) {
                let need = cost[mat];
                for (const it of this.bag) {
                    if (need <= 0) break;
                    if (it.name === mat) {
                        const take = Math.min(need, it.count || 1);
                        it.count = (it.count || 1) - take;
                        need -= take;
                    }
                }
                this.bag = this.bag.filter(i => i.count === undefined || i.count > 0);
                for (const it of this.storageItems) {
                    if (need <= 0) break;
                    if (it.name === mat) {
                        const take = Math.min(need, it.count || 1);
                        it.count = (it.count || 1) - take;
                        need -= take;
                    }
                }
                this.storageItems = this.storageItems.filter(i => i.count === undefined || i.count > 0);
            }
        },
        // 制作/榨汁：点击后扣料并进入耗时进度（动画期间推进游戏时间，结束后产出）
        startCooking(kind, name) {
            if (this.cooking) return;
            const list = kind === 'stove' ? GameData.stoveMenu : GameData.juiceRecipes;
            const a = list.find(x => x.name === name);
            if (!a) return;
            if (kind === 'stove') {
                const st = this.currentStove;
                if (!st) return;
                if (st.stoveLevel < a.level) { this.pushLog(`「${name}」需先把灶台升级为烹饪锅。`); return; }
            } else if (!this.currentJuicer) {
                return;
            }
            const o = a.output;
            const existing = this.bag.find(i => i.name === o.name);
            if (this.bag.length >= this.bagMax && !existing) {
                this.pushLog('背包已满，无法放入成品。');
                return;
            }
            if (!this.hasCombined(a.inputs)) { this.pushLog(`材料不足，无法${kind === 'stove' ? '制作' : '榨汁'}「${name}」。`); return; }
            this.spendCombined(a.inputs);
            // 进入进度动画：1.5 秒内把 COOK_SECONDS 游戏秒推进完（顶部时间随之快速流动）
            const COOK_MS = 1500;
            const COOK_SECONDS = 1800;   // 烹饪耗时 30 游戏分钟
            this.cooking = { kind, name, output: o };
            this.cookTarget = this.gameSeconds + COOK_SECONDS;
            this.postSceneState();
            const speed = COOK_SECONDS / COOK_MS;
            let last = performance.now();
            const step = (now) => {
                if (!this.cooking) return;
                const dt = now - last;
                last = now;
                this.advanceGameTime(speed * dt);
                if (this.gameSeconds < this.cookTarget) {
                    this.cookRAF = requestAnimationFrame(step);
                }
            };
            this.cookRAF = requestAnimationFrame(step);
        },
        // 进度条动画结束：补齐剩余游戏时间并产出成品
        finishCooking() {
            if (!this.cooking) return;
            if (this.cookRAF) { cancelAnimationFrame(this.cookRAF); this.cookRAF = null; }
            const remain = this.cookTarget - this.gameSeconds;
            if (remain > 0) this.advanceGameTime(remain);
            const o = this.cooking.output;
            const kind = this.cooking.kind;
            const existing = this.bag.find(i => i.name === o.name);
            if (existing) existing.count = (existing.count || 1) + 1;
            else this.bag.push({ name: o.name, type: o.type, weight: o.weight, restore: o.restore, count: 1 });
            this.pushLog(kind === 'stove' ? `制作了「${o.name}」。` : `榨了杯「${o.name}」。`);
            this.cooking = null;
            this.postSceneState();
        },
        // ============ 雨水收集器 ============
        upgradeRain() {
            const st = this.currentRain;
            if (!st || st.rainLevel >= st.rainLevels.length - 1) return;
            const level = st.rainLevels[st.rainLevel];
            const next = st.rainLevels[st.rainLevel + 1];
            this.dialog = {
                show: true, icon: '🚿',
                title: `升级雨水收集器：${next.name}`,
                desc: `储水容量 ${level.capacity} → ${next.capacity}。`,
                costMap: level.upgrade,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeRain()
            };
        },
        doUpgradeRain() {
            const st = this.currentRain;
            if (!st || st.rainLevel >= st.rainLevels.length - 1) return;
            const cost = st.rainLevels[st.rainLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            st.rainLevel++;
            this.pushLog(`雨水收集器升级为「${st.rainLevels[st.rainLevel].name}」，储水容量提升到 ${st.rainLevels[st.rainLevel].capacity}。`);
            this.postSceneState();
        },
        // 装瓶：把储量（向下取整）转为背包「雨水瓶」（type:water）
        bottleRain() {
            const st = this.currentRain;
            const amt = st ? Math.floor(st.rainWater) : 0;
            if (!st || amt <= 0) return;
            const existing = this.bag.find(i => i.name === '雨水瓶');
            if (!existing && this.bag.length >= this.bagMax) {
                this.pushLog('背包已满，无法装瓶。');
                return;
            }
            st.rainWater = Math.max(0, st.rainWater - amt);
            if (existing) existing.count = (existing.count || 1) + amt;
            else this.bag.push({ type: 'water', name: '雨水瓶', weight: 0.55, count: amt });
            this.pushLog(`装瓶 ${amt} 份雨水（雨水瓶）。`);
            this.postSceneState();
        },
        // ============ 椅子 ============
        upgradeChair() {
            const st = this.currentChair;
            if (!st || st.chairLevel >= st.chairLevels.length - 1) return;
            const level = st.chairLevels[st.chairLevel];
            const next = st.chairLevels[st.chairLevel + 1];
            this.dialog = {
                show: true, icon: '🪑',
                title: `升级椅子：${next.name}`,
                desc: `休息恢复体力 ${level.restore} → ${next.restore}。`,
                costMap: level.upgrade,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeChair()
            };
        },
        doUpgradeChair() {
            const st = this.currentChair;
            if (!st || st.chairLevel >= st.chairLevels.length - 1) return;
            const cost = st.chairLevels[st.chairLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            st.chairLevel++;
            this.pushLog(`椅子升级为「${st.chairLevels[st.chairLevel].name}」，休息恢复体力提升到 ${st.chairLevels[st.chairLevel].restore}。`);
            this.postSceneState();
        },
        // 休息：推进 30 分钟游戏时间，恢复当前等级的体力（上限 100）
        restChair() {
            const st = this.currentChair;
            if (!st) return;
            const restore = st.chairLevels[st.chairLevel].restore;
            this.advanceGameTime(30 * 60);
            this.stats.physical = Math.min(100, this.stats.physical + restore);
            this.pushLog(`在「${st.chairLevels[st.chairLevel].name}」上休息，体力 +${restore}。`);
            this.postSceneState();
        }
    }
};
