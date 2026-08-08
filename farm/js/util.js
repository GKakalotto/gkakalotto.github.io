/* ================= 纯工具函数(无 Vue 依赖) ================= */
/* 升级经验:三次曲线,越往后每级所需经验越多 */
function xpNeeded(level) { return Math.floor(level * level * level / 8 + level * 100); }

function fmtDur(s) {
    if (s >= 60) {
        const m = Math.floor(s / 60), r = s % 60;
        return m + '分' + (r > 0 ? r + '秒' : '');
    }
    return s + '秒';
}
function fmtRemain(s) { return fmtDur(s) + '后成熟'; }
function fmtTime(t) {
    const d = new Date(t);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
}
/* 定位标签查找表(CROPS 与 FISH 共用同一套三定位循环,key 不重叠) */
const KIND_LABEL = {}, KIND_CLS = {};
CROP_KEYS.forEach((k, i) => { KIND_LABEL[k] = CROP_KIND[i % 3].label; KIND_CLS[k] = CROP_KIND[i % 3].cls; });
FISH_KEYS.forEach((k, i) => { KIND_LABEL[k] = CROP_KIND[i % 3].label; KIND_CLS[k] = CROP_KIND[i % 3].cls; });

/* ================= 默认状态 ================= */
function makeDefaultState() {
    return {
        coins: 100,
        level: 1,
        xp: 0,
        plots: Array.from({ length: TOTAL_PLOTS }, () => null),
        unlockedPlots: Array.from({ length: TOTAL_PLOTS }, (_, i) => i < INITIAL_UNLOCKED),
        pond: Array.from({ length: TOTAL_PONDS }, () => null), // 鱼塘 2×5 共 10 格
        pondUnlocked: false,             // 鱼塘默认锁定,10级+5000金币整体解锁
        unlockedPonds: Array.from({ length: TOTAL_PONDS }, () => false), // 各鱼塘格是否开放(区域解锁后前 N 格自动开放,其余花金币扩张)
        inventory: { seeds: { luobo: 3 }, items: {}, locks: {} },
        fish: { fries: {} },             // 鱼苗库存(成鱼收获后进 inventory.items)
        hireUntil: 0,                    // 雇佣农工的到期时间戳,0 = 未雇佣
        log: [{ t: Date.now(), msg: '欢迎来到 星露谷农场!点空地种菜,生长中可能随机缺水需浇水;达到等级后解锁更多土地。' }],
    };
}
