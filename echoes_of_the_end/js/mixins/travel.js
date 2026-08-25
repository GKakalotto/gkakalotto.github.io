// ============ Mixin：确认弹窗流程与移动（地图数学见 navigation.js） ============
const TravelMixin = {
    methods: {
        // 推开大门 → 地图（iframe 加载地图页后自动渲染）
        goToMap() {
            this.currentScene = 'map';
            this.pushLog('你推开大门，湿冷的风迎面扑来。');
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
            const pos = this.gridPosOf(loc);
            const from = this.getLocationCoord();
            const to = this.gridToKm(pos.gx, pos.gy);
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
            this.startTravel(this.getPlayerGrid(), MapData.safehouseGridPos, this.pendingSeconds, () => {
                this.playerLocation = 'safehouse';
                this.pushLog('你回到了安全屋门前。');
                this.postSceneState();
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
            this.dialog.onConfirm = null;
            this.dialog.onCancel = null;
            this.dialog.show = false;
        },
        confirmAction() {
            // 通用确认（升级/睡觉/制作等携带回调）：关闭弹窗后执行
            if (this.dialog.onConfirm) {
                const fn = this.dialog.onConfirm;
                this.dialog.onConfirm = null;
                this.dialog.onCancel = null;
                this.dialog.show = false;
                fn.call(this);
                return;
            }
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
            this.currentPlace = null;
        },
        // 地图 → 返回安全屋
        backToSafehouse() {
            this.currentScene = 'safehouse';
            this.playerLocation = 'safehouse';
            this.currentPlace = null;
            this.pushLog('你回到安全屋，反手关上了门。');
        },
        // 实际步行前往地点：外壳推进时间，iframe 红点沿路径移动；到达后询问是否进入
        travelTo(loc) {
            const seconds = this.pendingSeconds;
            this.startTravel(this.getPlayerGrid(), this.gridPosOf(loc), seconds, () => {
                this.playerLocation = loc.name;
                this.pushLog(`你步行前往${loc.name}，耗时 ${this.formatDuration(seconds)}。`);
                this.postSceneState();
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
        // 进入地点：切换为搜刮场景（首次进入生成搜刮次数）
        enterLocation(loc) {
            this.currentPlace = { name: loc.name, icon: loc.icon, base: 'loc', key: loc.name, type: loc.type };
            this.currentScene = 'place';
            this.initLocationResources(loc);
            this.pushLog(`你进入了${loc.name}。`);
            this.postSceneState();
        },
        // 首次进入地点时生成房间数（特殊玩法地点无房间则不创建）
        initLocationResources(loc) {
            const cfg = GameData.locationLoot[loc.type];
            if (!cfg) return;
            // 拆车地点（停车场/驾校）：生成有限车辆数；旧档可能只有 roomsLeft，缺少 cars 时补上
            if (cfg.mode === 'dismantle') {
                const cur = this.locationResources[loc.name];
                if (!cur || typeof cur.cars !== 'number') {
                    this.locationResources[loc.name] = { cars: cfg.cars || 0 };
                    this.saveGame();
                }
                return;
            }
            if (this.locationResources[loc.name]) return;
            if (!cfg.rooms) return;
            this.locationResources[loc.name] = { roomsLeft: cfg.rooms };
            this.saveGame();
        },
        // 搜刮一个房间：耗时按装备栏工具（徒手45±3min，任意斧头50%，撬棍30%），进度条结束后产出若干物资
        startLocationSearch() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || place.base !== 'loc' || !place.key) return;
            const r = this.locationResources[place.key];
            if (!r || r.roomsLeft <= 0) { this.pushLog('这里已被搜刮一空了。'); return; }
            const tool = this.equipment && this.equipment.tool;
            let minutes;
            if (tool && tool.name.includes('斧')) {
                minutes = Math.round(45 * 0.5);            // 斧头：徒手的 50%
            } else if (tool && tool.name.includes('撬棍')) {
                minutes = Math.round(45 * 0.3);            // 撬棍：徒手的 30%
                // 撬棍搜刮：30% 概率损耗 1 耐久
                if (tool.durability && Math.random() < 0.3) {
                    tool.durability--;
                    if (tool.durability <= 0) {
                        this.equipment.tool = null;
                        this.pushLog('你的撬棍损坏了。');
                    }
                }
            } else {
                minutes = this.randInt(42, 48);            // 徒手：45±3
            }
            this.beginActivity('loc-search', minutes * 60);
        },
        // 按权重随机取 1 件掉落
        pickDrop(drops) {
            const total = drops.reduce((s, d) => s + d.w, 0);
            let r = Math.random() * total;
            for (const d of drops) {
                r -= d.w;
                if (r <= 0) return d;
            }
            return drops[0];
        },
        // 随机整数 [min, max]
        randInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        // 稀有武器名单（整档限量：消防斧/武士刀/撬棍，掉落受 rarityCaps 上限约束）
        isRareItem(d) {
            return d && (d.name === '消防斧' || d.name === '武士刀' || d.name === '撬棍');
        },
        // 统计全容器中某物品数量（背包/仓库/各地点暂存区/装备槽）
        ownedCount(name) {
            let n = 0;
            const count = (arr) => { if (arr) for (const it of arr) if (it.name === name) n += it.count || 1; };
            count(this.bag);
            count(this.storageItems);
            for (const k in this.placeStash) count(this.placeStash[k]);
            for (const slot in this.equipment) {
                if (this.equipment[slot] && this.equipment[slot].name === name) n += 1;
            }
            return n;
        },
        // 生成一个房间的物资：随机 4~8 件（按掉落池权重，可重复；稀有武器不超过档内上限）
        generateRoomLoot(cfg) {
            const drops = cfg && cfg.drops ? cfg.drops : [];
            const count = this.randInt(4, 8);
            const items = [];
            for (let i = 0; i < count; i++) {
                let d = this.pickDrop(drops);
                // 稀有武器整档限量：已达上限（含本次房间已掉落的）则不再掉落
                if (this.isRareItem(d)) {
                    const inLoot = items.filter(it => it.name === d.name).length;
                    if (this.ownedCount(d.name) + inLoot >= this.rarityCaps[d.name]) d = null;
                }
                if (d) {
                    // 可叠加物品（无耐久）同类合并显示；耐久物品每件独立一条
                    if (!d.durability) {
                        const found = items.find(x => x.name === d.name);
                        if (found) { found.count += 1; continue; }
                    }
                    items.push({ name: d.name, type: d.type, damage: d.damage, defense: d.defense, durability: d.durability, restore: d.restore, damageReduction: d.damageReduction, slot: d.slot, hungerMult: d.hungerMult, axe: d.axe, count: 1 });
                }
            }
            return items;
        },
        // 搜刮遇敌概率：基础 15% + 总天数×1%，封顶 60%；高风险地点（警察局）额外 +20%，封顶 80%
        searchEnemyChance(cfg) {
            let pct = Math.min(60, 15 + this.totalDay);
            if (cfg && cfg.enemyChance) pct = Math.min(80, pct + 20);
            return pct;
        },
        // 搜刮/遇敌结算：打开背包面板（有战利品则下部战利品区展示，否则显示仓库/暂存点）
        openBagAfterLoot() {
            this.currentPage = 'bag';
            if (this.pendingLoot && this.pendingLoot.items && this.pendingLoot.items.length) {
                this.pushLog(`本次获得 ${this.pendingLoot.items.length} 件战利品，在背包「战利品」区查看。`);
            }
            this.postSceneState();
        },
        // 从战利品取回一件到背包（满则落入当前地点暂存区）
        // 从战利品取回：每次 1 件（耐久物品整件占一槽），背包满则保留原处
        takeLoot(index) {
            const loot = this.pendingLoot;
            if (!loot) return;
            const item = loot.items[index];
            if (!item) return;
            const durable = !!item.durability;
            if (durable) {
                if (this.bag.length >= this.bagMax) { this.pushLog('背包已满，无法带走。'); return; }
            } else {
                const existing = this.bag.find(b => b.name === item.name && (b.count || 1) < 20);
                const emptySlots = Math.max(0, this.bagMax - this.bag.length);
                if (!existing && emptySlots <= 0) { this.pushLog('背包已满，无法带走。'); return; }
            }
            if (item.count && item.count > 1) {
                item.count--;
                this.addBag({ name: item.name, type: item.type, damage: item.damage, defense: item.defense, durability: item.durability, restore: item.restore, damageReduction: item.damageReduction, slot: item.slot, hungerMult: item.hungerMult, axe: item.axe, count: 1 });
            } else {
                loot.items.splice(index, 1);
                this.addBag({ name: item.name, type: item.type, damage: item.damage, defense: item.defense, durability: item.durability, restore: item.restore, damageReduction: item.damageReduction, slot: item.slot, hungerMult: item.hungerMult, axe: item.axe, count: 1 });
            }
            this.pushLog(`拿走了「${item.name}」1 件。`);
            this.saveGame();
            this.postSceneState();
        },
        // 物品落入暂存区：普通同类无限堆叠，耐久物品每件独立占一条
        stashAdd(key, item) {
            const list = this.placeStash[key] = this.placeStash[key] || [];
            const durable = !!item.durability;
            if (!durable) {
                const existing = list.find(it => it.name === item.name);
                if (existing) { existing.count = (existing.count || 1) + (item.count || 1); return; }
            }
            list.push({ name: item.name, type: item.type, damage: item.damage, defense: item.defense, durability: item.durability, restore: item.restore, damageReduction: item.damageReduction, slot: item.slot, hungerMult: item.hungerMult, axe: item.axe, count: item.count || 1 });
        },
        // 从当前地点暂存区取出物品放入背包（每次 1 件，耐久物品整件占一槽）
        stashTake(index) {
            const place = this.currentPlace;
            if (!place) return;
            const list = this.placeStash[place.key] || [];
            const it = list[index];
            if (!it) return;
            const durable = !!it.durability;
            if (durable) {
                if (this.bag.length >= this.bagMax) { this.pushLog('背包已满，无法取出。'); return; }
            } else {
                const existing = this.bag.find(b => b.name === it.name && (b.count || 1) < 20);
                const emptySlots = Math.max(0, this.bagMax - this.bag.length);
                if (!existing && emptySlots <= 0) { this.pushLog('背包已满，无法取出。'); return; }
            }
            if (it.count && it.count > 1) {
                it.count--;
                this.addBag({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, damageReduction: it.damageReduction, slot: it.slot, hungerMult: it.hungerMult, axe: it.axe, count: 1 });
            } else {
                list.splice(index, 1);
                this.addBag({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, damageReduction: it.damageReduction, slot: it.slot, hungerMult: it.hungerMult, axe: it.axe, count: 1 });
            }
            this.saveGame();
            this.postSceneState();
        },
        // 背包物品 → 战利品区（每次 1 件，耐久物品整件占一槽）
        moveToLoot(index) {
            const it = this.bag[index];
            if (!it) return;
            if (!this.pendingLoot) return;
            const durable = !!it.durability;
            if (!durable) {
                const found = this.pendingLoot.items.find(x => x.name === it.name && !x.durability);
                if (found) found.count += 1;
                else this.pendingLoot.items.push({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, damageReduction: it.damageReduction, slot: it.slot, hungerMult: it.hungerMult, axe: it.axe, count: 1 });
            } else {
                this.pendingLoot.items.push({ name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, damageReduction: it.damageReduction, slot: it.slot, hungerMult: it.hungerMult, axe: it.axe, count: 1 });
            }
            if (it.count && it.count > 1) it.count--;
            else this.bag.splice(index, 1);
            this.pushLog(`把「${it.name}」1 件放进了战利品区。`);
            this.postSceneState();
        },
        // 背包物品 → 当前地点暂存区（每次 1 件，耐久物品整件占一槽）
        moveToStash(index) {
            const it = this.bag[index];
            if (!it) return;
            const place = this.currentPlace;
            if (!place || !place.key) { this.pushLog('只有在地点中才能放入该地点的暂存区。'); return; }
            this.stashAdd(place.key, { name: it.name, type: it.type, damage: it.damage, defense: it.defense, durability: it.durability, restore: it.restore, damageReduction: it.damageReduction, slot: it.slot, hungerMult: it.hungerMult, axe: it.axe, count: 1 });
            if (it.count && it.count > 1) it.count--;
            else this.bag.splice(index, 1);
            this.pushLog(`把「${it.name}」1 件放进了该地点暂存区。`);
            this.saveGame();
            this.postSceneState();
        },
        // 打猎（动物园/森林）：需背包携带猎弓与箭，耗时 30 分钟，100%得生肉×1~3、30%得皮革×1；每次消耗 1 支箭，猎弓无耐久
        startHunt() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place) return;
            if (place.base !== 'loc' && place.base !== 'tree') return;
            const bow = this.bag.find(i => i.name === '猎弓');
            if (!bow) { this.pushLog('打猎需要猎弓，请先在背包中准备（工作台制作）。'); return; }
            const arrows = this.bag.find(i => i.name === '箭');
            if (!arrows || (arrows.count || 0) <= 0) { this.pushLog('打猎需要箭，请先在背包中准备（工作台制作）。'); return; }
            if (arrows.count && arrows.count > 1) arrows.count--;
            else this.bag = this.bag.filter(i => i !== arrows);
            this.beginActivity('hunt', 30 * 60);
        },
        // 采摘野菜（植物园）：耗时 10 分钟，得草药×2
        startForage() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || place.base !== 'loc') return;
            this.beginActivity('forage', 10 * 60);
        },
        // 取水（河边）：耗时 5 分钟，得脏水×3
        startDrawWater() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || place.base !== 'loc') return;
            this.beginActivity('drawwater', 5 * 60);
        },
        // 取汽油（加油站）：耗时 5 分钟，得汽油×5（无限）
        startPumpGas() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || place.base !== 'loc') return;
            this.beginActivity('pumpgas', 5 * 60);
        },
        // 拆除汽车（停车场/驾校）：需背包携带汽油喷灯与汽油，消耗 1 汽油，耗时 10 分钟，车数有限
        startDismantle() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || place.base !== 'loc') return;
            const r = this.locationResources[place.key];
            if (!r || r.cars <= 0) { this.pushLog('这里的车都被拆完了。'); return; }
            const torch = this.equipment && this.equipment.tool;
            if (!torch || torch.name !== '汽油喷灯') { this.pushLog('拆除汽车需要装备汽油喷灯（消防局搜刮获得）。'); return; }
            // 耐久为 0：背包有汽油则自动添加（1 汽油 = 3 耐久），否则无法拆除
            if (torch.durability <= 0) {
                const gasIdx = this.bag.findIndex(i => i.name === '汽油');
                if (gasIdx === -1) {
                    this.pushLog('汽油喷灯燃料耗尽，背包没有汽油，无法拆除车辆。');
                    return;
                }
                const g = this.bag[gasIdx];
                if (g.count && g.count > 1) g.count--;
                else this.bag.splice(gasIdx, 1);
                torch.durability += 3;
                this.pushLog('汽油喷灯燃料耗尽，自动消耗 1 单位汽油补充燃料（+3 耐久）。');
            }
            // 每次拆车消耗 1 耐久
            torch.durability--;
            r.cars--;
            this.beginActivity('dismantle', 10 * 60);
        },
        // 钓鱼（河边）：耗时 15 分钟，概率钓到鱼；需要背包携带鱼竿，鱼竿有耐久（每次 -1，损坏消失）
        startFish() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || place.base !== 'loc') return;
            const rod = this.bag.find(i => i.name === '鱼竿');
            if (!rod) {
                this.pushLog('钓鱼需要鱼竿，请先在背包中准备一根（工作台制作）。');
                return;
            }
            if (rod.durability) {
                rod.durability--;
                if (rod.durability <= 0) {
                    this.bag = this.bag.filter(i => i !== rod);
                    this.pushLog('你的鱼竿损坏了。');
                }
            } else {
                this.spendMaterials({ '鱼竿': 1 });
            }
            this.beginActivity('fish', 15 * 60);
        },
        // 领养狗（动物园）：消耗 1 份肉，狗加入安全屋狗舍
        adoptDog() {
            if (this.activity || this.searching) return;
            const dog = this.outdoors[0];
            if (!dog) return;
            if (dog.unlocked) { this.pushLog('大黄已经在狗舍里了。'); return; }
            const meat = this.bag.find(i => i.name === '生肉' || i.name === '烤肉' || i.name === '肉干');
            if (!meat) { this.pushLog('需要一块肉（生肉/烤肉/肉干）来吸引狗。'); return; }
            if (meat.count && meat.count > 1) meat.count--;
            else this.bag = this.bag.filter(i => i !== meat);
            dog.unlocked = true;
            this.pushLog('🐕 大黄闻着肉香跟了过来，加入了狗舍！');
            this.saveGame();
            this.postSceneState();
        },
        // 点击公园/树格：确认前往（已在当前格则耗时 0，直接询问是否进入）
        openCellConfirm(key, base) {
            if (this.moving) {
                this.pushLog('⏳ 正在移动中，请稍候。');
                return;
            }
            const [gx, gy] = key.split(',').map(Number);
            this.pendingCell = { gx, gy, key, base };
            // 当前所在格即目标格：移动耗时 0，直接询问是否进入
            const cur = this.getPlayerGrid();
            const atCurrent = cur.gx === gx && cur.gy === gy;
            const from = this.getLocationCoord();
            const to = this.gridToKm(gx, gy);
            this.pendingSeconds = atCurrent ? 0 : this.travelSeconds(from, to);
            const meta = base === 'park' ? { icon: '🌳', title: '公园绿地', desc: '一片安静的公园绿地，可以放松片刻。' }
                : base === 'mine' ? { icon: '⛏️', title: '矿场', desc: '废弃的采石场，还能翻出些矿藏。' }
                : base === 'sand' ? { icon: '🏜️', title: '沙石场', desc: '河滩边的沙石场，石头和沙子取之不尽。' }
                : { icon: '🌲', title: '森林', desc: '地图边缘的树林，草木茂密。' };
            this.dialog = {
                show: true,
                icon: meta.icon,
                title: meta.title,
                desc: meta.desc,
                cost: atCurrent ? '' : `步行约 ${this.formatDuration(this.pendingSeconds)}`,
                action: atCurrent ? 'enter-cell' : 'cell'
            };
        },
        // 前往公园/树格/矿场：到达后询问是否进入
        travelToCell(cell) {
            const seconds = this.pendingSeconds;
            const from = this.getPlayerGrid();
            this.startTravel(from, { gx: cell.gx, gy: cell.gy }, seconds, () => {
                this.playerLocation = (cell.base === 'park' ? 'park:' : cell.base === 'mine' ? 'mine:' : cell.base === 'sand' ? 'sand:' : 'tree:') + cell.key;
                const meta = cell.base === 'park' ? { icon: '🌳', title: '公园绿地', name: '一片公园绿地' }
                    : cell.base === 'mine' ? { icon: '⛏️', title: '矿场', name: '一座矿场' }
                    : cell.base === 'sand' ? { icon: '🏜️', title: '沙石场', name: '一处沙石场' }
                    : { icon: '🌲', title: '森林', name: '地图边缘的树林' };
                this.pushLog(`你来到了${meta.name}。`);
                this.postSceneState();
                this.dialog = {
                    show: true,
                    icon: meta.icon,
                    title: meta.title,
                    desc: meta.name,
                    cost: '',
                    action: 'enter-cell'
                };
            });
        },
        // 进入公园/树格/矿场：切换为资源点场景（首次进入生成有限资源）
        enterCell(cell) {
            const meta = cell.base === 'park' ? { name: '公园绿地', icon: '🌳' }
                : cell.base === 'mine' ? { name: '矿场', icon: '⛏️' }
                : cell.base === 'sand' ? { name: '沙石场', icon: '🏜️' }
                : { name: '森林', icon: '🌲' };
            this.currentPlace = {
                name: meta.name,
                icon: meta.icon,
                base: cell.base,
                key: `${cell.base}:${cell.key}`
            };
            this.currentScene = 'place';
            this.initCellResources(this.currentPlace);
            this.pushLog(`你进入了${meta.name}。`);
            this.postSceneState();
        },
        // 首次进入资源格时生成资源（树格=森林 200 棵；公园 50 棵；矿场无限不记录；黏土/搜索不限次数）
        initCellResources(place) {
            const key = place.key;
            if (this.cellResources[key]) return;
            if (place.base === 'mine' || place.base === 'sand') return;   // 矿场/沙石场资源无限
            this.cellResources[key] = { trees: place.base === 'tree' ? 200 : 50 };
            this.saveGame();
        },
        // 物品入背包：普通物品堆叠上限 20；耐久物品（武器/工具/防具）禁止堆叠、每件占一槽；返回未放下的数量
        addBag(item) {
            if (item.durability) {
                if (this.bag.length >= this.bagMax) {
                    this.pushLog('背包已满，部分物品未能收纳。');
                    return item.count || 1;
                }
                this.bag.push({ name: item.name, type: item.type, damage: item.damage, defense: item.defense, durability: item.durability, restore: item.restore, damageReduction: item.damageReduction, slot: item.slot, hungerMult: item.hungerMult, axe: item.axe, count: 1 });
                return 0;
            }
            const MAX = 20;
            let remaining = item.count || 1;
            for (const it of this.bag) {
                if (remaining <= 0) break;
                if (it.name === item.name) {
                    const space = MAX - (it.count || 1);
                    if (space > 0) {
                        const take = Math.min(remaining, space);
                        it.count = (it.count || 1) + take;
                        remaining -= take;
                    }
                }
            }
            while (remaining > 0) {
                if (this.bag.length >= this.bagMax) break;
                const take = Math.min(remaining, MAX);
                this.bag.push({ name: item.name, type: item.type, restore: item.restore, count: take });
                remaining -= take;
            }
            if (remaining > 0) this.pushLog('背包已满，部分物品未能收纳。');
            return remaining;
        },
        // 砍树：需斧头（石斧20min/铁斧15min/钛斧·消防斧10min），斧头耐久每次 -1，损坏消失；开始时扣一棵树，进度条结束后产出原木×4 + 叶子/种子概率
        startChop() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || !place.key) return;
            const r = this.cellResources[place.key];
            if (!r || r.trees <= 0) { this.pushLog('这里的树已被砍光了。'); return; }
            const axe = this.equipment && this.equipment.tool;
            if (!axe || !axe.name.includes('斧') || (axe.durability !== undefined && axe.durability <= 0)) {
                this.pushLog('砍树需要装备一把有耐久的斧头（石斧/铁斧/钛斧/消防斧）。');
                return;
            }
            const dur = axe.durability;
            // 斧头类型决定砍树耗时
            let minutes = 20;
            if (axe.name.includes('钛斧') || axe.name.includes('消防斧')) minutes = 10;
            else if (axe.name.includes('铁斧')) minutes = 15;
            if (dur) {
                // 斧头类工作时 30% 概率损耗 1 耐久
                if (Math.random() < 0.3) {
                    axe.durability--;
                    if (axe.durability <= 0) {
                        // 消防斧为特例：耐久耗尽保留在装备栏（但不能再砍树）
                        if (axe.name === '消防斧') { this.pushLog('消防斧耐久耗尽，已无法砍树。'); }
                        else { this.equipment.tool = null; this.pushLog('你的斧头损坏了。'); }
                    }
                }
            }
            r.trees--;
            this.beginActivity('chop', minutes * 60);
        },
        // 挖土/沙石（5 分钟，需铲子）/ 挖矿（30 分钟，需镐子，矿藏无限）：工具耐久每次 -1，损坏消失
        startDig() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || !place.key) return;
            const isMine = place.base === 'mine';
            const isSand = place.base === 'sand';
            const toolName = isMine ? '镐子' : '铲子';
            const tool = this.equipment && this.equipment.tool;
            if (!tool || tool.name !== toolName) {
                this.pushLog(isMine ? '挖矿需要装备镐子，请在背包中先装备。' : (isSand ? '挖沙石需要装备铲子，请在背包中先装备。' : '挖土需要装备铲子，请在背包中先装备。'));
                return;
            }
            // 矿场：随机决定本次挖出的矿种（石头50% / 铜25% / 铁25%，矿藏无限）；沙石场：随机石头/沙子各50%
            const mined = isMine ? this.rollMineOre() : (isSand ? this.rollSand() : null);
            if (tool.durability) {
                tool.durability--;
                if (tool.durability <= 0) {
                    this.equipment.tool = null;
                    this.pushLog(`你的${toolName}损坏了。`);
                }
            }
            this.beginActivity('dig', (isMine ? 30 : 5) * 60, mined);
        },
        // 矿场挖矿产出：随机石头50% / 铜25% / 铁25%（互斥）
        rollMineOre() {
            const r = Math.random();
            if (r < 0.5) return '石头';
            if (r < 0.75) return '铜';
            return '铁';
        },
        // 沙石场产出：随机石头 / 沙子 各 50%（互斥）
        rollSand() {
            return Math.random() < 0.5 ? '石头' : '沙子';
        },
        // 启动单次资源动作：1.5 秒动画内把 seconds 游戏秒推进完（顶部时间快速流动）；extra 为结算需要的附加信息
        beginActivity(type, seconds, extra) {
            const MS = 1500;
            this.activity = { type, extra: extra || null };
            this.actionTarget = this.gameSeconds + seconds;
            this.postSceneState();
            const speed = seconds / MS;
            let last = performance.now();
            const step = (now) => {
                if (!this.activity) return;
                const dt = now - last;
                last = now;
                this.advanceGameTime(speed * dt);
                if (this.gameSeconds < this.actionTarget) {
                    this.actionRAF = requestAnimationFrame(step);
                }
            };
            this.actionRAF = requestAnimationFrame(step);
        },
        // 进度条动画结束：补齐剩余时间并结算产出
        finishActivity() {
            if (!this.activity) return;
            if (this.actionRAF) { cancelAnimationFrame(this.actionRAF); this.actionRAF = null; }
            const remain = this.actionTarget - this.gameSeconds;
            if (remain > 0) this.advanceGameTime(remain);
            if (this.activity.type === 'chop') {
                this.addBag({ type: 'material', name: '原木', count: 4 });
                let extra = '';
                // 50% 概率掉 1~3 片叶子（独立事件）
                if (Math.random() < 0.5) {
                    const leaves = this.randInt(1, 3);
                    this.addBag({ type: 'material', name: '叶子', count: leaves });
                    extra = `，掉落了 ${leaves} 片叶子`;
                }
                // 10% 概率掉种子：椰子/芒果/香蕉各 1/3（互斥）
                if (Math.random() < 0.1) {
                    const seeds = ['椰子种子', '芒果种子', '香蕉种子'];
                    const s = seeds[this.randInt(0, 2)];
                    this.addBag({ type: 'material', name: s, count: 1 });
                    extra += (extra ? '，还' : '，') + `发现了一颗${s}`;
                }
                this.pushLog(`你砍倒一棵树，获得原木×4${extra}。`);
            } else if (this.activity.type === 'loc-search') {
                const place = this.currentPlace;
                const r = place && place.key ? this.locationResources[place.key] : null;
                if (r && r.roomsLeft > 0) {
                    r.roomsLeft--;
                    const cfg = GameData.locationLoot[place.type];
                    // 全部地点搜刮都可能遭遇丧尸：概率随总天数上升，高风险地点（警察局）额外加成
                    const pct = this.searchEnemyChance(cfg);
                    if (Math.random() * 100 < pct) {
                        // 遇丧尸：无搜刮战利品，丧尸掉落物进入战利品区（先建空列表）
                        this.activity = null;
                        this.pendingLoot = { placeKey: place.key, items: [] };
                        this.spawnBattle(() => this.openBagAfterLoot());
                        return;
                    }
                    // 未遇敌：生成该房间战利品并打开背包
                    this.pendingLoot = { placeKey: place.key, items: this.generateRoomLoot(cfg) };
                    this.openBagAfterLoot();
                }
            } else if (this.activity.type === 'hunt') {
                // 打猎：100% 生肉×1~3，30% 皮革×1
                const n = this.randInt(1, 3);
                this.addBag({ type: 'rawfood', name: '生肉', count: n });
                let extra = '';
                if (Math.random() < 0.3) { this.addBag({ type: 'material', name: '皮革', count: 1 }); extra = '，还剥下了一张皮革'; }
                this.pushLog(`你猎到了一只动物，获得生肉×${n}${extra}。`);
            } else if (this.activity.type === 'forage') {
                // 采摘野菜（植物园）：得草药×2，并有概率额外发现一颗作物种子或野禽蛋
                this.addBag({ type: 'medicine', name: '草药', count: 2 });
                let extra = '';
                const roll = Math.random();
                if (roll < 0.25) {
                    const seeds = ['草莓种子', '菠萝种子', '西瓜种子', '香蕉种子', '椰子种子', '芒果种子'];
                    const s = seeds[Math.floor(Math.random() * seeds.length)];
                    this.addBag({ type: 'material', name: s, count: 1 });
                    extra = `，意外发现了一颗${s}`;
                } else if (roll < 0.4) {
                    this.addBag({ type: 'food', name: '蛋', count: 1 });
                    extra = '，还捡到了一枚野禽蛋';
                }
                this.pushLog(`你采了些野菜（草药×2）${extra}。`);
            } else if (this.activity.type === 'drawwater') {
                this.addBag({ type: 'dirty', name: '脏水', count: 3 });
                this.pushLog('你装了 3 份河水（脏水）。');
            } else if (this.activity.type === 'pumpgas') {
                this.addBag({ type: 'material', name: '汽油', count: 5 });
                this.pushLog('你加满了油，获得汽油×5。');
            } else if (this.activity.type === 'dismantle') {
                // 拆车：随机数量铁/布料/皮革/塑料，每种上限 5
                const mats = [
                    { name: '铁', count: this.randInt(1, 5) },
                    { name: '布料', count: this.randInt(1, 5) },
                    { name: '皮革', count: this.randInt(1, 5) },
                    { name: '塑料', count: this.randInt(1, 5) }
                ];
                const desc = [];
                for (const m of mats) {
                    this.addBag({ type: 'material', name: m.name, count: m.count });
                    desc.push(`${m.name}×${m.count}`);
                }
                this.pushLog(`你拆除了一辆汽车，获得${desc.join('、')}。`);
            } else if (this.activity.type === 'fish') {
                if (Math.random() < 0.7) {
                    this.addBag({ type: 'rawfood', name: '鱼', count: 1 });
                    this.pushLog('你钓到了一条鱼。');
                } else {
                    this.addBag({ type: 'water', name: '纯净水', count: 1 });
                    this.pushLog('你只捞上来一瓶干净的水。');
                }
            } else if (this.activity.extra) {
                // 挖矿（矿场）/ 挖沙石（沙石场）：随机产出，矿场石头50/铜25/铁25，沙石场石头50/沙子50
                const n = this.randInt(1, 3);
                this.addBag({ type: 'material', name: this.activity.extra, count: n });
                const kind = (this.currentPlace && this.currentPlace.base === 'sand') ? '沙石' : '矿石';
                this.pushLog(`你挖到了${this.activity.extra}${kind}×${n}。`);
            } else {
                this.addBag({ type: 'material', name: '黏土', count: 2 });
                this.pushLog('你挖了些黏土（×2）。');
            }
            this.activity = null;
            this.postSceneState();
        },
        // 开始搜索：持续状态，时间正常流动，每累计 SEARCH_INTERVAL 游戏秒随机产出一次
        startSearch() {
            if (this.activity || this.searching) return;
            const place = this.currentPlace;
            if (!place || !place.key) return;
            this.searching = true;
            this.searchAccum = 0;
            this.pushLog('你开始搜寻这片区域，时间将不断流逝……');
            this.postSceneState();
        },
        // 停止搜索
        stopSearch() {
            if (!this.searching) return;
            this.searching = false;
            this.searchAccum = 0;
            this.pushLog('你停止了搜寻。');
            this.postSceneState();
        },
        // 搜索产出：概率互斥获取草药/石头/垃圾（草药 1%、石头 10%、其余为垃圾）；
        // 动物园额外 15% 互斥概率找到蛋
        searchDrop() {
            let item, log;
            const isZoo = this.currentPlace && this.currentPlace.type === '动物园';
            const isBotanic = this.currentPlace && this.currentPlace.type === '植物园';
            if (isZoo && Math.random() < 0.15) {
                item = { type: 'food', name: '蛋' };
                log = '你在笼舍角落找到了一枚蛋。';
            } else if (isBotanic) {
                // 植物园搜寻：概率找到作物种子（各品种均分）或草药/野菜/野禽蛋
                const roll = Math.random();
                if (roll < 0.35) {
                    const seeds = ['草莓种子', '菠萝种子', '西瓜种子', '土豆', '甜菜'];
                    const s = seeds[Math.floor(Math.random() * seeds.length)];
                    item = { type: 'material', name: s };
                    log = `你在草丛里找到了一颗${s}。`;
                } else if (roll < 0.55) {
                    item = { type: 'medicine', name: '草药' };
                    log = '你采到了一些草药。';
                } else if (roll < 0.7) {
                    item = { type: 'food', name: '蛋' };
                    log = '你在灌丛里发现了一枚野禽蛋。';
                } else {
                    item = { type: 'material', name: '垃圾' };
                    log = '你只翻到了一些垃圾。';
                }
            } else {
                // 持有金属探测器：搜索有概率获取钛
                const detector = this.bag.find(i => i.name === '金属探测器');
                const roll = Math.random();
                if (detector && roll < 0.3) { item = { type: 'material', name: '钛' }; log = '金属探测器滴滴作响，你挖到了一块钛！'; }
                else if (roll < 0.01) { item = { type: 'medicine', name: '草药' }; log = '你找到了一些草药。'; }
                else if (roll < 0.11) { item = { type: 'material', name: '石头' }; log = '你捡到了一块石头。'; }
                else { item = { type: 'material', name: '垃圾' }; log = '你翻到了一些垃圾。'; }
            }
            this.addBag({ ...item, count: 1 });
            this.pushLog(log);
        },
        // 点击室外设施（狗窝/防御栅栏）：锁定则提示未解锁；防御栅栏带成本解锁，解锁后降低遇敌率
        outdoorClick(item) {
            if (!item.unlocked) {
                if (item.name === '防御栅栏') {
                    // 防御栅栏：确认弹窗解锁（消耗材料）
                    if (!item.unlockCost) return;
                    this.dialog = {
                        show: true, icon: '🛡️',
                        title: '修建防御栅栏',
                        desc: '加固安全屋外围，降低外出遇敌概率。',
                        costMap: item.unlockCost,
                        confirmText: '修建',
                        onConfirm: () => this.buildFence(item)
                    };
                    return;
                }
                this.pushLog(`🔒「${item.name}」尚未解锁。`);
                return;
            }
            if (item.name === '狗窝') {
                this.pushLog('🐕 大黄摇着尾巴欢迎你回来。');
                return;
            }
            if (item.name === '防御栅栏') {
                this.pushLog('🛡️ 防御栅栏已加固，外出时遇敌概率降低了。');
                return;
            }
            this.pushLog(`你查看了「${item.name}」。`);
        },
        // 修建防御栅栏：满足材料则扣减并解锁
        buildFence(item) {
            if (item.unlocked) return;
            if (!this.hasMaterials(item.unlockCost)) return;
            this.spendMaterials(item.unlockCost);
            item.unlocked = true;
            this.pushLog('🛡️ 你加固了防御栅栏，外出时更安全了。');
            this.saveGame();
            this.postSceneState();
        },
        // ============ 战斗系统 ============
        // 移动完成：按生存天数概率遇敌（基础 25%，每 3 天 +1%，封顶 80%）；遇敌进入回合制战斗，胜利后继续原流程
        // 狗窝已解锁（大黄放哨）与防御栅栏已加固时降低遇敌率
        afterTravel(cb) {
            if (!cb) return;
            let pct = Math.min(80, 25 + Math.floor(this.day / 3));
            pct -= this.travelEnemyReduction();
            if (Math.random() * 100 < pct) {
                this.spawnBattle(cb);
            } else {
                cb.call(this);
            }
        },
        // 安全屋减伤：狗窝解锁 -10%，防御栅栏解锁 -10%
        travelEnemyReduction() {
            let red = 0;
            if (this.outdoors && this.outdoors[0] && this.outdoors[0].unlocked) red += 10;   // 狗放哨
            if (this.outdoors && this.outdoors[1] && this.outdoors[1].unlocked) red += 10;   // 防御栅栏
            return red;
        },
        // 人物攻击：力量基础（5 + 力量成长）+ 武器额外；各 ±3 浮动在战斗中结算
        playerAtk() {
            const str = this.stats.strength || 1;
            const wpn = this.equipment.weapon;
            // 耐久为 0 的武器（特例保留在装备栏）无伤害
            const usable = wpn && wpn.durability !== undefined ? wpn.durability > 0 : !!wpn;
            return Math.round((5 + (str - 1) * 1.5) + (usable && wpn.damage ? wpn.damage : 0));
        },
        // 人物暴击率：随力量提升（str ×3%，暴击 2 倍伤害）
        playerCrit() {
            const str = this.stats.strength || 1;
            return str * 3;
        },
        // 遭遇丧尸：生成战斗数据但不立即开战，弹窗询问「战斗 / 逃跑」；多只时逐只战斗
        spawnBattle(cb) {
            const pool = ['weak', 'weak', 'normal', 'normal', 'fat'];
            const z = GameData.zombies[pool[Math.floor(Math.random() * pool.length)]];
            // 越到后面遇到的数量越多：初始 1~3 只随机，每 10 天 +1 只，封顶 10 只
            const n = Math.min(10, this.randInt(1, 3) + Math.floor(this.totalDay / 10));
            // 丧尸强度随总天数增强：每天 +1%，封顶 2 倍；单只 hp/atk ±3 浮动（不再按数量叠加，逐只独立）
            const scale = Math.min(2, 1 + this.totalDay * 0.01);
            const zombies = [];
            let totalExp = 0;
            for (let i = 0; i < n; i++) {
                const hp = Math.max(1, Math.round(z.hp * scale) + this.randInt(-3, 3));
                const atk = Math.max(1, Math.round(z.atk * scale) + this.randInt(-3, 3));
                zombies.push(Object.assign({}, z, { hp: hp, atk: atk, exp: z.exp }));
                totalExp += z.exp;
            }
            const name = (n > 1 ? n + ' 只' : '') + z.name;
            // 人物攻击（±3 浮动）；防具减伤/耐久在战斗结算时实时计算，此处不再预存防御
            const atk = this.playerAtk() + this.randInt(-3, 3);
            const crit = Math.max(0, this.playerCrit() + this.randInt(-3, 3));
            this.battle = {
                zombies: zombies,
                index: 0,
                zombie: zombies[0],
                zombieHp: zombies[0].hp,
                totalExp: totalExp,
                playerHp: Math.min(this.stats.hp, this.hpMax),
                hpMax: this.hpMax,
                playerHealth: this.stats.health,
                logs: [], won: false, over: false, atk, crit,
                playerAttacked: false, inBattle: false,
                strength: this.stats.strength, atkCount: 0, hitCount: 0, count: n
            };
            this.pendingAfterBattle = cb || null;
            this.pushLog(`🧟 遇到了${name}！`);
            this.dialog = {
                show: true, icon: '🧟',
                title: `遇到${name}！`,
                desc: `${name} 向你扑来，是迎战还是逃跑？`,
                cost: '',
                confirmText: '⚔️ 战斗',
                cancelText: '🏃 逃跑',
                onConfirm: () => this.startBattleFight(),
                onCancel: () => this.fleeBattle()
            };
            this.postSceneState();
        },
        // 确认战斗：进入战斗页并启动逐回合定时器
        startBattleFight() {
            const b = this.battle;
            if (!b || b.over) return;
            b.inBattle = true;
            this.currentPage = 'battle';
            this.startBattleTurns();
            this.postSceneState();
        },
        // 启动逐回合定时器（每 1500ms 一步：玩家攻击与丧尸反击交替输出，一来一回有间隔）
        startBattleTurns() {
            this.battleTimer = setInterval(() => this.battleTurn(), 1500);
        },
        // 一回合拆两步（交替输出）：玩家攻击（±5浮动）→ 间隔 → 丧尸反击（±5浮动）→ 概率受伤
        // 战斗期间时间不流动
        battleTurn() {
            const b = this.battle;
            if (!b || b.over) { if (this.battleTimer) clearInterval(this.battleTimer); return; }
            if (!b.playerAttacked) {
                // 步骤一：玩家攻击当前这只（±3 浮动，命中暴击则 2 倍伤害）
                b.playerAttacked = true;
                const myAtk = Math.max(1, b.atk + this.randInt(-3, 3));
                const crit = this.randInt(1, 100) <= b.crit;
                const dealt = Math.max(1, crit ? myAtk * 2 : myAtk);   // 丧尸无防御，全额伤害
                b.zombieHp = Math.max(0, b.zombieHp - dealt);
                b.atkCount++;
                b.logs.push(`你攻击${b.zombie.name}，造成 ${dealt} 点伤害${crit ? '（暴击！）' : ''}（剩余 ${b.zombieHp}）。`);
                // 武器每次攻击 30% 概率损耗 1 耐久
                if (this.equipment.weapon && this.equipment.weapon.durability && Math.random() < 0.3) {
                    this.wearEquipment(this.equipment.weapon, 1, 'weapon', '武器');
                }
                // 打死当前只：还有下一只则切换，否则战斗胜利
                if (b.zombieHp <= 0) {
                    b.logs.push(`你击败了${b.zombie.name}！`);
                    b.index++;
                    if (b.index < b.zombies.length) {
                        b.zombie = b.zombies[b.index];
                        b.zombieHp = b.zombie.hp;
                        b.logs.push(`第 ${b.index + 1} 只${b.zombie.name}扑了过来……`);
                    } else {
                        this.endBattle(true);
                        return;
                    }
                }
            } else {
                // 步骤二：丧尸反击（±3 浮动；防具减伤不叠加、伤害抵扣耐久；丧尸无暴击）
                b.playerAttacked = false;
                const zAtk = Math.max(1, b.zombie.atk + this.randInt(-3, 3));
                const dmg = this.applyArmorDmg(zAtk);
                b.playerHp = Math.max(0, b.playerHp - dmg);
                b.hitCount++;
                b.logs.push(`${b.zombie.name}攻击你，造成 ${dmg} 点伤害（剩余 ${b.playerHp}）。`);
                this.rollBattleInjury(b);
                if (b.playerHp <= 0) { this.endBattle(false); return; }
            }
            this.postSceneState();
        },
        // 防具减伤：取帽子/防甲中最高的减伤率（不叠加），伤害 = 原始×(1-减伤)；防具耐久按伤害抵扣，耗尽损坏
        applyArmorDmg(zAtk) {
            const hat = this.equipment.hat;
            const armor = this.equipment.armor;
            const pieces = [hat, armor].filter(Boolean);
            let red = 0;
            for (const p of pieces) red = Math.max(red, p.damageReduction || 0);
            const dmg = Math.max(1, Math.round(zAtk * (1 - red / 100)));
            // 耐久分摊抵扣：按实际伤害各扣
            for (const p of pieces) {
                if (p.durability) {
                    p.durability -= dmg;
                    if (p.durability <= 0) {
                        const slot = p === this.equipment.hat ? 'hat' : 'armor';
                        this.equipment[slot] = null;
                        this.pushLog(`你的${p.name}损坏了。`);
                    }
                }
            }
            return dmg;
        },
        // 概率受伤（10%）：健康度 -1~3（健康值独立，不再影响血量上限）
        rollBattleInjury(b) {
            if (Math.random() >= 0.1) return;
            const dmg = this.randInt(1, 3);
            b.playerHealth = Math.max(0, b.playerHealth - dmg);
            const curMax = this.hpMax;
            b.hpMax = curMax;
            if (b.playerHp > curMax) b.playerHp = curMax;
            b.logs.push(`你受伤了，健康度 -${dmg}（血量上限 ${curMax}）。`);
        },
        // 逃跑：成功率 60%；失败不进入战斗，只被丧尸抓伤少量扣血，仍成功脱离
        fleeBattle() {
            const b = this.battle;
            if (!b || b.over) return;
            const chance = 0.6;
            let dmg = 0;
            if (Math.random() >= chance) {
                // 逃跑失败：被丧尸半力一击抓伤，少量扣血（最少 1，至少保留 1 血）
                const zAtk = Math.max(1, b.zombie.atk + this.randInt(-3, 3));
                dmg = this.applyArmorDmg(Math.round(zAtk * 0.5));
                b.playerHp = Math.max(1, b.playerHp - dmg);
            }
            if (this.battleTimer) { clearInterval(this.battleTimer); this.battleTimer = null; }
            this.stats.health = b.playerHealth;
            this.stats.hp = Math.min(b.playerHp, this.hpMax);
            if (dmg > 0) this.pushLog(`逃跑时被${b.zombie.name}抓伤，损失 ${dmg} 点血量。`);
            else this.pushLog('🏃 你成功逃跑了！');
            // 无论成败都脱离战斗，并继续原流程（移动遇敌则继续前往目的地）
            this.battle = null;
            this.pendingLoot = null;   // 逃跑后未结算的房间物资丢弃
            this.currentPage = null;
            this.dialog.show = false;
            const cb = this.pendingAfterBattle;
            this.pendingAfterBattle = null;
            this.postSceneState();
            if (cb) cb.call(this);
        },
        // 战斗结束：结算血量/耐久/经验
        endBattle(won) {
            const b = this.battle;
            if (!b) return;
            if (this.battleTimer) { clearInterval(this.battleTimer); this.battleTimer = null; }
            this.stats.health = b.playerHealth;
            this.stats.hp = Math.min(b.playerHp, this.hpMax);
            b.won = won;
            b.over = true;
            // 武器耐久在攻击时扣、防具耐久在受击时按伤害抵扣，此处无需再结算
            if (won) {
                this.pushLog(`战斗胜利！获得 ${b.totalExp} 点战斗经验。`);
                this.gainCombatExp(b.totalExp);
                this.zombieDrop(b.count || 1);
            } else {
                this.pushLog(`你被${b.zombie.name}击败了，倒在了路上……`);
            }
            this.postSceneState();
        },
        // 装备耐久消耗：耐久归零损坏并卸下
        wearEquipment(item, times, slot, label) {
            if (!item || !item.durability || times <= 0) return;
            item.durability -= times;
            if (item.durability <= 0) {
                // 消防斧/武士刀/汽油喷灯为特例：耐久耗尽保留在装备栏（属性功能消失）
                if (item.name === '消防斧' || item.name === '武士刀' || item.name === '汽油喷灯') {
                    this.pushLog(`你的${label}「${item.name}」耐久耗尽，已无法正常使用。`);
                } else {
                    this.equipment[slot] = null;
                    this.pushLog(`你的${label}「${item.name}」损坏了。`);
                }
            }
        },
        // 战斗胜利结算经验，提升力量（满级 10；升到 L+1 需 L×50 经验）
        gainCombatExp(exp) {
            this.stats.exp = (this.stats.exp || 0) + exp;
            while (this.stats.strength < 10 && this.stats.exp >= this.stats.strength * 50) {
                this.stats.exp -= this.stats.strength * 50;
                this.stats.strength++;
                this.pushLog(`💪 力量提升到 ${this.stats.strength} 级！`);
            }
        },
        // 丧尸掉落：按丧尸数量上限随机掉基础物资（同类叠加）；搜刮遇敌时进战利品区，移动遇敌时直接入包
        zombieDrop(count) {
            const pool = ['布料', '垃圾', '石头', '原木', '金属废料', '沙子', '绳子'];
            const n = this.randInt(1, Math.max(1, count));
            const map = {};
            for (let i = 0; i < n; i++) {
                const name = pool[Math.floor(Math.random() * pool.length)];
                map[name] = (map[name] || 0) + 1;
            }
            const desc = [];
            for (const name in map) {
                // 搜刮遇敌：掉落物加入战利品区；移动遇敌：直接入背包
                if (this.pendingLoot) {
                    const found = this.pendingLoot.items.find(x => x.name === name);
                    if (found) found.count += map[name];
                    else this.pendingLoot.items.push({ name: name, type: 'material', count: map[name] });
                } else {
                    this.addBag({ type: 'material', name: name, count: map[name] });
                }
                desc.push(`${name}×${map[name]}`);
            }
            if (desc.length) this.pushLog(`丧尸掉落：${desc.join('、')}。`);
        },
        // 战斗胜利后：清战斗状态；有回调继续原流程，否则留在当前场景
        finishBattle() {
            if (!this.battle || !this.battle.won) return;
            const cb = this.pendingAfterBattle;
            this.battle = null;
            this.pendingAfterBattle = null;
            this.currentPage = null;
            if (cb) cb.call(this);
            else this.postSceneState();
        },
        // 玩家死亡：清除存档并重开新档
        resetGame() {
            try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 本地存储不可用时忽略 */ }
            location.reload();
        }
    }
};
