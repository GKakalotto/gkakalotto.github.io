/* ================= 静态数据 =================
   本文件只放数据,不含游戏逻辑。
   种子解锁等级与地块解锁等级是按固定间隔生成的有限数据,
   这里已展开成静态数组/对象,避免运行时重复计算:
   - 种子间隔:1,1,2,2,3,3,... 封顶 +3
   - 地块间隔:5,6,7,9,11,14,... 封顶 +4
   - 地块费用:二次递增 150,180,270,420,...,6030 */

/* ---------- 作物数据(名称/种子价/售出价/成熟秒数/经验) ---------- */
const CROPS = {
    /* 三种定位按解锁顺序循环(快收/暴利/经验),互不全面碾压:
       快收型 = 利润/秒最高·成熟最快·种子最便宜;
       暴利型 = 单次利润与单次经验最高·成熟最慢;
       经验型 = 经验/秒最高。 */
    luobo:     { name: '萝卜',   cost: 5,   sell: 14,  grow: 30,   xp: 5   },
    baicai:    { name: '白菜',   cost: 15,  sell: 42,  grow: 180,  xp: 37  },
    tudou:     { name: '土豆',   cost: 8,   sell: 22,  grow: 60,   xp: 18  },
    fanqie:    { name: '番茄',   cost: 10,  sell: 28,  grow: 70,   xp: 11  },
    huanggua:  { name: '黄瓜',   cost: 30,  sell: 78,  grow: 330,  xp: 67  },
    yumi:      { name: '玉米',   cost: 16,  sell: 42,  grow: 130,  xp: 39  },
    lajiao:    { name: '辣椒',   cost: 15,  sell: 40,  grow: 110,  xp: 17  },
    qiezi:     { name: '茄子',   cost: 45,  sell: 115, grow: 480,  xp: 98  },
    doujiao:   { name: '豆角',   cost: 24,  sell: 62,  grow: 200,  xp: 60  },
    nangua:    { name: '南瓜',   cost: 20,  sell: 55,  grow: 150,  xp: 23  },
    donggua:   { name: '冬瓜',   cost: 60,  sell: 150, grow: 630,  xp: 128 },
    sigua:     { name: '丝瓜',   cost: 32,  sell: 80,  grow: 270,  xp: 81  },
    kugua:     { name: '苦瓜',   cost: 25,  sell: 65,  grow: 190,  xp: 29  },
    huluobo:   { name: '胡萝卜', cost: 75,  sell: 185, grow: 780,  xp: 159 },
    yangcong:  { name: '洋葱',   cost: 40,  sell: 100, grow: 340,  xp: 102 },
    dacong:    { name: '大葱',   cost: 30,  sell: 75,  grow: 230,  xp: 36  },
    dasuan:    { name: '大蒜',   cost: 90,  sell: 220, grow: 930,  xp: 190 },
    shengjiang:{ name: '生姜',   cost: 48,  sell: 120, grow: 410,  xp: 123 },
    huasheng:  { name: '花生',   cost: 35,  sell: 88,  grow: 270,  xp: 42  },
    dadou:     { name: '大豆',   cost: 105, sell: 260, grow: 1080, xp: 220 },
    xiaomai:   { name: '小麦',   cost: 56,  sell: 140, grow: 480,  xp: 144 },
    shuidao:   { name: '水稻',   cost: 40,  sell: 105, grow: 310,  xp: 49  },
    yanmai:    { name: '燕麦',   cost: 120, sell: 290, grow: 1230, xp: 251 },
    gaoliang:  { name: '高粱',   cost: 64,  sell: 160, grow: 550,  xp: 165 },
    ganzhe:    { name: '甘蔗',   cost: 45,  sell: 115, grow: 350,  xp: 55  },
};

/* ---------- 作物 key 列表(商店展示顺序即数组顺序) ---------- */
const CROP_KEYS = Object.keys(CROPS);

/* ---------- 作物定位标签(按解锁顺序循环:快收/暴利/经验) ---------- */
const CROP_KIND = [
    { label: '快收', cls: 'fast' },
    { label: '暴利', cls: 'big' },
    { label: '经验', cls: 'exp' },
];

/* ---------- 工具数据 ---------- */
const TOOLS = {
    hoe: { name: '锄头', levelReq: 5, cost: 688, desc: '拥有后才可以扩建土地' },
    shovel: { name: '铲子', levelReq: 5, cost: 150, desc: '可铲除已种植的作物' },
};

