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
            this.dialog.show = false;
        },
        confirmAction() {
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
        },
        // 地图 → 返回安全屋
        backToSafehouse() {
            this.currentScene = 'safehouse';
            this.playerLocation = 'safehouse';
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
        // 进入地点：切换为占位场景
        enterLocation(loc) {
            this.currentPlace = { name: loc.name, icon: loc.icon };
            this.currentScene = 'place';
            this.pushLog(`你进入了${loc.name}。`);
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
            this.dialog = {
                show: true,
                icon: base === 'park' ? '🌳' : '🌲',
                title: base === 'park' ? '公园绿地' : '森林',
                desc: base === 'park' ? '一片安静的公园绿地，可以放松片刻。' : '地图边缘的树林，草木茂密。',
                cost: atCurrent ? '' : `步行约 ${this.formatDuration(this.pendingSeconds)}`,
                action: atCurrent ? 'enter-cell' : 'cell'
            };
        },
        // 前往公园/树格：到达后询问是否进入
        travelToCell(cell) {
            const seconds = this.pendingSeconds;
            const from = this.getPlayerGrid();
            this.startTravel(from, { gx: cell.gx, gy: cell.gy }, seconds, () => {
                this.playerLocation = (cell.base === 'park' ? 'park:' : 'tree:') + cell.key;
                this.pushLog(`你来到了${cell.base === 'park' ? '一片公园绿地' : '地图边缘的树林'}。`);
                this.postSceneState();
                this.dialog = {
                    show: true,
                    icon: cell.base === 'park' ? '🌳' : '🌲',
                    title: cell.base === 'park' ? '公园绿地' : '森林',
                    desc: cell.base === 'park' ? '一片安静的公园绿地，可以放松片刻。' : '地图边缘的树林，草木茂密。',
                    cost: '',
                    action: 'enter-cell'
                };
            });
        },
        // 进入公园/树格：切换为占位场景
        enterCell(cell) {
            const isPark = cell.base === 'park';
            this.currentPlace = {
                name: isPark ? '公园绿地' : '森林',
                icon: isPark ? '🌳' : '🌲'
            };
            this.currentScene = 'place';
            this.pushLog(`你进入了${isPark ? '一片公园绿地' : '地图边缘的树林'}。`);
        },
        // 点击室外设施（狗窝/防御栅栏）：锁定则提示未解锁
        outdoorClick(item) {
            if (!item.unlocked) {
                this.pushLog(`🔒「${item.name}」尚未解锁。`);
                return;
            }
            this.pushLog(`你查看了「${item.name}」。`);
        }
    }
};
