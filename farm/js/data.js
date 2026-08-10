/* ================= 静态数据 =================
   本文件只放数据,不含游戏逻辑。
   种子/鱼苗 的解锁等级已并入各自对象(见 level 字段);
   地块为按下标索引的等级/费用数组,按固定间隔生成:
   - 种子解锁:每升 1 级解锁 1 种,按商店顺序从 Lv.1 起依次开放
   - 地块间隔:初始 6 块免费;第 7 块起 5 级开放,每升 2 级再扩 1 块
   - 地块费用:5000 起,60000 后每块 +20000 */

/* ---------- 作物数据(名称/种子价/售出价/成熟秒数/经验/解锁等级) ---------- */
const CROPS = {
    /* 每 4 种一组,成熟时间 240/480/720/1440 分钟,售价按成熟时长取 5x/6x/7x/8x,
       组内收益/分钟呈 4:5:6:7 梯度:挂机越久单位时间收益越高,但锁地更久、种子更贵。
       level = 解锁等级(每升 1 级解锁 1 种,初始 Lv.1 可种 草籽/白萝卜);
       product = 收获物 key(缺省为该作物自身 key,如草籽成熟后收获牧草) */
    caozi:        { name: '草籽',   cost: 1,    sell: 2,     grow: 60,    xp: 1,    level: 1,  product: 'siliao' },
    luobo:        { name: '白萝卜', cost: 2,    sell: 10,    grow: 60,    xp: 1,    level: 1  },
    huluobo:      { name: '胡萝卜', cost: 4,    sell: 20,    grow: 120,   xp: 2,    level: 2  },
    baicai:       { name: '大白菜', cost: 10,   sell: 40,    grow: 300,   xp: 5,    level: 3  },
    dasuan:       { name: '大蒜',   cost: 20,   sell: 100,   grow: 600,   xp: 10,   level: 4  },
    dacong:       { name: '大葱',   cost: 42,   sell: 210,   grow: 1200,  xp: 20,   level: 5  },
    shuidao:      { name: '水稻',   cost: 84,   sell: 420,   grow: 2400,  xp: 41,   level: 6  },
    xiaomai:      { name: '小麦',   cost: 126,  sell: 630,   grow: 3600,  xp: 62,   level: 7  },
    yumi:         { name: '玉米',   cost: 168,  sell: 840,   grow: 4800,  xp: 82,   level: 8  },
    shengjiang:   { name: '鲜姜',   cost: 223,  sell: 1115,  grow: 6000,  xp: 106,  level: 9  },
    tudou:        { name: '土豆',   cost: 268,  sell: 1340,  grow: 7200,  xp: 128,  level: 10 },
    xiaobaicai:   { name: '小白菜', cost: 335,  sell: 1675,  grow: 9000,  xp: 160,  level: 11 },
    shengcai:     { name: '生菜',   cost: 402,  sell: 2010,  grow: 10800, xp: 192,  level: 12 },
    youcai:       { name: '油菜',   cost: 576,  sell: 2880,  grow: 14400, xp: 272,  level: 13 },
    qiezi:        { name: '茄子',   cost: 1152, sell: 6912,  grow: 28800, xp: 544,  level: 14 },
    hongzao:      { name: '红枣',   cost: 1728, sell: 12096, grow: 43200, xp: 816,  level: 15 },
    pugongying:   { name: '蒲公英', cost: 3456, sell: 27648, grow: 86400, xp: 1632, level: 16 },
    yinlianhua:   { name: '银莲花', cost: 640,  sell: 3200,  grow: 14400, xp: 288,  level: 17 },
    fanqie:       { name: '番茄',   cost: 1280, sell: 7680,  grow: 28800, xp: 576,  level: 18 },
    huacai:       { name: '花菜',   cost: 1920, sell: 13440, grow: 43200, xp: 864,  level: 19 },
    jiucai:       { name: '韭菜',   cost: 3840, sell: 30720, grow: 86400, xp: 1728, level: 20 },
    xiaochuju:    { name: '小雏菊', cost: 704,  sell: 3520,  grow: 14400, xp: 304,  level: 21 },
    wandou:       { name: '豌豆',   cost: 1408, sell: 8448,  grow: 28800, xp: 608,  level: 22 },
    lianou:       { name: '莲藕',   cost: 2112, sell: 14784, grow: 43200, xp: 912,  level: 23 },
    hongmeigui:   { name: '红玫瑰', cost: 4224, sell: 33792, grow: 86400, xp: 1824, level: 24 },
    huangqiuju:   { name: '黄秋菊', cost: 792,  sell: 3960,  grow: 14400, xp: 324,  level: 25 },
    mantianxing:  { name: '满天星', cost: 1584, sell: 9504,  grow: 28800, xp: 648,  level: 26 },
    hanxiucao:    { name: '含羞草', cost: 2376, sell: 16632, grow: 43200, xp: 972,  level: 27 },
    qianniuhua:   { name: '牵牛花', cost: 4752, sell: 38016, grow: 86400, xp: 1944, level: 28 },
    hongqiuju:    { name: '红秋菊', cost: 888,  sell: 4440,  grow: 14400, xp: 344,  level: 29 },
    lajiao:       { name: '辣椒',   cost: 1776, sell: 10656, grow: 28800, xp: 688,  level: 30 },
    huanggua:     { name: '黄瓜',   cost: 2664, sell: 18648, grow: 43200, xp: 1032, level: 31 },
    qincai:       { name: '芹菜',   cost: 5328, sell: 42624, grow: 86400, xp: 2064, level: 32 },
    baihe:        { name: '百合',   cost: 992,  sell: 4960,  grow: 14400, xp: 368,  level: 33 },
    nangua:       { name: '南瓜',   cost: 1984, sell: 11904, grow: 28800, xp: 736,  level: 34 },
    hetao:        { name: '核桃',   cost: 2976, sell: 20832, grow: 43200, xp: 1104, level: 35 },
    shanzha:      { name: '山楂',   cost: 5952, sell: 47616, grow: 86400, xp: 2208, level: 36 },
    bocai:        { name: '菠菜',   cost: 1120, sell: 5600,  grow: 14400, xp: 392,  level: 37 },
    caomei:       { name: '草莓',   cost: 2240, sell: 13440, grow: 28800, xp: 784,  level: 38 },
    pingguo:      { name: '苹果',   cost: 3360, sell: 23520, grow: 43200, xp: 1176, level: 39 },
    siyecao:      { name: '四叶草', cost: 6720, sell: 53760, grow: 86400, xp: 2352, level: 40 },
};

