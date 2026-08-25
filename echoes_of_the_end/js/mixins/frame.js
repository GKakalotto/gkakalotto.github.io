// ============ Mixin：场景 iframe 通信（双帧预加载 / 状态推送 / 消息分发 / 移动动画协调） ============
const FrameMixin = {
    data() {
        return {
            // 双 iframe：activeFrame 为当前显示帧，另一帧在后台预加载下一场景，就绪后交叉切换避免闪烁
            frameSrc0: 'scenes/safehouse.html',
            frameSrc1: 'scenes/safehouse.html',
            activeFrame: 0,
            pendingFrame: -1   // -1 表示无待切换目标
        };
    },
    computed: {
        // 目标场景地址（供 watch 预加载；子页/场景页对应文件）
        sceneSrc() {
            if (this.currentPage) return `scenes/${this.currentPage}.html`;
            return this.currentScene === 'map' ? 'scenes/map.html'
                 : this.currentScene === 'place' ? 'scenes/place.html'
                 : 'scenes/safehouse.html';
        }
    },
    watch: {
        // 目标场景变化：后台帧若已是目标页面（曾加载过）则直接切换并推送状态，
        // 否则先预加载，当前帧在预加载期间继续显示旧场景，就绪后再切换
        sceneSrc(v) {
            const next = 1 - this.activeFrame;
            const cur = next === 0 ? this.frameSrc0 : this.frameSrc1;
            if (cur === v) {
                this.pendingFrame = -1;
                this.activeFrame = next;
                this.postSceneState();
            } else {
                this.pendingFrame = next;
                if (next === 0) this.frameSrc0 = v;
                else this.frameSrc1 = v;
            }
        },
        // 打开背包页时：通知背包页重置滚动到顶部（转移/使用刷新时 currentPage 不变，不触发）
        currentPage(v) {
            if (v) {
                this.$nextTick(() => {
                    const frame = this.$refs['frame' + this.activeFrame];
                    if (frame && frame.contentWindow) {
                        frame.contentWindow.postMessage({ type: 'scroll-reset' }, '*');
                    }
                });
            }
        }
    },
    methods: {
        // 场景帧加载完成：后台帧就绪则切换显示并推送状态；激活帧加载完成仅推送状态
        onFrameLoad(i) {
            if (i === this.pendingFrame) {
                this.pendingFrame = -1;
                this.activeFrame = i;
                this.postSceneState();
            } else if (i === this.activeFrame) {
                this.postSceneState();
            }
            // 子页加载完成：通知其滚动回顶（转移/使用刷新时无加载，不触发）
            if (this.currentPage) {
                const frame = this.$refs['frame' + this.activeFrame];
                if (frame && frame.contentWindow) {
                    frame.contentWindow.postMessage({ type: 'scroll-reset' }, '*');
                }
            }
        },
        // 向当前激活的场景 iframe 发送消息
        postScene(msg) {
            const frame = this.$refs['frame' + this.activeFrame];
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage(msg, '*');
            }
        },
        // 清理所有容器中耐久为 0 的物品（工具/武器/防具直接消失）；
        // 消防斧/武士刀/汽油喷灯为特例：装备栏中保留（耐久 0 时属性功能消失），其余容器仍清理
        cleanupBroken() {
            const keep = { '消防斧': 1, '武士刀': 1, '汽油喷灯': 1 };
            const isBroken = (it) => it && it.durability !== undefined && it.durability <= 0;
            const clean = (arr) => { if (!arr) return; for (let i = arr.length - 1; i >= 0; i--) { if (isBroken(arr[i])) { this.pushLog(`「${arr[i].name}」耐久耗尽，损坏消失了。`); arr.splice(i, 1); } } };
            clean(this.bag);
            clean(this.storageItems);
            for (const k in this.placeStash) clean(this.placeStash[k]);
            for (const slot in this.equipment) {
                const it = this.equipment[slot];
                if (!it) continue;
                if (isBroken(it)) {
                    if (keep[it.name]) continue;   // 特例保留在装备栏（功能消失）
                    this.pushLog(`「${it.name}」耐久耗尽，损坏消失了。`);
                    this.equipment[slot] = null;
                }
            }
        },
        // 向场景 iframe 推送当前状态（渲染与刷新用；字段均被对应场景页消费）
        postSceneState() {
            this.cleanupBroken();
            this.postScene({
                type: 'init',
                state: {
                    currentScene: this.currentScene,
                    currentPlace: this.currentPlace,
                    playerLocation: this.playerLocation,
                    furniture: this.furniture,
                    outdoors: this.outdoors,
                    bag: this.bag,
                    bagMax: this.bagMax,
                    bagLevel: this.bagLevel,
                    storageItems: this.storageItems,
                    cellResources: this.cellResources,
                    locationResources: this.locationResources,
                    placeStash: this.placeStash,
                    pendingLoot: this.pendingLoot,
                    equipment: this.equipment,
                    currentBed: this.currentBed,
                    currentFurniture: this.currentFurniture,
                    currentWorkbench: this.currentWorkbench,
                    currentFire: this.currentFire,
                    currentStove: this.currentStove,
                    currentRain: this.currentRain,
                    currentJuicer: this.currentJuicer,
                    currentFurnace: this.currentFurnace,
                    furnaceFuel: this.furnaceFuel,
                    furnaceJobs: this.furnaceJobs,
                    currentPlantation: this.currentPlantation,
                    plantationJobs: this.plantationJobs,
                    activity: this.activity,
                    searching: this.searching,
                    battle: this.battle,
                    fireFuelUntil: this.fireFuelUntil,
                    stoveFuelUntil: this.stoveFuelUntil,
                    gameSeconds: this.gameSeconds,
                    sleeping: this.sleeping
                }
            });
        },
        // 接收场景 iframe 的交互消息：点击家具/地图格等统一在此分发
        onSceneMessage(e) {
            const frame = this.$refs['frame' + this.activeFrame];
            if (!frame || e.source !== frame.contentWindow) return;
            const msg = e.data;
            if (!msg || !msg.type) return;
            switch (msg.type) {
                case 'open-furniture':
                    this.openFurnitureByIndex(msg.index);
                    break;
                case 'open-door':
                    this.openDoorConfirm();
                    break;
                case 'outdoor-click':
                    if (this.outdoors[msg.index]) this.outdoorClick(this.outdoors[msg.index]);
                    break;
                case 'open-location': {
                    const loc = this.locations.find(l => l.name === msg.name);
                    if (loc) this.openLocationConfirm(loc);
                    break;
                }
                case 'open-cell':
                    this.openCellConfirm(msg.key, msg.base);
                    break;
                case 'open-home':
                    this.openHomeConfirm();
                    break;
                case 'back-to-map':
                    this.backToMap();
                    break;
                // 资源点（公园/森林）：砍树 / 挖黏土（耗时）/ 开始搜索 / 停止搜索
                case 'chop-tree':
                    this.startChop();
                    break;
                case 'dig-clay':
                    this.startDig();
                    break;
                case 'search-start':
                    this.startSearch();
                    break;
                case 'search-stop':
                    this.stopSearch();
                    break;
                // 地点搜刮
                case 'loc-search':
                    this.startLocationSearch();
                    break;
                // 暂存区取出 / 战利品取回（点击直接取回背包）
                case 'stash-take':
                    this.stashTake(msg.index);
                    break;
                case 'loot-take':
                    this.takeLoot(msg.index);
                    break;
                // 地点特殊玩法：打猎 / 取水 / 钓鱼 / 领养狗
                case 'hunt':
                    this.startHunt();
                    break;
                case 'forage':
                    this.startForage();
                    break;
                case 'draw-water':
                    this.startDrawWater();
                    break;
                case 'fish':
                    this.startFish();
                    break;
                case 'adopt-dog':
                    this.adoptDog();
                    break;
                // 加油站取汽油 / 停车场/驾校拆除汽车
                case 'pump-gas':
                    this.startPumpGas();
                    break;
                case 'dismantle-car':
                    this.startDismantle();
                    break;
                // 资源动作进度条动画结束：结算产出
                case 'action-anim-end':
                    this.finishActivity();
                    break;
                // 战斗：逃跑 / 胜利继续 / 死亡重开
                case 'battle-flee':
                    this.fleeBattle();
                    break;
                case 'battle-continue':
                    this.finishBattle();
                    break;
                case 'reset-game':
                    this.resetGame();
                    break;
                case 'travel-done':
                    this.onTravelDone();
                    break;
                // 子页交互（背包/床/仓库/工作台/家具详情）
                case 'close-page':
                    this.closePage();
                    break;
                case 'upgrade-bed':
                    this.upgradeBed();
                    break;
                case 'upgrade-bag':
                    this.upgradeBag();
                    break;
                case 'sleep-start':
                    this.startSleep(msg.mode);
                    break;
                case 'sleep-anim-end':
                    this.finishSleep();
                    break;
                case 'add-fuel':
                    this.addFuel(msg.count);
                    break;
                case 'add-stove-fuel':
                    this.addStoveFuel(msg.count);
                    break;
                case 'upgrade-fire':
                    this.upgradeFire();
                    break;
                // 背包物品操作
                case 'bag-move-storage':
                    this.moveToStorage(msg.index);
                    break;
                case 'bag-stash':
                    this.moveToStash(msg.index);
                    break;
                case 'bag-to-loot':
                    this.moveToLoot(msg.index);
                    break;
                case 'bag-discard':
                    this.discard('bag', msg.index);
                    break;
                case 'bag-use':
                    this.useItem('bag', msg.index);
                    break;
                case 'bag-equip':
                    this.equipItem(msg.index, msg.slot);
                    break;
                case 'unequip-slot':
                    this.unequipSlot(msg.slot);
                    break;
                case 'sort-bag':
                    this.sortBag();
                    break;
                case 'sort-storage':
                    this.sortStorage();
                    break;
                // 仓库物品操作
                case 'storage-move-bag':
                    this.moveToBag(msg.index);
                    break;
                case 'storage-discard':
                    this.discard('storage', msg.index);
                    break;
                case 'storage-use':
                    this.useItem('storage', msg.index);
                    break;
                case 'craft': {
                    const bp = this.currentWorkbench && this.currentWorkbench.blueprints
                        && this.currentWorkbench.blueprints[msg.cat] && this.currentWorkbench.blueprints[msg.cat][msg.index];
                    if (bp) this.craft(bp);
                    break;
                }
                // 灶台：按菜单制作（耗时进度）
                case 'stove-cook':
                    this.startCooking('stove', msg.name);
                    break;
                // 篝火：烹饪（烤肉/烧水等）与锅槽
                case 'fire-cook':
                    this.startFireCook(msg.name);
                    break;
                case 'fire-pot':
                    this.toggleFirePot();
                    break;
                // 榨汁机：按菜单制作（耗时进度）
                case 'juice-make':
                    this.startCooking('juicer', msg.name);
                    break;
                // 雨水收集器：升级 / 装瓶（雨水仅下雨时自动收集）
                case 'upgrade-rain':
                    this.upgradeRain();
                    break;
                case 'rain-bottle':
                    this.bottleRain();
                    break;
                // 熔炉：加燃料 / 开始加工
                case 'add-furnace-fuel':
                    this.addFurnaceFuel(msg.count);
                    break;
                case 'furnace-craft':
                    this.startFurnaceJob(msg.name);
                    break;
                // 种植园：种植 / 收获 / 升级
                case 'plant-crop':
                    this.plantCrop(msg.name);
                    break;
                case 'harvest-crop':
                    this.harvestCrop(msg.index);
                    break;
                case 'upgrade-plantation':
                    this.upgradePlantation();
                    break;
                // 家具详情页发起的解锁
                case 'unlock-furniture':
                    this.unlockFurniture();
                    break;
            }
        },
        // 开始移动：外壳负责推进游戏时间，iframe 负责红点动画；完成后回调
        startTravel(from, to, seconds, cb) {
            this.moving = true;
            this.pendingTravelCb = cb;
            const path = this.buildRoute(from.gx, from.gy, to.gx, to.gy);
            // 地图动画总时长 = path.length * 250ms（steps 格 * 250ms + 末尾 250ms 收尾）
            const totalMs = path.length * 250;
            const speed = seconds / totalMs;   // 游戏秒 / 毫秒
            let last = performance.now();
            const step = (now) => {
                const dt = now - last;
                last = now;
                this.advanceGameTime(speed * dt);
                if (this.moving) this.travelRAF = requestAnimationFrame(step);
            };
            this.travelRAF = requestAnimationFrame(step);
            this.postScene({ type: 'travel', path: path, seconds: seconds });
        },
        // 地图 iframe 移动动画结束：判定遇敌（进入战斗）或继续原流程
        onTravelDone() {
            if (this.travelRAF) { cancelAnimationFrame(this.travelRAF); this.travelRAF = null; }
            const cb = this.pendingTravelCb;
            this.pendingTravelCb = null;
            this.moving = false;
            this.afterTravel(cb);
        },
        // 子页「关闭」：回到场景页（若正在睡觉，先取消动画）
        closePage() {
            if (this.sleepRAF) { cancelAnimationFrame(this.sleepRAF); this.sleepRAF = null; }
            this.sleeping = null;
            if (this.actionRAF) { cancelAnimationFrame(this.actionRAF); this.actionRAF = null; }
            this.activity = null;
            this.searching = false;
            this.searchAccum = 0;
            if (this.battleTimer) { clearInterval(this.battleTimer); this.battleTimer = null; }
            this.battle = null;
            this.pendingAfterBattle = null;
            // 关闭背包：未取回的战利品落入当前地点暂存区
            if (this.pendingLoot && this.pendingLoot.items && this.pendingLoot.items.length) {
                let n = 0;
                for (const it of this.pendingLoot.items) { this.stashAdd(this.pendingLoot.placeKey, it); n += it.count || 1; }
                this.pushLog(`${n} 件战利品放进了该地点暂存区，可随时回来取。`);
                this.saveGame();
            }
            this.pendingLoot = null;
            this.currentPage = null;
        },
        // 解锁当前家具详情页所指的家具（消耗材料后置 unlocked），保存并直接打开对应功能页
        unlockFurniture() {
            const f = this.currentFurniture;
            if (!f || f.unlocked) return;
            if (!this.hasMaterials(f.unlockCost)) {
                this.pushLog(`材料不足，无法解锁「${f.name}」。`);
                return;
            }
            this.spendMaterials(f.unlockCost);
            f.unlocked = true;
            this.pushLog(`🔓 已解锁「${f.name}」。`);
            this.saveGame();
            // 有功能页的家具解锁后直接进对应子页
            if (f.isStove) this.openStove(f);
            else if (f.isRainCollector) this.openRain(f);
            else if (f.isJuicer) this.openJuicer(f);
            else if (f.isFurnace) this.openFurnace(f);
            else if (f.isPlantation) this.openPlantation(f);
            else this.postSceneState();
        }
    }
};
