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
        },
        // 向当前激活的场景 iframe 发送消息
        postScene(msg) {
            const frame = this.$refs['frame' + this.activeFrame];
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage(msg, '*');
            }
        },
        // 向场景 iframe 推送当前状态（渲染与刷新用；字段均被对应场景页消费）
        postSceneState() {
            this.postScene({
                type: 'init',
                state: {
                    currentPlace: this.currentPlace,
                    playerLocation: this.playerLocation,
                    furniture: this.furniture,
                    outdoors: this.outdoors,
                    bag: this.bag,
                    bagMax: this.bagMax,
                    currentBed: this.currentBed,
                    currentStorage: this.currentStorage,
                    currentFurniture: this.currentFurniture,
                    currentWorkbench: this.currentWorkbench,
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
                case 'sleep-start':
                    this.startSleep(msg.mode);
                    break;
                case 'sleep-anim-end':
                    this.finishSleep();
                    break;
                case 'upgrade-storage':
                    this.upgradeStorage();
                    break;
                case 'craft': {
                    const bp = this.currentWorkbench && this.currentWorkbench.blueprints
                        && this.currentWorkbench.blueprints[msg.cat] && this.currentWorkbench.blueprints[msg.cat][msg.index];
                    if (bp) this.craft(bp);
                    break;
                }
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
        // 地图 iframe 移动动画结束
        onTravelDone() {
            if (this.travelRAF) { cancelAnimationFrame(this.travelRAF); this.travelRAF = null; }
            const cb = this.pendingTravelCb;
            this.pendingTravelCb = null;
            this.moving = false;
            if (cb) cb();
        },
        // 子页「关闭」：回到场景页（若正在睡觉，先取消动画）
        closePage() {
            if (this.sleepRAF) { cancelAnimationFrame(this.sleepRAF); this.sleepRAF = null; }
            this.sleeping = null;
            this.currentPage = null;
        }
    }
};