/* ---------- 种子解锁等级(按作物 key) ---------- */
const SEED_LEVEL_REQ = {
    luobo: 1, baicai: 1, tudou: 2, fanqie: 3, huanggua: 5, yumi: 7,
    lajiao: 10, qiezi: 13, doujiao: 16, nangua: 19, donggua: 22, sigua: 25,
    kugua: 28, huluobo: 31, yangcong: 34, dacong: 37, dasuan: 40, shengjiang: 43,
    huasheng: 46, dadou: 49, xiaomai: 52, shuidao: 55, yanmai: 58, gaoliang: 61, ganzhe: 64,
};

/* ---------- 鱼塘:鱼数据(名称/鱼苗价/售出价/生长秒数/经验) ----------
   与作物同一套三定位平衡思路:按解锁顺序循环 快收/暴利/经验,互不碾压 */
const FISH = {
    caoyu:    { name: '草鱼', cost: 6,   sell: 16,  grow: 40,  xp: 7   },
    bianyu:   { name: '鳊鱼', cost: 18,  sell: 44,  grow: 200, xp: 43  },
    baitiao:  { name: '白条', cost: 10,  sell: 24,  grow: 70,  xp: 22  },
    maisui:   { name: '麦穗', cost: 12,  sell: 30,  grow: 90,  xp: 15  },
    liyu:     { name: '鲤鱼', cost: 36,  sell: 85,  grow: 360, xp: 78  },
    qingyu:   { name: '青鱼', cost: 20,  sell: 48,  grow: 150, xp: 47  },
    yongyu:   { name: '鳙鱼', cost: 18,  sell: 48,  grow: 140, xp: 23  },
    heiyu:    { name: '黑鱼', cost: 54,  sell: 130, grow: 520, xp: 112 },
    jiyu:     { name: '鲫鱼', cost: 30,  sell: 70,  grow: 230, xp: 72  },
    lianyu:   { name: '鲢鱼', cost: 24,  sell: 60,  grow: 190, xp: 32  },
    guiyu:    { name: '鳜鱼', cost: 72,  sell: 175, grow: 680, xp: 147 },
    luyu:     { name: '鲈鱼', cost: 40,  sell: 95,  grow: 310, xp: 97  },
};
const FISH_KEYS = Object.keys(FISH);

/* ---------- 鱼苗解锁等级(按鱼 key) ----------
   鱼塘在 Lv.10 解锁时只开放草鱼;其余鱼从 Lv.11 起按间隔 1,1,2,2,3,3... 依次解锁 */
const FISH_LEVEL_REQ = {
    caoyu: 1, bianyu: 11, baitiao: 12, maisui: 13, liyu: 15, qingyu: 17,
    yongyu: 20, heiyu: 23, jiyu: 26, lianyu: 29, guiyu: 32, luyu: 35,
};

/* ---------- 地块解锁等级(按地块下标,共 18 块) ---------- */
const PLOT_LEVEL_REQ = [1, 1, 1, 5, 6, 7, 9, 11, 14, 17, 21, 25, 29, 33, 37, 41, 45, 49];

/* ---------- 地块解锁费用(金币,按地块下标;二次递增,后期地块是主要金币消耗) ---------- */
const PLOT_UNLOCK_COST = [0, 0, 0, 150, 180, 270, 420, 630, 900, 1230, 1620, 2070, 2580, 3150, 3780, 4470, 5220, 6030];

/* ---------- 鱼塘解锁条件 ---------- */
const POND_UNLOCK_LEVEL = 10;   // 10 级解锁
const POND_UNLOCK_COST = 5000;  // 解锁费用 5000 金币
const POND_BONUS_FRY = 'caoyu'; // 解锁赠送的鱼苗种类
const POND_BONUS_COUNT = 10;    // 赠送鱼苗数量
const FISH_NET_COST = 500;      // 渔网价格(鱼塘解锁后购买,购买后一键捕捞)
const HIRE_COST = 5000;         // 雇佣农工费用
const HIRE_DURATION = 8 * 60 * 60 * 1000; // 雇佣有效期 8 小时(毫秒)
const POND_COLS = 5;            // 鱼塘列数
const POND_ROWS = 2;            // 鱼塘行数
const TOTAL_PONDS = POND_COLS * POND_ROWS; // 10 个鱼塘

/* ---------- 其他常量 ---------- */
const SAVE_KEY = 'qqfarm_text_v6';
const COLS = 6;
const ROWS = 3;
const TOTAL_PLOTS = COLS * ROWS; // 18 块地
const INITIAL_UNLOCKED = 3;      // 初始解锁 3 块
const DROUGHT_CHANCE = 0.3;      // 生长中出现干旱的概率
const SEED_DROP_CHANCE = 0.16;   // 作物收获时额外掉落 1 颗对应种子的概率(鱼不再掉落鱼苗)
