/* ================= 纯工具函数(无 Vue 依赖) ================= */
/* 升级经验:exp = 100 × level^1.5,越往后每级所需经验越多 */
function xpNeeded(level) { return Math.floor(100 * Math.pow(level, 1.5)); }

/* 收获经验:作物/鱼 1-2 级 = 自身 5 倍,3 级起 = 自身 +10;动物只用 +10 方案(调用方直接传 xp+10) */
function harvestXp(xp, level) { return level < 3 ? xp * 5 : xp + 10; }

/* 时长统一格式 hh:mm:ss,小时/分钟/秒均两位补零 */
function fmtDur(s) {
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return pad(h) + ':' + pad(m) + ':' + pad(r);
}
/* 商店详情成熟时长:x小时x分钟(不足 1 小时显示 x分钟) */
function fmtDurHM(s) {
    if (s < 60) return s + '秒';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return h + '小时' + (m > 0 ? m + '分钟' : '');
    return m + '分钟';
}
function fmtRemain(s) { return fmtDur(s) + ' 后成熟'; }
function fmtTime(t) {
    const d = new Date(t);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
}

/* ================= 跨页面共享存储(金币 + 仓库 + 锁定 + 主题) =================
   农场页与牧场页是两个独立页面,彼此无法直接共享 Vue 状态;
   通过 localStorage 中的共享段传递两页需要互通的数据:
     coins(金币) / items(仓库/收获物) / locks(仓库物品锁定状态) / theme(主题)。
   牧草(siliao)只是 items 里的一项,不再单独搬运。
   两页各自 localStorage 段只存自己的等级/经验/生产进度/种子背包,互不读对方的。 */
const SHARED_KEY = 'qqfarm_shared_v1';
function readShared() {
    try {
        const o = JSON.parse(localStorage.getItem(SHARED_KEY));
        if (o && typeof o === 'object') {
            const items = (o.items && typeof o.items === 'object') ? o.items : {};
            const locks = (o.locks && typeof o.locks === 'object') ? o.locks : {};
            return {
                coins: typeof o.coins === 'number' ? o.coins : 0,
                items: Object.assign({}, items),
                locks: Object.assign({}, locks),
                theme: o.theme === 'light' ? 'light' : 'dark',
            };
        }
    } catch (e) { /* 忽略损坏的存档 */ }
    return { coins: 100, items: {}, locks: {}, theme: 'dark' };
}
function writeShared(coins, items, locks, theme) {
    try {
        localStorage.setItem(SHARED_KEY, JSON.stringify({
            coins: coins || 0,
            items: items || {},
            locks: locks || {},
            theme: theme === 'light' ? 'light' : 'dark',
        }));
    } catch (e) { /* 无持久化时游戏仍可运行 */ }
}

/* 牧草(siliao)是两页共享资源,其显示名/售价在所有页面应一致。
   农场页不加载 ANIMAL_PRODUCTS,若不在共享层定义会回退成原始 key 'siliao',故在此集中定义。 */
const SILIAO = { name: '牧草', sell: 2 };
