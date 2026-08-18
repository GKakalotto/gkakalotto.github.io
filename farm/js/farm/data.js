/* ================= 农场(作物)静态数据 =================
   本文件只放农场页数据,不含逻辑。鱼塘/牧栏数据在 js/ranch/data.js。 */

const CROPS = {
   caozi:        { name: '草籽', cost: 1    , sell: 2     , grow: 60    , xp: 1   , level: 1, product: 'siliao', },
   luobo:        { name: '白萝卜', cost: 2    , sell: 10    , grow: 60    , xp: 1   , level: 1, },
   huluobo:      { name: '胡萝卜', cost: 4    , sell: 20    , grow: 120   , xp: 2   , level: 2, },
   baicai:       { name: '大白菜', cost: 10   , sell: 40    , grow: 300   , xp: 5   , level: 3, },
   dasuan:       { name: '大蒜', cost: 20   , sell: 100   , grow: 600   , xp: 10  , level: 4, },
   dacong:       { name: '大葱', cost: 42   , sell: 210   , grow: 1200  , xp: 20  , level: 5, },
   shuidao:      { name: '水稻', cost: 84   , sell: 420   , grow: 2400  , xp: 41  , level: 6, },
   xiaomai:      { name: '小麦', cost: 126  , sell: 600   , grow: 3600  , xp: 62  , level: 7, },
   yumi:         { name: '玉米', cost: 168  , sell: 840   , grow: 4800  , xp: 82  , level: 8, },
   shengjiang:   { name: '鲜姜', cost: 223  , sell: 1080  , grow: 6000  , xp: 106 , level: 9, },
   tudou:        { name: '土豆', cost: 268  , sell: 1320  , grow: 7200  , xp: 128 , level: 10, },
   xiaobaicai:   { name: '小白菜', cost: 335  , sell: 1600  , grow: 9000  , xp: 160 , level: 11, },
   shengcai:     { name: '生菜', cost: 402  , sell: 2000  , grow: 10800 , xp: 192 , level: 12, },
   youcai:       { name: '油菜', cost: 576  , sell: 2800  , grow: 14400 , xp: 272 , level: 13, },
   qiezi:        { name: '茄子', cost: 1152 , sell: 5600  , grow: 28800 , xp: 544 , level: 14, },
   hongzao:      { name: '红枣', cost: 1728 , sell: 8600  , grow: 43200 , xp: 816 , level: 15, },
   pugongying:   { name: '蒲公英', cost: 3456 , sell: 17200 , grow: 86400 , xp: 1632, level: 16, },
   yinlianhua:   { name: '银莲花', cost: 640  , sell: 3200  , grow: 14400 , xp: 288 , level: 17, },
   fanqie:       { name: '番茄', cost: 1280 , sell: 6400  , grow: 28800 , xp: 576 , level: 18, },
   huacai:       { name: '花菜', cost: 1920 , sell: 9600  , grow: 43200 , xp: 864 , level: 19, },
   jiucai:       { name: '韭菜', cost: 3840 , sell: 19200 , grow: 86400 , xp: 1728, level: 20, },
   xiaochuju:    { name: '小雏菊', cost: 704  , sell: 3400  , grow: 14400 , xp: 304 , level: 21, },
   wandou:       { name: '豌豆', cost: 1408 , sell: 7000  , grow: 28800 , xp: 608 , level: 22, },
   lianou:       { name: '莲藕', cost: 2112 , sell: 10400 , grow: 43200 , xp: 912 , level: 23, },
   hongmeigui:   { name: '红玫瑰', cost: 4224 , sell: 21000 , grow: 86400 , xp: 1824, level: 24, },
   huangqiuju:   { name: '黄秋菊', cost: 792  , sell: 3800  , grow: 14400 , xp: 324 , level: 25, },
   mantianxing:  { name: '满天星', cost: 1584 , sell: 7800  , grow: 28800 , xp: 648 , level: 26, },
   hanxiucao:    { name: '含羞草', cost: 2376 , sell: 11800 , grow: 43200 , xp: 972 , level: 27, },
   qianniuhua:   { name: '牵牛花', cost: 4752 , sell: 23600 , grow: 86400 , xp: 1944, level: 28, },
   hongqiuju:    { name: '红秋菊', cost: 888  , sell: 4400  , grow: 14400 , xp: 344 , level: 29, },
   lajiao:       { name: '辣椒', cost: 1776 , sell: 8800  , grow: 28800 , xp: 688 , level: 30, },
   huanggua:     { name: '黄瓜', cost: 2664 , sell: 13200 , grow: 43200 , xp: 1032, level: 31, },
   qincai:       { name: '芹菜', cost: 5328 , sell: 26600 , grow: 86400 , xp: 2064, level: 32, },
   baihe:        { name: '百合', cost: 992  , sell: 4800  , grow: 14400 , xp: 368 , level: 33, },
   nangua:       { name: '南瓜', cost: 1984 , sell: 9800  , grow: 28800 , xp: 736 , level: 34, },
   hetao:        { name: '核桃', cost: 2976 , sell: 14800 , grow: 43200 , xp: 1104, level: 35, },
   shanzha:      { name: '山楂', cost: 5952 , sell: 29600 , grow: 86400 , xp: 2208, level: 36, },
   bocai:        { name: '菠菜', cost: 1120 , sell: 5600  , grow: 14400 , xp: 392 , level: 37, },
   caomei:       { name: '草莓', cost: 2240 , sell: 11200 , grow: 28800 , xp: 784 , level: 38, },
   pingguo:      { name: '苹果', cost: 3360 , sell: 16800 , grow: 43200 , xp: 1176, level: 39, },
   siyecao:      { name: '四叶草', cost: 6720 , sell: 33600 , grow: 86400 , xp: 2352, level: 40, },
   feizhouju:    { name: '非洲菊', cost: 1248 , sell: 6240  , grow: 14400 , xp: 420 , level: 41, },
   huorongcao:   { name: '火绒草', cost: 2496 , sell: 12480 , grow: 28800 , xp: 840 , level: 42, },
   gezihua:      { name: '鸽子花', cost: 3744 , sell: 18720 , grow: 43200 , xp: 1260, level: 43, },
   yumeiren:     { name: '虞美人', cost: 7488 , sell: 37440 , grow: 86400 , xp: 2520, level: 44, },
   xiangrikui:   { name: '向日葵', cost: 1400 , sell: 7000  , grow: 14400 , xp: 448 , level: 45, },
   xigua:        { name: '西瓜', cost: 2800 , sell: 14000 , grow: 28800 , xp: 896 , level: 46, },
   huangdou:     { name: '黄豆', cost: 4200 , sell: 21000 , grow: 43200 , xp: 1344, level: 47, },
   xiangjiao:    { name: '香蕉', cost: 8400 , sell: 42000 , grow: 86400 , xp: 2688, level: 48, },
   zhusun:       { name: '竹笋', cost: 1560 , sell: 7800  , grow: 14400 , xp: 476 , level: 49, },
   taozi:        { name: '桃子', cost: 3120 , sell: 15600 , grow: 28800 , xp: 952 , level: 50, },
   ganzhe:       { name: '甘蔗', cost: 4680 , sell: 23400 , grow: 43200 , xp: 1428, level: 51, },
   chengzi:      { name: '橙子', cost: 9360 , sell: 46800 , grow: 86400 , xp: 2856, level: 52, },
   molihua:      { name: '茉莉花', cost: 1728 , sell: 8600  , grow: 14400 , xp: 508 , level: 53, },
   putao:        { name: '葡萄', cost: 3456 , sell: 17200 , grow: 28800 , xp: 1016, level: 54, },
   sigua:        { name: '丝瓜', cost: 5184 , sell: 25800 , grow: 43200 , xp: 1524, level: 55, },
   zhenzi:       { name: '榛子', cost: 10368, sell: 51800 , grow: 86400 , xp: 3048, level: 56, },
   yingchunhua:  { name: '迎春花', cost: 1920 , sell: 9600  , grow: 14400 , xp: 540 , level: 57, },
   shiliu:       { name: '石榴', cost: 3840 , sell: 19200 , grow: 28800 , xp: 1080, level: 58, },
   lizi:         { name: '栗子', cost: 5760 , sell: 28800 , grow: 43200 , xp: 1620, level: 59, },
   youzi:        { name: '柚子', cost: 11520, sell: 57600 , grow: 86400 , xp: 3240, level: 60, },
   /* level 61-100:可收获两季(grow=第一季,regrow=第二季,均以秒计;xp/sell 为单季值) */
   mogu:         { name: '蘑菇', cost: 3168 , sell: 7800  , grow: 14400, regrow: 7200 , xp: 429 , level: 61, },
   boluo:        { name: '菠萝', cost: 6336 , sell: 15800 , grow: 28800, regrow: 14400, xp: 858 , level: 62, },
   ruozhu:       { name: '箬竹', cost: 9504 , sell: 23600 , grow: 43200, regrow: 21600, xp: 1287, level: 63, },
   wuhuaguo:     { name: '无花果', cost: 19008, sell: 47400 , grow: 86400, regrow: 43200, xp: 2574, level: 64, },
   yezi:         { name: '椰子', cost: 3492 , sell: 8600  , grow: 14400, regrow: 7200 , xp: 456 , level: 65, },
   huasheng:     { name: '花生', cost: 6984 , sell: 17400 , grow: 28800, regrow: 14400, xp: 912 , level: 66, },
   jinzhengu:    { name: '金针菇', cost: 10476, sell: 26000 , grow: 43200, regrow: 21600, xp: 1368, level: 67, },
   hulu:         { name: '葫芦', cost: 20952, sell: 52200 , grow: 86400, regrow: 43200, xp: 2736, level: 68, },
   mihoutao:     { name: '猕猴桃', cost: 3828 , sell: 9400  , grow: 14400, regrow: 7200 , xp: 480 , level: 69, },
   li:           { name: '梨', cost: 7656 , sell: 19000 , grow: 28800, regrow: 14400, xp: 960 , level: 70, },
   shuilian:     { name: '睡莲', cost: 11484, sell: 28600 , grow: 43200, regrow: 21600, xp: 1440, level: 71, },
   huolongguo:   { name: '火龙果', cost: 22968, sell: 57400 , grow: 86400, regrow: 43200, xp: 2880, level: 72, },
   pipa:         { name: '枇杷', cost: 4176 , sell: 10400 , grow: 14400, regrow: 7200 , xp: 510 , level: 73, },
   yingtao:      { name: '樱桃', cost: 8352 , sell: 20800 , grow: 28800, regrow: 14400, xp: 1020, level: 74, },
   lizi2:        { name: '李子', cost: 12528, sell: 31200 , grow: 43200, regrow: 21600, xp: 1530, level: 75, },
   lizhi:        { name: '荔枝', cost: 25056, sell: 62600 , grow: 86400, regrow: 43200, xp: 3060, level: 76, },
   xianggua:     { name: '香瓜', cost: 4560 , sell: 11400 , grow: 14400, regrow: 7200 , xp: 537 , level: 77, },
   mugua:        { name: '木瓜', cost: 9120 , sell: 22800 , grow: 28800, regrow: 14400, xp: 1074, level: 78, },
   guiyuan:      { name: '桂圆', cost: 13680, sell: 34200 , grow: 43200, regrow: 21600, xp: 1611, level: 79, },
   yueshi:       { name: '月柿', cost: 27360, sell: 68400 , grow: 86400, regrow: 43200, xp: 3222, level: 80, },
   yangtao:      { name: '杨桃', cost: 4944 , sell: 12200 , grow: 14400, regrow: 7200 , xp: 567 , level: 81, },
   hamigua:      { name: '哈密瓜', cost: 9888 , sell: 24600 , grow: 28800, regrow: 14400, xp: 1134, level: 82, },
   sangshen:     { name: '桑葚', cost: 14832, sell: 37000 , grow: 43200, regrow: 21600, xp: 1701, level: 83, },
   ningmeng:     { name: '柠檬', cost: 29664, sell: 74000 , grow: 86400, regrow: 43200, xp: 3402, level: 84, },
   mangguo:      { name: '芒果', cost: 5364 , sell: 13400 , grow: 14400, regrow: 7200 , xp: 597 , level: 85, },
   yangmei:      { name: '杨梅', cost: 10728, sell: 26800 , grow: 28800, regrow: 14400, xp: 1194, level: 86, },
   liulian:      { name: '榴莲', cost: 16092, sell: 40200 , grow: 43200, regrow: 21600, xp: 1791, level: 87, },
   fanshiliu:    { name: '番石榴', cost: 32184, sell: 80400 , grow: 86400, regrow: 43200, xp: 3582, level: 88, },
   pingzishu:    { name: '瓶子树', cost: 5796 , sell: 14400 , grow: 14400, regrow: 7200 , xp: 627 , level: 89, },
   lanmei:       { name: '蓝莓', cost: 11592, sell: 28800 , grow: 28800, regrow: 14400, xp: 1254, level: 90, },
   zhulongcao:   { name: '猪笼草', cost: 17388, sell: 43400 , grow: 43200, regrow: 21600, xp: 1881, level: 91, },
   shanzhu:      { name: '山竹', cost: 34776, sell: 86800 , grow: 86400, regrow: 43200, xp: 3762, level: 92, },
   mantuoluohua: { name: '曼陀罗华', cost: 6240 , sell: 15600 , grow: 14400, regrow: 7200 , xp: 660 , level: 93, },
   manzhusahua:  { name: '曼珠沙华', cost: 12480, sell: 31200 , grow: 28800, regrow: 14400, xp: 1320, level: 94, },
   kugua:        { name: '苦瓜', cost: 18720, sell: 46800 , grow: 43200, regrow: 21600, xp: 1980, level: 95, },
   tiantangniao: { name: '天堂鸟', cost: 37440, sell: 93600 , grow: 86400, regrow: 43200, xp: 3960, level: 96, },
   donggua:      { name: '冬瓜', cost: 6720 , sell: 16800 , grow: 14400, regrow: 7200 , xp: 693 , level: 97, },
   baopihua:     { name: '豹皮花', cost: 13440, sell: 33600 , grow: 28800, regrow: 14400, xp: 1386, level: 98, },
   xingzi:       { name: '杏子', cost: 10160, sell: 50400 , grow: 43200, regrow: 21600, xp: 2079, level: 99, },
   jinju:        { name: '金桔', cost: 40320, sell: 100800, grow: 86400, regrow: 43200, xp: 4158, level: 100, },
   /* 隐藏种子:仅供收获作物时掉落,不在商店出售(hidden:true 由商店列表排除)。
      摇钱树:收获产物卖 888 金币、无经验;经验包:收获给经验、产物卖 0 金币 */
   yaoqianshu:   { name: '摇钱树', cost: 0, sell: 888, grow: 60, xp: 0, level: 1, hidden: true, flatXp: true },
   jingyanbao:   { name: '经验包', cost: 0, sell: 0, grow: 60, xp: 888, level: 1, hidden: true, flatXp: true },
};
/* ---------- 地块扩建等级(按地块下标,共 24 块)
   前 6 块(下标 0-5)初始即扩建;第 7 块起 5 级开放,每升 2 级再扩 1 块 ---------- */
