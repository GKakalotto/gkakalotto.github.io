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
        // 状态条百分比：按各自上限换算（血量受健康影响；力量为等级 1-10）
        statPct(key) {
            const limits = { hunger: 150, water: 150, sanity: 200, health: 100, strength: 10 };
            const max = key === 'hp' ? this.hpMax : (limits[key] || 100);
            if (!max) return 0;
            return Math.round(Math.max(0, Math.min(1, this.stats[key] / max)) * 100);
        },
        // 是否低状态：力量不计入；其余状态低于上限 30% 时返回 true（用于红色光晕提示）
        isLow(key) {
            if (key === 'strength') return false;
            return this.statPct(key) < 30;
        },
        // 状态上限：hp 受健康度影响，其余为固定值；strength 为等级 1-10
        statMax(key) {
            if (key === 'hp') return this.hpMax;
            const limits = { hunger: 150, water: 150, sanity: 200, health: 100, strength: 10 };
            return limits[key] || 100;
        },
        // 点击状态图标：弹出详情（当前值/上限 + 对应恢复物品）
        openStatDetail(key) {
            const label = (this.statItems.find(s => s.key === key) || {}).label || key;
            // 力量：展示人物的攻击（基础+武器）、减伤（装备防甲最高）与暴击率（暴击 2 倍伤害）
            if (key === 'strength') {
                const str = this.stats.strength || 1;
                const baseAtk = Math.round(5 + (str - 1) * 1.5);
                const wpnDmg = (this.equipment.weapon && this.equipment.weapon.damage) || 0;
                const red = Math.max((this.equipment.hat && this.equipment.hat.damageReduction) || 0, (this.equipment.armor && this.equipment.armor.damageReduction) || 0);
                const crit = this.playerCrit();
                this.statDetail = {
                    key: key,
                    name: label,
                    value: this.stats[key],
                    max: this.statMax(key),
                    items: [],
                    attr: [
                        { label: '攻击', value: baseAtk, sub: wpnDmg ? `（+${wpnDmg}）` : '' },
                        { label: '减伤', value: red + '%', sub: '' },
                        { label: '暴击', value: crit + '%', sub: '' }
                    ]
                };
                return;
            }
            // 物品来源：家→背包+仓库；地图→仅背包；地点→背包+该地点暂存点
            // 按恢复目标 stat 筛选并聚合（记录首个可用位置用于点击使用）
            const map = {};
            const addToMap = (it, source, index) => {
                const cfg = it.restore || GameData.itemUse[it.type];
                if (!cfg || cfg.stat !== key) return;
                if (!map[it.name]) map[it.name] = { name: it.name, count: 0, amount: cfg.amount || 0, statName: cfg.statName || '', source: source, index: index };
                map[it.name].count += (it.count || 1);
            };
            this.bag.forEach((it, i) => addToMap(it, 'bag', i));
            if (this.currentScene === 'safehouse') {
                (this.storageItems || []).forEach((it, i) => { if (!map[it.name]) addToMap(it, 'storage', i); });
            } else if (this.currentScene === 'place') {
                const stash = (this.currentPlace && this.placeStash[this.currentPlace.key]) || [];
                stash.forEach((it, i) => { if (!map[it.name]) addToMap(it, 'stash', i); });
            }
            const items = Object.values(map);
            let emptyText = '暂无可恢复该状态的物品';
            if (key === 'strength') emptyText = '力量为等级属性，无法通过物品提升';
            else if (key === 'sanity') emptyText = '暂无直接恢复理智的物品';
            this.statDetail = {
                key: key,
                name: label,
                value: this.stats[key],
                max: this.statMax(key),
                items: items,
                emptyText: emptyText
            };
            // 打开后滚动区回到顶部
            this.$nextTick(() => { const el = document.querySelector('.stat-detail-body'); if (el) el.scrollTop = 0; });
        },
        // 关闭状态详情弹窗
        closeStatDetail() {
            this.statDetail = null;
        },
        // 状态弹窗点击恢复物品：弹确认框，确认后使用该物品并刷新
        useStatItem(item) {
            if (!item || !this.statDetail) return;
            const key = this.statDetail.key;
            this.dialog = {
                show: true, icon: '❓',
                title: `使用「${item.name}」？`,
                desc: `恢复 ${item.amount} 点${item.statName || ''}。`,
                confirmText: '使用',
                onConfirm: () => {
                    this.useItem(item.source, item.index);
                    this.openStatDetail(key);
                }
            };
        },
        // 背包 / 家具 / 床 / 工作台 / 仓库：点击均改为 iframe 加载对应子页
        openBag() {
            // 战斗中禁止切页，避免中断战斗（定时器仍在后台运行）
            if (this.battle && !this.battle.over) {
                this.pushLog('战斗中无法打开背包！');
                return;
            }
            this.currentPage = 'bag';
        },
        // 背包：点击升级 → 弹窗确认（扩充容量；升级还需力量等级）
        upgradeBag() {
            if (this.bagLevel >= GameData.bagLevels.length - 1) return;
            const level = GameData.bagLevels[this.bagLevel];
            const next = GameData.bagLevels[this.bagLevel + 1];
            this.dialog = {
                show: true, icon: '🎒',
                title: `升级背包：${next.name}`,
                desc: next.str
                    ? `容量 ${level.capacity} → ${next.capacity}，需力量 ${next.str} 级。`
                    : `容量 ${level.capacity} → ${next.capacity}，能携带更多物资。`,
                costMap: level.upgrade,
                needStr: next.str || 0,
                confirmText: '升级',
                onConfirm: () => this.doUpgradeBag()
            };
        },
        // 执行背包升级（满足材料与力量时扣减并升级，bagMax 随等级更新）
        doUpgradeBag() {
            if (this.bagLevel >= GameData.bagLevels.length - 1) return;
            const next = GameData.bagLevels[this.bagLevel + 1];
            if (next.str && this.stats.strength < next.str) {
                this.pushLog(`力量不足 ${next.str} 级，无法升级背包。`);
                return;
            }
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
            else if (f.isFireplace) this.openFire(f);
            else if (f.isStove) { if (!f.unlocked) this.openFurniture(f); else this.openStove(f); }
            else if (f.isRainCollector) { if (!f.unlocked) this.openFurniture(f); else this.openRain(f); }
            else if (f.isJuicer) { if (!f.unlocked) this.openFurniture(f); else this.openJuicer(f); }
            else if (f.isFurnace) { if (!f.unlocked) this.openFurniture(f); else this.openFurnace(f); }
            else if (f.isPlantation) { if (!f.unlocked) this.openFurniture(f); else this.openPlantation(f); }
            else this.openFurniture(f);
        },
        // 床/仓库升级与工作台制作共用的材料查询：安全屋时可读取背包 + 仓库，外出时仅背包
        // 无 count 字段的物品（工具/武器等单件）视为 1，与 spendMaterials 的扣减口径一致
        materialCount(name) {
            const it = this.bag.find(i => i.name === name);
            let n = it ? (it.count === undefined ? 1 : it.count) : 0;
            if (this.currentScene === 'safehouse') {
                const si = this.storageItems.find(i => i.name === name);
                if (si) n += si.count === undefined ? 1 : si.count;
            }
            return n;
        },
        // 材料消耗文案：{金属废料:2, 布料:1} → '金属废料 ×2、布料 ×1'
        costText(cost) {
            return Object.keys(cost).map(k => `${k} ×${cost[k]}`).join('、');
        },
        // 消耗材料：cost {材料:数量} 从背包扣减（安全屋不足时从仓库补）；扣减后数量为 0 的条目移除
        spendMaterials(cost) {
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
                if (this.currentScene === 'safehouse') {
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
            }
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
        // 执行制作（消耗材料，产物按蓝图 count 批量加入背包，堆叠上限 20）
        doCraft(bp) {
            if (!this.hasMaterials(bp.cost)) return;
            this.spendMaterials(bp.cost);
            const count = bp.count || 1;
            this.addBag({ type: bp.type, name: bp.name, damage: bp.damage, defense: bp.defense, durability: bp.durability, restore: bp.restore, count: count });
            this.pushLog(`你制作了「${bp.name}」${count > 1 ? '×' + count : ''}。`);
            // 刷新工作台材料颜色 / 背包子页
            this.postSceneState();
        },
        // 仓库当前容量上限（固定 200 格，升级只提升堆叠上限）
        // 仓库容量无限
        storageCapacity() {
            return 999999;
        },
        // 仓库每槽堆叠上限固定 20（不随等级变化）
        storageStack() {
            return 20;
        },
        // 背包 → 仓库（仅安全屋可存取；普通物品按仓库堆叠上限合并，耐久物品不堆叠，放不下的剩余留在背包）
        // 背包 → 仓库：每次转移 1 件（耐久物品整件占一槽）
        moveToStorage(index) {
            const it = this.bag[index];
            if (!it) return;
            if (this.currentScene !== 'safehouse') return;
            const stack = this.storageStack();
            const durable = !!it.durability;
            if (!durable) {
                // 同类已有且未满：叠加 1 件
                const si = this.storageItems.find(s => s.name === it.name && (s.count || 1) < stack);
                if (si) { si.count++; }
                else {
                    if (this.storageItems.length >= this.storageCapacity()) { this.pushLog('仓库已满。'); return; }
                    this.storageItems.push({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, restore: it.restore, durability: it.durability, count: 1 });
                }
            } else {
                if (this.storageItems.length >= this.storageCapacity()) { this.pushLog('仓库已满。'); return; }
                this.storageItems.push({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, restore: it.restore, durability: it.durability, count: 1 });
            }
            // 背包扣 1 件
            if (it.count && it.count > 1) it.count--;
            else this.bag.splice(index, 1);
            this.pushLog(`放入仓库「${it.name}」1 件。`);
            this.postSceneState();
        },
        // 仓库 → 背包：每次转移 1 件（耐久物品整件占一槽）
        moveToBag(index) {
            const it = this.storageItems[index];
            if (!it) return;
            const durable = !!it.durability;
            const take = durable ? 1 : 1;
            // 检查背包是否放得下 1 件
            if (durable) {
                if (this.bag.length >= this.bagMax) { this.pushLog('背包已满，无法取出。'); return; }
            } else {
                const existing = this.bag.find(b => b.name === it.name && (b.count || 1) < 20);
                const emptySlots = Math.max(0, this.bagMax - this.bag.length);
                if (!existing && emptySlots <= 0) { this.pushLog('背包已满，无法取出。'); return; }
            }
            if (it.count && it.count > 1) {
                it.count--;
                this.addBag({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, count: take });
            } else {
                this.storageItems.splice(index, 1);
                this.addBag({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, count: take });
            }
            this.postSceneState();
        },
        // 背包能否容纳某物品（耐久物品每件占一槽不堆叠；普通物品按同类未满槽 + 空槽×20）
        canFitBag(item) {
            if (item.durability) {
                return Math.max(0, this.bagMax - this.bag.length) >= (item.count || 1);
            }
            const MAX = 20;
            let space = 0;
            for (const it of this.bag) {
                if (it.name === item.name) space += MAX - (it.count || 1);
            }
            space += Math.max(0, this.bagMax - this.bag.length) * MAX;
            return space >= (item.count || 1);
        },
        // 自动整理：普通同类尽可能叠放（背包上限 20）；耐久物品不合并、按名排序
        sortBag() {
            const MAX = 20;
            const durable = [];
            const groups = {};
            for (const it of this.bag) {
                if (it.durability) { durable.push(it); continue; }
                const key = it.name;
                if (!groups[key]) groups[key] = [];
                groups[key].push(it);
            }
            const sorted = [];
            for (const key of Object.keys(groups).sort()) {
                const items = groups[key];
                const base = items[0];
                let total = items.reduce((s, it) => s + (it.count || 1), 0);
                while (total > 0) {
                    const take = Math.min(total, MAX);
                    sorted.push({ name: base.name, type: base.type, restore: base.restore, count: take });
                    total -= take;
                }
            }
            durable.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            this.bag = sorted.concat(durable);
            this.pushLog('背包已自动整理。');
            this.postSceneState();
        },
        // 自动整理：普通同类尽可能叠放（按仓库当前堆叠上限）；耐久物品不合并、按名排序
        sortStorage() {
            const stack = this.storageStack();
            const durable = [];
            const groups = {};
            for (const it of this.storageItems) {
                if (it.durability) { durable.push(it); continue; }
                const key = it.name;
                if (!groups[key]) groups[key] = [];
                groups[key].push(it);
            }
            const sorted = [];
            for (const key of Object.keys(groups).sort()) {
                const items = groups[key];
                const base = items[0];
                let total = items.reduce((s, it) => s + (it.count || 1), 0);
                while (total > 0) {
                    const take = Math.min(total, stack);
                    sorted.push({ name: base.name, type: base.type, restore: base.restore, count: take });
                    total -= take;
                }
            }
            durable.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            this.storageItems = sorted.concat(durable);
            this.pushLog('仓库已自动整理。');
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
        // 装备物品：从背包取出放入对应槽（武器/帽子/防具）；同槽已有装备先卸下回背包
        equipItem(index) {
            const it = this.bag[index];
            if (!it) return;
            const slot = this.slotOf(it.type, it.name, it.slot);
            if (!slot) return;
            if (this.equipment[slot]) {
                if (this.bag.length >= this.bagMax) { this.pushLog('背包已满，无法替换装备。'); return; }
                this.bag.push(this.equipment[slot]);
            }
            this.equipment[slot] = it;
            this.bag.splice(index, 1);
            this.pushLog(`装备了「${it.name}」（${this.slotLabel(slot)}槽）。`);
            this.postSceneState();
        },
        // 卸下装备：放回背包
        unequipSlot(slot) {
            const it = this.equipment[slot];
            if (!it) return;
            if (this.bag.length >= this.bagMax) { this.pushLog('背包已满，无法卸下装备。'); return; }
            this.equipment[slot] = null;
            this.bag.push(it);
            this.pushLog(`卸下了「${it.name}」（${this.slotLabel(slot)}槽）。`);
            this.postSceneState();
        },
        // 物品对应装备槽：武器→武器；工具→工具；防具→优先 slot 字段（hat/armor），否则按名字（含"盔/帽"→hat）
        slotOf(type, name, slot) {
            if (type === 'weapon') return 'weapon';
            if (type === 'tool') return 'tool';
            if (type === 'armor') {
                if (slot === 'hat' || slot === 'armor') return slot;
                return (name && (name.includes('盔') || name.includes('帽'))) ? 'hat' : 'armor';
            }
            return null;
        },
        // 装备槽显示名
        slotLabel(slot) {
            return { weapon: '武器', tool: '工具', hat: '帽子', armor: '防具' }[slot] || '';
        },
        // 使用物品（吃/喝/使用药品）：恢复对应状态，状态已满时提示
        useItem(source, index) {
            let list;
            if (source === 'storage') list = this.storageItems;
            else if (source === 'stash') list = (this.currentPlace && this.placeStash[this.currentPlace.key]) || [];
            else list = this.bag;
            const it = list[index];
            if (!it) return;
            // 熟食/菜谱等物品自带 restore，否则按类型取默认使用效果
            const cfg = it.restore || GameData.itemUse[it.type];
            if (!cfg) return;
            // 血量上限受健康度影响，其余用默认上限
            const max = cfg.stat === 'hp' ? this.hpMax : cfg.max;
            if (this.stats[cfg.stat] >= max) {
                this.pushLog(`「${it.name}」：${cfg.statName}已满，暂时不需要。`);
                return;
            }
            this.stats[cfg.stat] = Math.min(max, this.stats[cfg.stat] + cfg.amount);
            // 单件消耗：count > 1 时扣 1，否则移除条目
            if (it.count && it.count > 1) it.count--;
            else list.splice(index, 1);
            const label = cfg.label || ((it.type === 'water' || it.type === 'drink') ? '喝' : '吃');
            this.pushLog(`你${label}了「${it.name}」，${cfg.statName} +${cfg.amount}。`);
            // 榨汁机果汁（type: 'drink'）额外恢复理智（精神值），上限 200
            if (it.type === 'drink') {
                const before = this.stats.sanity;
                this.stats.sanity = Math.min(200, this.stats.sanity + cfg.amount);
                const real = this.stats.sanity - before;
                if (real > 0) this.pushLog(`🧃 维生素让你精神一振，理智 +${real}。`);
            }
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
                desc: '确认睡觉？睡眠期间时间加速，恢复血量与理智。',
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
            this.pushLog(`当前状态：血量 ${Math.round(s.hp)} / 理智 ${Math.round(s.sanity)}`);
            this.lastSleepAt = this.gameSeconds;   // 重置失眠计时：睡过一觉，重新获得 24 小时宽限
            this.insomniaWarned = false;
            this.sleeping = null;
            // 通知床子页清除动画状态
            this.postSceneState();
        },
        // 按当前床倍率结算 血量 / 理智（精神值） 恢复（血量上限受健康度、理智上限固定 200）
        applySleep(bed, hours) {
            const cfg = GameData.bedSleep;
            const mult = bed.bedLevels[bed.bedLevel].recover;
            const limits = { hp: this.hpMax, sanity: 200 };
            ['hp', 'sanity'].forEach(k => {
                const gain = (cfg.base[k] || 0) * hours * mult;
                this.stats[k] = Math.min(limits[k], this.stats[k] + gain);
            });
        },
        // 熔炉加燃料等：背包+仓库某物品总数量（熔炉仅在安全屋使用，等价于 materialCount）
        combinedCount(name) {
            return this.materialCount(name);
        },
        // 灶台/榨汁/熔炉/种植共用材料是否充足：这些操作均在安全屋进行，等价于 hasMaterials（背包+仓库）
        hasCombined(cost) {
            return this.hasMaterials(cost);
        },
        // 灶台/榨汁/熔炉/种植共用扣料：均在安全屋进行，等价于 spendMaterials（背包优先，仓库补足）
        spendCombined(cost) {
            this.spendMaterials(cost);
        },
        // 制作/榨汁：点击后扣料并进入耗时进度（动画期间推进游戏时间，结束后产出）
        startCooking(kind, name) {
            if (this.cooking) return;
            const list = kind === 'stove' ? GameData.stoveMenu : GameData.juiceRecipes;
            const a = list.find(x => x.name === name);
            if (!a) return;
            if (kind === 'stove') {
                if (!this.currentStove) return;
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
        // 篝火烹饪（烤肉/烤鱼/烧水等）：烧水需先放锅
        startFireCook(name) {
            if (this.cooking) return;
            const fire = this.currentFire;
            if (!fire) return;
            const a = GameData.fireMenu.find(x => x.name === name);
            if (!a) return;
            if (a.needsPot && !fire.hasPot) { this.pushLog('烧水需要在篝火上放一口锅。'); return; }
            const o = a.output;
            const existing = this.bag.find(i => i.name === o.name);
            if (this.bag.length >= this.bagMax && !existing) {
                this.pushLog('背包已满，无法放入成品。');
                return;
            }
            if (!this.hasCombined(a.inputs)) { this.pushLog(`材料不足，无法${name === '烧水' ? '烧水' : '烹饪'}「${name}」。`); return; }
            this.spendCombined(a.inputs);
            const COOK_MS = 1500;
            const COOK_SECONDS = 1800;
            this.cooking = { kind: 'fire', name, output: o };
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
        // 篝火锅槽：放入/取下锅
        toggleFirePot() {
            const fire = this.currentFire;
            if (!fire) return;
            if (fire.hasPot) {
                if (this.bag.length >= this.bagMax) { this.pushLog('背包已满，无法取下锅。'); return; }
                fire.hasPot = false;
                this.bag.push({ name: '锅', type: 'tool' });
                this.pushLog('把锅从篝火上取下。');
            } else {
                const idx = this.bag.findIndex(i => i.name === '锅');
                if (idx === -1) { this.pushLog('背包里没有锅。'); return; }
                fire.hasPot = true;
                this.bag.splice(idx, 1);
                this.pushLog('把锅放在了篝火上。');
            }
            this.postSceneState();
        },
        // 进度条动画结束：补齐剩余游戏时间并产出成品
        finishCooking() {
            if (!this.cooking) return;
            if (this.cookRAF) { cancelAnimationFrame(this.cookRAF); this.cookRAF = null; }
            const remain = this.cookTarget - this.gameSeconds;
            if (remain > 0) this.advanceGameTime(remain);
            const o = this.cooking.output;
            const kind = this.cooking.kind;
            this.addBag({ name: o.name, type: o.type, restore: o.restore, count: 1 });
            if (kind === 'stove') this.pushLog(`制作了「${o.name}」。`);
            else if (kind === 'fire') this.pushLog(`在篝火上做好了「${o.name}」。`);
            else this.pushLog(`榨了杯「${o.name}」。`);
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
        // 装瓶：把储量（向下取整）转为背包「雨水瓶」（type:water，堆叠上限 20）
        bottleRain() {
            const st = this.currentRain;
            const amt = st ? Math.floor(st.rainWater) : 0;
            if (!st || amt <= 0) return;
            st.rainWater = Math.max(0, st.rainWater - amt);
            this.addBag({ type: 'water', name: '雨水瓶', count: amt });
            this.pushLog(`装瓶 ${amt} 份雨水（雨水瓶）。`);
            this.postSceneState();
        },
        // ============ 熔炉 ============
        openFurnace(item) {
            this.currentFurnace = item;
            this.currentPage = 'furnace';
        },
        // 添加木板燃料：每块燃烧 1 游戏小时（3600 游戏秒），累计到剩余燃料
        addFurnaceFuel(count) {
            const f = this.currentFurnace;
            if (!f) return;
            const have = this.combinedCount('木板');
            if (have < count) {
                this.pushLog(`木板不足，还需要 ${count - have} 块。`);
                return;
            }
            this.spendCombined({ '木板': count });
            const add = count * HOUR_SECONDS;
            this.furnaceFuel += add;
            this.pushLog(`添加 ${count} 块木板，熔炉燃料可再燃烧 ${count} 小时。`);
            this.postSceneState();
        },
        // 开始加工：消耗原料（背包+仓库），加入后台加工队列（最多 6 槽）；需有燃料才会推进
        startFurnaceJob(name) {
            if (this.furnaceJobs.length >= 6) {
                this.pushLog('熔炉 6 个加工槽已满，请等待当前加工完成。');
                return;
            }
            const r = GameData.furnaceRecipes.find(x => x.name === name);
            if (!r) return;
            if (this.furnaceFuel <= 0) {
                this.pushLog('熔炉没有燃料（木板），请先添加木板。');
                return;
            }
            if (!this.hasCombined(r.inputs)) { this.pushLog(`原料不足，无法加工「${name}」。`); return; }
            this.spendCombined(r.inputs);
            const kind = r.output.name;   // '铁' / '塑料' / '玻璃'
            this.furnaceJobs.push({ kind, remaining: 30 * 60 });   // 30 游戏分钟
            this.pushLog(`熔炉开始加工${name}（槽 ${this.furnaceJobs.length}/6），约需 30 分钟（后台计时）。`);
            this.postSceneState();
        },
        // 单个加工槽完成：产出成品入背包
        furnaceOutput(job) {
            const out = { name: job.kind, type: 'material' };
            const existing = this.bag.find(i => i.name === out.name);
            if (this.bag.length >= this.bagMax && !existing) {
                this.pushLog(`背包已满，「${out.name}」未能放入。`);
            } else {
                this.addBag({ name: out.name, type: out.type, count: 1 });
                this.pushLog(`熔炉加工完成，得到「${out.name}」×1。`);
            }
        },
        // ============ 种植园 ============
        openPlantation(item) {
            this.currentPlantation = item;
            this.currentPage = 'plantation';
        },
        // 当前种植园槽位数（随等级提升）
        currentPlantSlots() {
            const p = this.furniture.find(f => f.isPlantation);
            return p ? p.plantationLevels[p.plantationLevel].slots : 0;
        },
        // 种植：消耗 1 个种子/作物（背包+仓库），加入后台生长队列（不超过槽位数）
        plantCrop(name) {
            if (this.plantationJobs.length >= this.currentPlantSlots()) {
                this.pushLog('种植园的槽位已满，请先收获或等待。');
                return;
            }
            const c = GameData.plantationCrops.find(x => x.name === name);
            if (!c) return;
            if (!this.hasCombined({ [c.seed]: 1 })) { this.pushLog(`没有「${c.seed}」，无法种植。`); return; }
            this.spendCombined({ [c.seed]: 1 });
            const total = (c.growHours || 2) * HOUR_SECONDS;
            this.plantationJobs.push({ name: c.name, seed: c.seed, type: c.type, total, remaining: total });
            this.pushLog(`你在种植园种下了「${c.seed}」。`);
            this.postSceneState();
        },
        // 收获：作物成熟（remaining<=0）后手动收获，得 1~3 果实，种子类作物概率返还种子
        harvestCrop(index) {
            const c = this.plantationJobs[index];
            if (!c) return;
            if (c.remaining > 0) return;
            this.plantationJobs.splice(index, 1);
            const n = this.randInt(1, 3);
            this.addBag({ name: c.name, type: c.type, count: n });
            this.pushLog(`你收获了「${c.name}」×${n}。`);
            // 种子类作物（seed !== name）30% 概率返还种子，保证可持续种植
            if (c.seed !== c.name && Math.random() < 0.3) {
                this.addBag({ name: c.seed, type: 'material', count: 1 });
                this.pushLog(`你捡回了一颗「${c.seed}」。`);
            }
            this.postSceneState();
        },
        // 种植园升级：弹窗确认
        upgradePlantation() {
            const p = this.currentPlantation;
            if (!p || p.plantationLevel >= p.plantationLevels.length - 1) return;
            const level = p.plantationLevels[p.plantationLevel];
            const next = p.plantationLevels[p.plantationLevel + 1];
            this.dialog = {
                show: true, icon: '🌱',
                title: `升级种植园：${next.name}`,
                desc: `种植槽位 ${level.slots} → ${next.slots}，可同时种更多作物。`,
                costMap: level.upgrade,
                confirmText: '升级',
                onConfirm: () => this.doUpgradePlantation()
            };
        },
        // 执行种植园升级（满足材料时扣减并升级）
        doUpgradePlantation() {
            const p = this.currentPlantation;
            if (!p || p.plantationLevel >= p.plantationLevels.length - 1) return;
            const cost = p.plantationLevels[p.plantationLevel].upgrade;
            if (!this.hasMaterials(cost)) return;
            this.spendMaterials(cost);
            p.plantationLevel++;
            this.pushLog(`种植园升级为「${p.plantationLevels[p.plantationLevel].name}」，槽位增加到 ${p.plantationLevels[p.plantationLevel].slots}。`);
            this.postSceneState();
        }
    }
};
