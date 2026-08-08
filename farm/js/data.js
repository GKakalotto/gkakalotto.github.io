/* ================= 静态数据 =================
   本文件只放数据,不含游戏逻辑。
   种子/鱼苗 的解锁等级已并入各自对象(见 level 字段);
   地块为按下标索引的等级/费用数组,按固定间隔生成:
   - 种子解锁:每升 1 级解锁 1 种,按商店顺序从 Lv.1 起依次开放
   - 地块间隔:初始 6 块免费;第 7 块起 5 级开放,每升 2 级再扩 1 块
   - 地块费用:二次递增 150,180,270,420,...,8820 */

/* ---------- 作物数据(名称/种子价/售出价/成熟秒数/经验/解锁等级) ---------- */
const CROPS = {
    /* 三种定位按解锁顺序循环(快收/暴利/经验),互不全面碾压:
       快收型 = 利润/秒最高·成熟最快·种子最便宜;
       暴利型 = 单次利润与单次经验最高·成熟最慢;
       经验型 = 经验/秒最高。
       level = 解锁等级(每升 1 级解锁 1 种,按数组顺序从 Lv.1 起);
       product = 收获物 key(缺省为该作物自身 key,如草籽成熟后收获牧草) */
    caozi:     { name: '草籽',   cost: 1,   sell: 2,   grow: 30,   xp: 1,   level: 1, product: 'siliao' },
    luobo:     { name: '萝卜',   cost: 5,   sell: 14,  grow: 30,   xp: 5,   level: 1  },
    baicai:    { name: '白菜',   cost: 15,  sell: 42,  grow: 180,  xp: 37,  level: 2  },
    tudou:     { name: '土豆',   cost: 8,   sell: 22,  grow: 60,   xp: 18,  level: 3  },
    fanqie:    { name: '番茄',   cost: 10,  sell: 28,  grow: 70,   xp: 11,  level: 4  },
    huanggua:  { name: '黄瓜',   cost: 30,  sell: 78,  grow: 330,  xp: 67,  level: 5  },
    yumi:      { name: '玉米',   cost: 16,  sell: 42,  grow: 130,  xp: 39,  level: 6  },
    lajiao:    { name: '辣椒',   cost: 15,  sell: 40,  grow: 110,  xp: 17,  level: 7  },
    qiezi:     { name: '茄子',   cost: 45,  sell: 115, grow: 480,  xp: 98,  level: 8  },
    doujiao:   { name: '豆角',   cost: 24,  sell: 62,  grow: 200,  xp: 60,  level: 9  },
    nangua:    { name: '南瓜',   cost: 20,  sell: 55,  grow: 150,  xp: 23,  level: 10 },
    donggua:   { name: '冬瓜',   cost: 60,  sell: 150, grow: 630,  xp: 128, level: 11 },
    sigua:     { name: '丝瓜',   cost: 32,  sell: 80,  grow: 270,  xp: 81,  level: 12 },
    kugua:     { name: '苦瓜',   cost: 25,  sell: 65,  grow: 190,  xp: 29,  level: 13 },
    huluobo:   { name: '胡萝卜', cost: 75,  sell: 185, grow: 780,  xp: 159, level: 14 },
    yangcong:  { name: '洋葱',   cost: 40,  sell: 100, grow: 340,  xp: 102, level: 15 },
    dacong:    { name: '大葱',   cost: 30,  sell: 75,  grow: 230,  xp: 36,  level: 16 },
    dasuan:    { name: '大蒜',   cost: 90,  sell: 220, grow: 930,  xp: 190, level: 17 },
    shengjiang:{ name: '生姜',   cost: 48,  sell: 120, grow: 410,  xp: 123, level: 18 },
    huasheng:  { name: '花生',   cost: 35,  sell: 88,  grow: 270,  xp: 42,  level: 19 },
    dadou:     { name: '大豆',   cost: 105, sell: 260, grow: 1080, xp: 220, level: 20 },
    xiaomai:   { name: '小麦',   cost: 56,  sell: 140, grow: 480,  xp: 144, level: 21 },
    shuidao:   { name: '水稻',   cost: 40,  sell: 105, grow: 310,  xp: 49,  level: 22 },
    yanmai:    { name: '燕麦',   cost: 120, sell: 290, grow: 1230, xp: 251, level: 23 },
    gaoliang:  { name: '高粱',   cost: 64,  sell: 160, grow: 550,  xp: 165, level: 24 },
    ganzhe:    { name: '甘蔗',   cost: 45,  sell: 115, grow: 350,  xp: 55,  level: 25 },
};