/* ---------- 鱼塘:鱼数据(名称/鱼苗价/售出价/生长秒数/经验/解锁等级) ----------
   与作物同一套三定位平衡思路:按解锁顺序循环 快收/暴利/经验,互不碾压。
   level = 解锁等级(Lv.5 起每升 1 级解锁 1 种,按商店顺序从 Lv.5 起) */
const FISH = {
    caoyu:    { name: '草鱼', cost: 6,   sell: 16,  grow: 40,  xp: 7,   level: 5  },
    bianyu:   { name: '鳊鱼', cost: 18,  sell: 44,  grow: 200, xp: 43,  level: 6  },
    baitiao:  { name: '白条', cost: 10,  sell: 24,  grow: 70,  xp: 22,  level: 7  },
    maisui:   { name: '麦穗', cost: 12,  sell: 30,  grow: 90,  xp: 15,  level: 8  },
    liyu:     { name: '鲤鱼', cost: 36,  sell: 85,  grow: 360, xp: 78,  level: 9  },
    qingyu:   { name: '青鱼', cost: 20,  sell: 48,  grow: 150, xp: 47,  level: 10 },
    yongyu:   { name: '鳙鱼', cost: 18,  sell: 48,  grow: 140, xp: 23,  level: 11 },
    heiyu:    { name: '黑鱼', cost: 54,  sell: 130, grow: 520, xp: 112, level: 12 },
    jiyu:     { name: '鲫鱼', cost: 30,  sell: 70,  grow: 230, xp: 72,  level: 13 },
    lianyu:   { name: '鲢鱼', cost: 24,  sell: 60,  grow: 190, xp: 32,  level: 14 },
    guiyu:    { name: '鳜鱼', cost: 72,  sell: 175, grow: 680, xp: 147, level: 15 },
    luyu:     { name: '鲈鱼', cost: 40,  sell: 95,  grow: 310, xp: 97,  level: 16 },
};

/* ---------- 地块解锁等级(按地块下标,共 24 块)
   前 6 块(下标 0-5)初始解锁;第 7 块起 5 级开放,每升 2 级再扩 1 块 ---------- */
const PLOT_LEVEL_REQ = [1, 1, 1, 1, 1, 1, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];

/* ---------- 地块解锁费用(金币,按地块下标;5000 起,60000 后每块 +20000) ---------- */
const PLOT_UNLOCK_COST = [0, 0, 0, 0, 0, 0, 5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000, 280000, 300000];

/* ---------- 鱼塘解锁条件 ----------
   区域:Lv.5 + 2000 金币一次性解锁,赠送 POND_BONUS_COUNT 条鱼苗;
   初始开放 POND_INITIAL_OPEN 格,其余格每升 POND_EXPAND_INTERVAL 级花金币再开 1 格(共 TOTAL_PONDS 格),
   扩张格费用见 POND_CELL_UNLOCK_COST ---------- */
const POND_UNLOCK_LEVEL = 5;    // 5 级解锁区域
const POND_UNLOCK_COST = 2000;  // 解锁区域费用 2000 金币
const POND_INITIAL_OPEN = 4;    // 区域解锁后初始开放的鱼塘格数(自动开放)
const POND_EXPAND_INTERVAL = 2; // 每升多少级再开放 1 格鱼塘
const POND_CELL_UNLOCK_COST = [5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000]; // 扩张格(下标 4~11)解锁费用,60000 后每块 +20000
const POND_BONUS_FRY = 'caoyu'; // 解锁赠送的鱼苗种类
const POND_BONUS_COUNT = 3;     // 赠送鱼苗数量
const POND_COLS = 4;            // 鱼塘列数
const POND_ROWS = 3;            // 鱼塘行数
const TOTAL_PONDS = POND_COLS * POND_ROWS; // 12 个鱼塘

