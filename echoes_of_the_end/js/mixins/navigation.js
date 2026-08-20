// ============ Mixin：地图数学与路径（格子↔km、耗时、BFS 寻路） ============
// 依赖 constants.js（MINUTE_SECONDS / HOUR_SECONDS / MAP_COLS / MAP_ROWS），须在其后加载
const NavigationMixin = {
    methods: {
        // 格子坐标 → km 坐标（地图中心 8,9 ≈ 安全屋 0,3，每格 1.0km；耗时按地图相对位置计算）
        gridToKm(gx, gy) {
            return {
                x: (gx - 8) * 1.0,
                y: (gy - 9) * 1.0 + 3
            };
        },
        // 两点 km 坐标之间的步行耗时（确定性，两地之间耗时固定；每格 1.0km 已适当延长）
        // 体力低于当前上限 50% 时移动变慢：低于 20% 更慢
        travelSeconds(from, to) {
            const dist = Math.hypot(to.x - from.x, to.y - from.y);
            let seconds = Math.max(HOUR_SECONDS / 60, Math.round((dist / MapData.walkSpeed) * HOUR_SECONDS));
            const ph = this.stats ? this.stats.physical : 0;
            const half = this.physicalMax ? this.physicalMax * 0.5 : 50;
            if (ph < half) {
                seconds = Math.round(seconds * (ph < half * 0.4 ? 2 : 1.5));
            }
            return seconds;
        },
        // 当前所在地 km 坐标（地点/公园/树格均由格子位置换算）
        getLocationCoord() {
            if (this.playerLocation === 'safehouse') return MapData.safehouseCoord;
            const pos = this.getPlayerGrid();
            return this.gridToKm(pos.gx, pos.gy);
        },
        // 时长显示：X 小时 Y 分 / Y 分钟
        formatDuration(seconds) {
            const h = Math.floor(seconds / HOUR_SECONDS);
            const m = Math.round((seconds % HOUR_SECONDS) / MINUTE_SECONDS);
            if (h === 0) return `${m}分钟`;
            return m === 0 ? `${h}小时` : `${h}小时${m}分`;
        },
        // 画布坐标 → 格子坐标（lx/ly 百分比 → 0 基列 / 行索引）
        gridPosOf(node) {
            return {
                gx: Math.round(node.lx / 100 * (MAP_COLS - 1)),
                gy: Math.round(node.ly / 100 * (MAP_ROWS - 1))
            };
        },
        // 玩家当前所在格子坐标（0 基；地点名 / park: / tree: / 安全屋）
        getPlayerGrid() {
            if (this.playerLocation === 'safehouse') return MapData.safehouseGridPos;
            const m = this.playerLocation.match(/^(park|tree):(\d+),(\d+)$/);
            if (m) return { gx: +m[2], gy: +m[3] };
            const loc = this.locations.find(l => l.name === this.playerLocation);
            return loc ? this.gridPosOf(loc) : MapData.safehouseGridPos;
        },
        // 生成移动路径：在道路格（及边缘树格）上 BFS 求最短，不穿过建筑/公园；首尾为起点/终点
        buildRoute(x1, y1, x2, y2) {
            const isTarget = (x, y) => x === x2 && y === y2;
            // 可走格：内部道路（奇数列或奇数行）或最外圈树（用于前往边缘森林）
            const isWalkable = (x, y) => {
                if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
                if (x === 0 || x === MAP_COLS - 1 || y === 0 || y === MAP_ROWS - 1) return true;
                return x % 2 === 1 || y % 2 === 1;
            };
            // BFS 求最短路径
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const parent = {};
            const startKey = `${x1},${y1}`;
            parent[startKey] = null;
            const queue = [[x1, y1]];
            let head = 0;
            let found = false;
            while (head < queue.length && !found) {
                const [x, y] = queue[head++];
                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const key = `${nx},${ny}`;
                    if (key in parent) continue;
                    if (!isTarget(nx, ny) && !isWalkable(nx, ny)) continue;
                    parent[key] = `${x},${y}`;
                    if (isTarget(nx, ny)) {
                        found = true;
                        break;
                    }
                    queue.push([nx, ny]);
                }
            }
            // 回溯路径
            const path = [];
            let cur = `${x2},${y2}`;
            while (cur) {
                const [x, y] = cur.split(',').map(Number);
                path.unshift([x, y]);
                cur = parent[cur];
            }
            return path;
        },
        // 返回安全屋耗时（按当前所在地 km 距离）
        secondsToHome() {
            return this.travelSeconds(this.getLocationCoord(), MapData.safehouseCoord);
        }
    }
};