/* ---------- 作物 key 列表(商店展示顺序即数组顺序) ---------- */
const CROP_KEYS = Object.keys(CROPS);

/* ---------- 作物定位标签(按解锁顺序循环:快收/暴利/经验) ---------- */
const CROP_KIND = [
    { label: '快收', cls: 'fast' },
    { label: '暴利', cls: 'big' },
    { label: '经验', cls: 'exp' },
];

/* ---------- 鱼塘:鱼数据(名称/鱼苗价/售出价/生长秒数/经验/解锁等级) ----------
   与作物同一套三定位平衡思路:按解锁顺序循环 快收/暴利/经验,互不碾压。
   level = 解锁等级(Lv.10 起每升 1 级解锁 1 种,按商店顺序从 Lv.10 起) */
const FISH = {
    caoyu:    { name: '草鱼', cost: 6,   sell: 16,  grow: 40,  xp: 7,   level: 10 },
    bianyu:   { name: '鳊鱼', cost: 18,  sell: 44,  grow: 200, xp: 43,  level: 11 },
    baitiao:  { name: '白条', cost: 10,  sell: 24,  grow: 70,  xp: 22,  level: 12 },
    maisui:   { name: '麦穗', cost: 12,  sell: 30,  grow: 90,  xp: 15,  level: 13 },
    liyu:     { name: '鲤鱼', cost: 36,  sell: 85,  grow: 360, xp: 78,  level: 14 },
    qingyu:   { name: '青鱼', cost: 20,  sell: 48,  grow: 150, xp: 47,  level: 15 },
    yongyu:   { name: '鳙鱼', cost: 18,  sell: 48,  grow: 140, xp: 23,  level: 16 },
    heiyu:    { name: '黑鱼', cost: 54,  sell: 130, grow: 520, xp: 112, level: 17 },
    jiyu:     { name: '鲫鱼', cost: 30,  sell: 70,  grow: 230, xp: 72,  level: 18 },
    lianyu:   { name: '鲢鱼', cost: 24,  sell: 60,  grow: 190, xp: 32,  level: 19 },
    guiyu:    { name: '鳜鱼', cost: 72,  sell: 175, grow: 680, xp: 147, level: 20 },
    luyu:     { name: '鲈鱼', cost: 40,  sell: 95,  grow: 310, xp: 97,  level: 21 },
};
const FISH_KEYS = Object.keys(FISH);

/* ---------- 地块解锁等级(按地块下标,共 24 块)
   前 6 块(下标 0-5)初始解锁;第 7 块起 5 级开放,每升 2 级再扩 1 块 ---------- */
const PLOT_LEVEL_REQ = [1, 1, 1, 1, 1, 1, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];

/* ---------- 地块解锁费用(金币,按地块下标;二次递增,后期地块是主要金币消耗) ---------- */
const PLOT_UNLOCK_COST = [0, 0, 0, 0, 0, 0, 150, 180, 270, 420, 630, 900, 1230, 1620, 2070, 2580, 3150, 3780, 4470, 5220, 6030, 6900, 7830, 8820];

/* ---------- 鱼塘解锁条件 ----------
   区域:Lv.10 + 5000 金币一次性解锁,赠送 POND_BONUS_COUNT 条鱼苗;
   初始开放 POND_INITIAL_OPEN 格,其余格每升 POND_EXPAND_INTERVAL 级花金币再开 1 格(共 TOTAL_PONDS 格),
   扩张格费用见 POND_CELL_UNLOCK_COST ---------- */