/* ---------- 养殖:动物数据(幼崽价/生长秒数/产出间隔秒数/产物/经验/解锁等级)
   成熟后持续产出:每 produceEvery 秒产 1 个产物,累计 ANIMAL_MAX_PRODUCE 次后可收获动物本体进仓库;
   产出次数 10→6,每次间隔相应上调 5/3 倍,总产出时长不变;
   牧槽不空时每 FEED_EVERY 个周期自动消耗 1 牧草,缺草时生长/产出暂停 ---------- */
const ANIMALS = {
    ji:    { name: '鸡',   cost: 100,  grow: 1200, produceEvery: 300,  product: 'jidan',    xp: 25,  level: 1  },
    ya:    { name: '鸭',   cost: 250,  grow: 1500, produceEvery: 500,  product: 'yadan',    xp: 55,  level: 3  },
    niu:   { name: '牛',   cost: 500,  grow: 1800, produceEvery: 1000, product: 'niunai',   xp: 100, level: 5  },
    yang:  { name: '羊',   cost: 1000, grow: 2400, produceEvery: 2000, product: 'yangmao',  xp: 180, level: 7  },
    tu:    { name: '兔',   cost: 1500, grow: 3000, produceEvery: 2500, product: 'tumao',    xp: 240, level: 9  },
    e:     { name: '鹅',   cost: 2200, grow: 3600, produceEvery: 3000, product: 'edan',     xp: 300, level: 11 },
    zhu:   { name: '猪',   cost: 3200, grow: 4200, produceEvery: 3500, product: 'songlu',   xp: 380, level: 13 },
    huoji: { name: '火鸡', cost: 4500, grow: 4800, produceEvery: 4000, product: 'huoji_dan', xp: 460, level: 15 },
};

/* 动物产物与成体(与收获物同仓库,统一出售);牧草作为商品存在仓库,手动添入牧槽 */
const ANIMAL_PRODUCTS = {
    jidan:     { name: '鸡蛋', sell: 40  },
    yadan:     { name: '鸭蛋', sell: 90  },
    niunai:    { name: '牛奶', sell: 180 },
    yangmao:   { name: '羊毛', sell: 350 },
    tumao:     { name: '兔毛', sell: 420 },
    edan:      { name: '鹅蛋', sell: 550 },
    songlu:    { name: '松露', sell: 650 },
    huoji_dan: { name: '火鸡蛋', sell: 780 },
    siliao:    { name: '牧草', sell: 2   },
    /* 成体动物(累计产出 ANIMAL_MAX_PRODUCE 次后收获进仓库,key 与 ANIMALS 相同) */
    ji:    { name: '成鸡',   sell: 80  },
    ya:    { name: '成鸭',   sell: 180 },
    niu:   { name: '成牛',   sell: 350 },
    yang:  { name: '成羊',   sell: 650 },
    tu:    { name: '成兔',   sell: 900 },
    e:     { name: '成鹅',   sell: 1300 },
    zhu:   { name: '成猪',   sell: 1800 },
    huoji: { name: '成火鸡', sell: 2400 },
};
const ANIMAL_MAX_PRODUCE = 6;      // 动物成熟后可累计产出的次数,满后收获动物本体(产出进度自动累积,不收获也增加)

/* ---------- 养殖栏位:4 行 × 5 列共 20 格,初始开放 4 格,Lv.5 起每升 2 级花金币再开 1 格 ---------- */
const RANCH_TOTAL = 20;              // 栏位总数(4 行 × 5 列)
const RANCH_INITIAL_OPEN = 4;        // 初始开放栏位数
const RANCH_FIRST_LEVEL = 5;         // 扩张栏位起始等级
const RANCH_EXPAND_INTERVAL = 2;     // 每升多少级开放 1 格
const RANCH_UNLOCK_COST = [5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000]; // 扩张格(下标 4~19)解锁费用,60000 后每块 +20000
const FEED_COST = 10;                // 牧草单价(金币)
const FEED_TROUGH_CAP = 1000;        // 牧槽容量(牧草上限)
const FEED_EVERY = 2;                // 每产出 FEED_EVERY 个周期后需要喂食一次(饥饿间隔 = produceEvery*FEED_EVERY)

/* ---------- 其他常量 ---------- */
const SAVE_KEY = 'qqfarm_text_v7';
const COLS = 6;
const ROWS = 4;
const TOTAL_PLOTS = COLS * ROWS; // 24 块地
const INITIAL_UNLOCKED = 6;      // 初始解锁 6 块
const PLOT_DRY_CHANCE = 0.1;     // 收获后地块干枯的概率
const SEED_DROP_CHANCE = 0.16;   // 作物收获时额外掉落 1 颗对应种子的概率(鱼不再掉落鱼苗)
const QTY_MAX = 999999;          // 数量输入上限(防极端输入溢出)