const PLOT_LEVEL_REQ = [1, 1, 1, 1, 1, 1, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];

/* ---------- 地块扩建费用(金币,按地块下标;前 6 块初始即扩建为 0,5000 起,60000 后每块 +20000) ---------- */
const PLOT_UNLOCK_COST = [0, 0, 0, 0, 0, 0, 5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000, 280000, 300000];

/* ---------- 土地分级:0 黄 1 红 2 黑 3 金(逐级升级,颜色用于地块边框与角标区分) ---------- */
const PLOT_GRADE_NAME = ['黄土地', '红土地', '黑土地', '金土地'];
const PLOT_GRADE_YIELD = [1, 2, 3, 4];                 // 收获数量倍率(随等级提升)
const PLOT_GRADE_GROW = [1, 1, 1 / 0.9, 1 / 0.8];      // 生长速度倍率(>1 更快:3 级 -10%、4 级 -20%)
const PLOT_GRADE_XP = [1, 1, 1, 1.2];                  // 收获经验倍率(4 级 +20%)
/* 升级条件:按地块下标(0=第1块…23=第24块),每项 [升到2/3/4级] 的 {level, cost} */
const PLOT_UPGRADE = [
    [{ level: 28, cost: 200000 }, { level: 40, cost: 600000 }, { level: 58, cost: 1000000 }],
    [{ level: 29, cost: 250000 }, { level: 41, cost: 800000 }, { level: 59, cost: 1400000 }],
    [{ level: 30, cost: 300000 }, { level: 42, cost: 1000000 }, { level: 60, cost: 1800000 }],
    [{ level: 31, cost: 350000 }, { level: 43, cost: 1200000 }, { level: 61, cost: 2200000 }],
    [{ level: 32, cost: 400000 }, { level: 44, cost: 1400000 }, { level: 62, cost: 2600000 }],
    [{ level: 33, cost: 500000 }, { level: 45, cost: 1600000 }, { level: 63, cost: 3000000 }],
    [{ level: 34, cost: 600000 }, { level: 46, cost: 1800000 }, { level: 64, cost: 3400000 }],
    [{ level: 35, cost: 700000 }, { level: 47, cost: 2200000 }, { level: 65, cost: 4200000 }],
    [{ level: 36, cost: 800000 }, { level: 48, cost: 2600000 }, { level: 66, cost: 5000000 }],
    [{ level: 37, cost: 900000 }, { level: 49, cost: 3000000 }, { level: 67, cost: 5800000 }],
    [{ level: 38, cost: 1000000 }, { level: 50, cost: 3400000 }, { level: 68, cost: 6600000 }],
    [{ level: 39, cost: 1100000 }, { level: 51, cost: 3800000 }, { level: 69, cost: 7400000 }],
    [{ level: 40, cost: 1200000 }, { level: 52, cost: 4200000 }, { level: 70, cost: 8200000 }],
    [{ level: 41, cost: 1300000 }, { level: 53, cost: 4600000 }, { level: 71, cost: 9000000 }],
    [{ level: 42, cost: 1400000 }, { level: 54, cost: 5000000 }, { level: 72, cost: 9800000 }],
    [{ level: 43, cost: 1500000 }, { level: 55, cost: 5400000 }, { level: 73, cost: 10600000 }],
    [{ level: 44, cost: 1600000 }, { level: 56, cost: 5800000 }, { level: 74, cost: 11400000 }],
    [{ level: 45, cost: 1700000 }, { level: 57, cost: 6200000 }, { level: 75, cost: 12200000 }],
    [{ level: 47, cost: 1800000 }, { level: 59, cost: 6600000 }, { level: 77, cost: 13000000 }],
    [{ level: 49, cost: 1900000 }, { level: 61, cost: 7000000 }, { level: 79, cost: 13800000 }],
    [{ level: 51, cost: 2000000 }, { level: 63, cost: 7400000 }, { level: 81, cost: 14600000 }],
    [{ level: 53, cost: 2100000 }, { level: 65, cost: 7800000 }, { level: 83, cost: 15400000 }],
    [{ level: 55, cost: 2200000 }, { level: 67, cost: 8200000 }, { level: 85, cost: 16200000 }],
    [{ level: 57, cost: 2300000 }, { level: 69, cost: 8600000 }, { level: 87, cost: 17000000 }],
];
const COLS = 6;
const ROWS = 4;
const TOTAL_PLOTS = COLS * ROWS; // 24 块地
const INITIAL_UNLOCKED = 6;      // 初始已扩建 6 块
const PLOT_DRY_CHANCE = 0.1;   // 收获后地块干枯的概率(约 10%)
const SEED_DROP_CHANCE = 0.08;   // 作物收获时额外掉落 1 颗对应种子的概率
const HIDDEN_SEED_DROP_CHANCE = 0.01; // 隐藏种子(摇钱树/经验包)每次收获最多掉 1 种,各 1% 概率(互斥)
const HIDDEN_SEEDS = ['yaoqianshu', 'jingyanbao']; // 仅供掉落获取,不在商店出售

/* ---------- 农场存档键 + 默认状态 ---------- */
const FARM_SAVE_KEY = 'qqfarm_farm_v1';

function makeDefaultFarm() {
    return {
        coins: 100,
        level: 1,
        xp: 0,
        plots: Array.from({ length: TOTAL_PLOTS }, () => null),
        unlockedPlots: Array.from({ length: TOTAL_PLOTS }, (_, i) => i < INITIAL_UNLOCKED),
        plotGrade: Array.from({ length: TOTAL_PLOTS }, () => 0),
        inventory: { seeds: { luobo: 3 } }, // items/locks 来自共享段
        log: [{ t: Date.now(), msg: '欢迎来到 星露谷农场!点空地种菜,收获后土地可能干枯,干枯的地需浇水后才能种植;达到等级后扩建更多土地。' }],
    };
}