const POND_UNLOCK_LEVEL = 10;   // 10 级解锁区域
const POND_UNLOCK_COST = 5000;  // 解锁区域费用 5000 金币
const POND_INITIAL_OPEN = 5;    // 区域解锁后初始开放的鱼塘格数(自动开放)
const POND_EXPAND_INTERVAL = 2; // 每升多少级再开放 1 格鱼塘
const POND_CELL_UNLOCK_COST = [200, 400, 800, 1600, 3200]; // 扩张格(下标 5~9)解锁费用
const POND_BONUS_FRY = 'caoyu'; // 解锁赠送的鱼苗种类
const POND_BONUS_COUNT = 3;     // 赠送鱼苗数量
/* ---------- 雇佣农工:可选时长(小时)与对应费用 ---------- */
const HIRE_OPTIONS = [
    { hours: 1, cost: 1000 },
    { hours: 2, cost: 1800 },
    { hours: 4, cost: 3200 },
    { hours: 8, cost: 5000 },
];
const POND_COLS = 5;            // 鱼塘列数
const POND_ROWS = 2;            // 鱼塘行数
const TOTAL_PONDS = POND_COLS * POND_ROWS; // 10 个鱼塘

/* ---------- 养殖:动物数据(幼崽价/生长秒数/产出间隔秒数/产物/经验/解锁等级)
   成熟后持续产出:每 produceEvery 秒产 1 个产物,累计 ANIMAL_MAX_PRODUCE 次后可收获动物本体进仓库;
   牧槽不空时每 FEED_EVERY 个周期自动消耗 1 牧草,缺草时生长/产出暂停 ---------- */
const ANIMALS = {
    ji:    { name: '鸡',   cost: 100,  grow: 1200, produceEvery: 180,  product: 'jidan',    xp: 25,  level: 1  },
    ya:    { name: '鸭',   cost: 250,  grow: 1500, produceEvery: 300,  product: 'yadan',    xp: 55,  level: 3  },
    niu:   { name: '牛',   cost: 500,  grow: 1800, produceEvery: 600,  product: 'niunai',   xp: 100, level: 5  },
    yang:  { name: '羊',   cost: 1000, grow: 2400, produceEvery: 1200, product: 'yangmao',  xp: 180, level: 7  },
    tu:    { name: '兔',   cost: 1500, grow: 3000, produceEvery: 1500, product: 'tumao',    xp: 240, level: 9  },
    e:     { name: '鹅',   cost: 2200, grow: 3600, produceEvery: 1800, product: 'edan',     xp: 300, level: 11 },
    zhu:   { name: '猪',   cost: 3200, grow: 4200, produceEvery: 2100, product: 'songlu',   xp: 380, level: 13 },
    huoji: { name: '火鸡', cost: 4500, grow: 4800, produceEvery: 2400, product: 'huoji_dan', xp: 460, level: 15 },
};
const ANIMAL_KEYS = Object.keys(ANIMALS);

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
const ANIMAL_MAX_PRODUCE = 10;      // 动物成熟后可收获产物的次数,满后收获动物本体

/* ---------- 养殖栏位:4 行 × 5 列共 20 格,初始开放 4 格,Lv.5 起每升 2 级花金币再开 1 格 ---------- */
const RANCH_TOTAL = 20;              // 栏位总数(4 行 × 5 列)
const RANCH_INITIAL_OPEN = 4;        // 初始开放栏位数
const RANCH_FIRST_LEVEL = 5;         // 扩张栏位起始等级
const RANCH_EXPAND_INTERVAL = 2;     // 每升多少级开放 1 格
const RANCH_UNLOCK_COST = [200, 400, 600, 800, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 8000, 10000]; // 扩张格(下标 4~19)解锁费用,上限 10000
const FEED_COST = 10;                // 牧草单价(金币)
const FEED_TROUGH_CAP = 1000;        // 牧槽容量(牧草上限)
const FEED_EVERY = 2;                // 每产出 FEED_EVERY 个周期后需要喂食一次(饥饿间隔 = produceEvery*FEED_EVERY)

/* ---------- 其他常量 ---------- */
const SAVE_KEY = 'qqfarm_text_v6';
const COLS = 6;
const ROWS = 4;
const TOTAL_PLOTS = COLS * ROWS; // 24 块地
const INITIAL_UNLOCKED = 6;      // 初始解锁 6 块
const DROUGHT_CHANCE = 0.3;      // 生长中出现干旱的概率
const SEED_DROP_CHANCE = 0.16;   // 作物收获时额外掉落 1 颗对应种子的概率(鱼不再掉落鱼苗)
