/* ================= 牧场(鱼塘 + 牧栏)静态数据 =================
   本文件只放牧场页数据,不含逻辑。作物数据在 js/farm/data.js。 */

const FISH = {
   caoyu:            { name: '草鱼', cost: 2    , sell: 10   , grow: 60   , xp: 1   , level: 1, },
   lianyu:           { name: '鲢鱼', cost: 4    , sell: 20   , grow: 120  , xp: 2   , level: 2, },
   yongyu:           { name: '鳙鱼', cost: 10   , sell: 40   , grow: 300  , xp: 5   , level: 3, },
   qingyu:           { name: '青鱼', cost: 20   , sell: 100  , grow: 600  , xp: 10  , level: 4, },
   liyu:             { name: '鲤鱼', cost: 42   , sell: 210  , grow: 1200 , xp: 20  , level: 5, },
   jiyu:             { name: '鲫鱼', cost: 84   , sell: 420  , grow: 2400 , xp: 41  , level: 6, },
   luofeiyu:         { name: '罗非鱼', cost: 126  , sell: 600  , grow: 3600 , xp: 62  , level: 7, },
   wuchangyu:        { name: '武昌鱼', cost: 168  , sell: 840  , grow: 4800 , xp: 82  , level: 8, },
   bianyu:           { name: '鳊鱼', cost: 223  , sell: 1080 , grow: 6000 , xp: 106 , level: 9, },
   nianyu:           { name: '鲶鱼', cost: 268  , sell: 1320 , grow: 7200 , xp: 128 , level: 10, },
   huangsangyu:      { name: '黄颡鱼', cost: 335  , sell: 1600 , grow: 9000 , xp: 160 , level: 11, },
   wuli:             { name: '乌鳢', cost: 402  , sell: 2000 , grow: 10800, xp: 192 , level: 12, },
   guiyu:            { name: '鳜鱼', cost: 576  , sell: 2800 , grow: 14400, xp: 272 , level: 13, },
   jiazhoulu:        { name: '加州鲈', cost: 1152 , sell: 5600 , grow: 28800, xp: 544 , level: 14, },
   qiaozuibo:        { name: '翘嘴鲌', cost: 1728 , sell: 8600 , grow: 43200, xp: 816 , level: 15, },
   hongqibo:         { name: '红鳍鲌', cost: 3456 , sell: 17200, grow: 86400, xp: 1632, level: 16, },
   tuantoufang:      { name: '团头鲂', cost: 640  , sell: 3200 , grow: 14400, xp: 288 , level: 17, },
   lingyu:           { name: '鲮鱼', cost: 1280 , sell: 6400 , grow: 28800, xp: 576 , level: 18, },
   niqiu:            { name: '泥鳅', cost: 1920 , sell: 9600 , grow: 43200, xp: 864 , level: 19, },
   huangshan:        { name: '黄鳝', cost: 3840 , sell: 19200, grow: 86400, xp: 1728, level: 20, },
   manli:            { name: '鳗鲡', cost: 704  , sell: 3400 , grow: 14400, xp: 304 , level: 21, },
   jiayu:            { name: '甲鱼', cost: 1408 , sell: 7000 , grow: 28800, xp: 608 , level: 22, },
   hexie:            { name: '河蟹', cost: 2112 , sell: 10400, grow: 43200, xp: 912 , level: 23, },
   xiaolongxia:      { name: '小龙虾', cost: 4224 , sell: 21000, grow: 86400, xp: 1824, level: 24, },
   luoshizhaoxia:    { name: '罗氏沼虾', cost: 792  , sell: 3800 , grow: 14400, xp: 324 , level: 25, },
   qingxia:          { name: '青虾', cost: 1584 , sell: 7800 , grow: 28800, xp: 648 , level: 26, },
   tianluo:          { name: '田螺', cost: 2376 , sell: 11800, grow: 43200, xp: 972 , level: 27, },
   hebeng:           { name: '河蚌', cost: 4752 , sell: 23600, grow: 86400, xp: 1944, level: 28, },
   xunyu:            { name: '鲟鱼', cost: 888  , sell: 4400 , grow: 14400, xp: 344 , level: 29, },
   hongzun:          { name: '虹鳟', cost: 1776 , sell: 8800 , grow: 28800, xp: 688 , level: 30, },
   yinyu:            { name: '银鱼', cost: 2664 , sell: 13200, grow: 43200, xp: 1032, level: 31, },
   xiangyu:          { name: '香鱼', cost: 5328 , sell: 26600, grow: 86400, xp: 2064, level: 32, },
   hetun:            { name: '河豚', cost: 992  , sell: 4800 , grow: 14400, xp: 368 , level: 33, },
   shiyu:            { name: '鲥鱼', cost: 1984 , sell: 9800 , grow: 28800, xp: 736 , level: 34, },
   maisuiyu:         { name: '麦穗鱼', cost: 2976 , sell: 14800, grow: 43200, xp: 1104, level: 35, },
   chizhaogongyu:    { name: '池沼公鱼', cost: 5952 , sell: 29600, grow: 86400, xp: 2208, level: 36, },
   dingguiyu:        { name: '丁桂鱼', cost: 1120 , sell: 5600 , grow: 14400, xp: 392 , level: 37, },
   danshuishiban:    { name: '淡水石斑', cost: 2240 , sell: 11200, grow: 28800, xp: 784 , level: 38, },
   chiwenzun:        { name: '匙吻鲟', cost: 3360 , sell: 16800, grow: 43200, xp: 1176, level: 39, },
   yanzhiyu:         { name: '胭脂鱼', cost: 6720 , sell: 33600, grow: 86400, xp: 2352, level: 40, },
   junyu:            { name: '军鱼', cost: 1248 , sell: 6240 , grow: 14400, xp: 420 , level: 41, },
   guangchunyu:      { name: '光唇鱼', cost: 2496 , sell: 12480, grow: 28800, xp: 840 , level: 42, },
   chiyanzun:        { name: '赤眼鳟', cost: 3744 , sell: 18720, grow: 43200, xp: 1260, level: 43, },
   shatangli:        { name: '沙塘鳢', cost: 7488 , sell: 37440, grow: 86400, xp: 2520, level: 44, },
   banghuayu:        { name: '棒花鱼', cost: 1400 , sell: 7000 , grow: 14400, xp: 448 , level: 45, },
   baibangouyu:      { name: '白斑狗鱼', cost: 2800 , sell: 14000, grow: 28800, xp: 896 , level: 46, },
   jingli:           { name: '镜鲤', cost: 4200 , sell: 21000, grow: 43200, xp: 1344, level: 47, },
   jinli:            { name: '锦鲤', cost: 8400 , sell: 42000, grow: 86400, xp: 2688, level: 48, },
   jinyu:            { name: '金鱼', cost: 1560 , sell: 7800 , grow: 14400, xp: 476 , level: 49, },
   gehuzinian:       { name: '革胡子鲶', cost: 3120 , sell: 15600, grow: 28800, xp: 952 , level: 50, },
   bandianchaweiwei: { name: '斑点叉尾鮰', cost: 4680 , sell: 23400, grow: 43200, xp: 1428, level: 51, },
   dakounian:        { name: '大口鲶', cost: 9360 , sell: 46800, grow: 86400, xp: 2856, level: 52, },
   ganyu:            { name: '鳡鱼', cost: 1728 , sell: 8600 , grow: 14400, xp: 508 , level: 53, },
   luli:             { name: '鲈鲤', cost: 3456 , sell: 17200, grow: 28800, xp: 1016, level: 54, },
   yanyuanli:        { name: '岩原鲤', cost: 5184 , sell: 25800, grow: 43200, xp: 1524, level: 55, },
   qikouliefuyu:     { name: '齐口裂腹鱼', cost: 10368, sell: 51800, grow: 86400, xp: 3048, level: 56, },
   zheluoyu:         { name: '哲罗鱼', cost: 1920 , sell: 9600 , grow: 14400, xp: 540 , level: 57, },
   xilinyu:          { name: '细鳞鱼', cost: 3840 , sell: 19200, grow: 28800, xp: 1080, level: 58, },
   wawayu:           { name: '娃娃鱼', cost: 5760 , sell: 28800, grow: 43200, xp: 1620, level: 59, },
   zhonghuabie:      { name: '中华鳖', cost: 11520, sell: 57600, grow: 86400, xp: 3240, level: 60, },
};
/* ---------- 鱼塘:默认开放,无区域扩建条件 ----------
   鱼塘默认开放,初始 POND_INITIAL_OPEN 格直接可用;
   其余格每升 POND_EXPAND_INTERVAL 级花金币再开 1 格(共 TOTAL_PONDS 格),扩张格费用见 POND_CELL_UNLOCK_COST;
   新游戏赠送 POND_BONUS_COUNT 条鱼苗 ---------- */
const POND_OPEN_LEVEL = 5;      // 单格扩张扩建的起始等级基准(鱼塘本身无需此等级即可使用)
const POND_INITIAL_OPEN = 4;    // 默认开放的鱼塘格数(区域默认开放,初始即开放这些格)
const POND_EXPAND_INTERVAL = 2; // 每升多少级再开放 1 格鱼塘
const POND_CELL_UNLOCK_COST = [5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000]; // 扩张格(下标 4~11)扩建费用,60000 后每块 +20000
const POND_BONUS_FRY = 'caoyu'; // 新游戏赠送的鱼苗种类
const POND_BONUS_COUNT = 3;     // 赠送鱼苗数量
const POND_COLS = 4;            // 鱼塘列数
const POND_ROWS = 3;            // 鱼塘行数
const TOTAL_PONDS = POND_COLS * POND_ROWS; // 12 个鱼塘
const ANIMALS = {
   luhuaji:    { name: '芦花鸡', cost: 528  , grow: 14400, produceEvery: 1200 , product: 'luhuajip'   , xp: 549  , level: 1 },
   guifeiji:   { name: '贵妃鸡', cost: 1056 , grow: 28800, produceEvery: 2400 , product: 'guifeijip'  , xp: 1098 , level: 2 },
   huoji:      { name: '火鸡', cost: 1584 , grow: 43200, produceEvery: 3600 , product: 'huojip'     , xp: 1647 , level: 3 },
   ya:         { name: '鸭', cost: 3168 , grow: 86400, produceEvery: 7200 , product: 'yap'        , xp: 3294 , level: 4 },
   e:          { name: '鹅', cost: 582  , grow: 14400, produceEvery: 1200 , product: 'ep'         , xp: 576  , level: 5 },
   can:        { name: '蚕', cost: 1164 , grow: 28800, produceEvery: 2400 , product: 'canp'       , xp: 1152 , level: 6 },
   qiuyin:     { name: '蚯蚓', cost: 1746 , grow: 43200, produceEvery: 3600 , product: 'qiuyinp'    , xp: 1728 , level: 7 },
   ge:         { name: '鸽', cost: 3492 , grow: 86400, produceEvery: 7200 , product: 'gep'        , xp: 3456 , level: 8 },
   mifeng:     { name: '蜜蜂', cost: 638  , grow: 14400, produceEvery: 1200 , product: 'mifengp'    , xp: 600  , level: 9 },
   woniu:      { name: '蜗牛', cost: 1276 , grow: 28800, produceEvery: 2400 , product: 'woniup'     , xp: 1200 , level: 10 },
   tunshu:     { name: '豚鼠', cost: 1914 , grow: 43200, produceEvery: 3600 , product: 'tunshup'    , xp: 1800 , level: 11 },
   mao:        { name: '猫', cost: 3828 , grow: 86400, produceEvery: 7200 , product: 'maop'       , xp: 3600 , level: 12 },
   gou:        { name: '狗', cost: 696  , grow: 14400, produceEvery: 1200 , product: 'goup'       , xp: 630  , level: 13 },
   ritu:       { name: '肉兔', cost: 1392 , grow: 28800, produceEvery: 2400 , product: 'ritup'      , xp: 1260 , level: 14 },
   cangshu:    { name: '仓鼠', cost: 2088 , grow: 43200, produceEvery: 3600 , product: 'cangshup'   , xp: 1890 , level: 15 },
   angelatu:   { name: '安哥拉兔', cost: 4176 , grow: 86400, produceEvery: 7200 , product: 'angelatup'  , xp: 3780 , level: 16 },
   mianyang:   { name: '绵羊', cost: 760  , grow: 14400, produceEvery: 1200 , product: 'mianyangp'  , xp: 657  , level: 17 },
   shanyang:   { name: '山羊', cost: 1520 , grow: 28800, produceEvery: 2400 , product: 'shanyangp'  , xp: 1314 , level: 18 },
   zhu:        { name: '猪', cost: 2280 , grow: 43200, produceEvery: 3600 , product: 'zhup'       , xp: 1971 , level: 19 },
   lv:         { name: '驴', cost: 4560 , grow: 86400, produceEvery: 7200 , product: 'lvp'        , xp: 3942 , level: 20 },
   shuiniu:    { name: '水牛', cost: 824  , grow: 14400, produceEvery: 1200 , product: 'shuiniup'   , xp: 687  , level: 21 },
   huangniu:   { name: '黄牛', cost: 1648 , grow: 28800, produceEvery: 2400 , product: 'huangniup'  , xp: 1374 , level: 22 },
   ma:         { name: '马', cost: 2472 , grow: 43200, produceEvery: 3600 , product: 'map'        , xp: 2061 , level: 23 },
   nainiu:     { name: '奶牛', cost: 4944 , grow: 86400, produceEvery: 7200 , product: 'nainiup'    , xp: 4122 , level: 24 },
   maoniu:     { name: '牦牛', cost: 894  , grow: 14400, produceEvery: 1200 , product: 'maoniup'    , xp: 717  , level: 25 },
   wuji:       { name: '乌鸡', cost: 1788 , grow: 28800, produceEvery: 2400 , product: 'wujip'      , xp: 1434 , level: 26 },
   anchun:     { name: '鹌鹑', cost: 2682 , grow: 43200, produceEvery: 3600 , product: 'anchunp'    , xp: 2151 , level: 27 },
   xiangzhu:   { name: '香猪', cost: 5364 , grow: 86400, produceEvery: 7200 , product: 'xiangzhup'  , xp: 4302 , level: 28 },
   chuiertu:   { name: '垂耳兔', cost: 966  , grow: 14400, produceEvery: 1200 , product: 'chuiertup'  , xp: 747  , level: 29 },
   rouniu:     { name: '肉牛', cost: 1932 , grow: 28800, produceEvery: 2400 , product: 'rouniup'    , xp: 1494 , level: 30 },
   aizhongma:  { name: '矮种马', cost: 2898 , grow: 43200, produceEvery: 3600 , product: 'aizhongmap' , xp: 2241 , level: 31 },
   muyangquan: { name: '牧羊犬', cost: 5796 , grow: 86400, produceEvery: 7200 , product: 'muyangquanp', xp: 4482 , level: 32 },
   fanya:      { name: '番鸭', cost: 1040 , grow: 14400, produceEvery: 1200 , product: 'fanyap'     , xp: 780  , level: 33 },
   sanhuangji: { name: '三黄鸡', cost: 2080 , grow: 28800, produceEvery: 2400 , product: 'sanhuangjip', xp: 1560 , level: 34 },
   huyang:     { name: '湖羊', cost: 3120 , grow: 43200, produceEvery: 3600 , product: 'huyangp'    , xp: 2340 , level: 35 },
   tuoniao:    { name: '鸵鸟', cost: 6240 , grow: 86400, produceEvery: 7200 , product: 'tuoniaop'   , xp: 4680 , level: 36 },
   huli:       { name: '狐狸', cost: 1120 , grow: 14400, produceEvery: 1200 , product: 'hulip'      , xp: 813  , level: 37 },
   meihualu:   { name: '梅花鹿', cost: 2240 , grow: 28800, produceEvery: 2400 , product: 'meihualup'  , xp: 1626 , level: 38 },
   luotuo:     { name: '骆驼', cost: 1693 , grow: 43200, produceEvery: 3600 , product: 'luotuop'    , xp: 2439 , level: 39 },
   kongque:    { name: '孔雀', cost: 6720 , grow: 86400, produceEvery: 7200 , product: 'kongquep'   , xp: 4878 , level: 40 },
};
const ANIMAL_PRODUCTS = {
   /* 各动物产物(累计产出 ANIMAL_MAX_PRODUCE 次后收获进仓库) */
   luhuajip:    { name: '芦花鸡蛋', sell: 39 },
   guifeijip:   { name: '贵妃鸡蛋', sell: 79 },
   huojip:      { name: '火鸡蛋', sell: 118 },
   yap:         { name: '鸭蛋', sell: 237 },
   ep:          { name: '鹅蛋', sell: 43 },
   canp:        { name: '蚕丝', sell: 87 },
   qiuyinp:     { name: '蚯蚓粪', sell: 130 },
   gep:         { name: '鸽蛋', sell: 261 },
   mifengp:     { name: '蜂蜜', sell: 47 },
   woniup:      { name: '蜗牛肉', sell: 95 },
   tunshup:     { name: '豚鼠肉', sell: 143 },
   maop:        { name: '猫崽', sell: 287 },
   goup:        { name: '狗崽', sell: 52 },
   ritup:       { name: '兔肉', sell: 104 },
   cangshup:    { name: '仓鼠肉', sell: 156 },
   angelatup:   { name: '安哥拉兔毛', sell: 313 },
   mianyangp:   { name: '羊毛', sell: 57 },
   shanyangp:   { name: '羊奶', sell: 114 },
   zhup:        { name: '猪崽', sell: 171 },
   lvp:         { name: '驴奶', sell: 342 },
   shuiniup:    { name: '水牛奶', sell: 61 },
   huangniup:   { name: '牛崽', sell: 123 },
   map:         { name: '马奶', sell: 185 },
   nainiup:     { name: '牛奶', sell: 370 },
   maoniup:     { name: '牦牛奶', sell: 67 },
   wujip:       { name: '乌鸡蛋', sell: 134 },
   anchunp:     { name: '鹌鹑蛋', sell: 201 },
   xiangzhup:   { name: '猪崽', sell: 402 },
   chuiertup:   { name: '兔毛', sell: 72 },
   rouniup:     { name: '牛肉', sell: 144 },
   aizhongmap:  { name: '马奶', sell: 217 },
   muyangquanp: { name: '狗崽', sell: 434 },
   fanyap:      { name: '番鸭蛋', sell: 78 },
   sanhuangjip: { name: '三黄鸡蛋', sell: 156 },
   huyangp:     { name: '羊毛', sell: 234 },
   tuoniaop:    { name: '鸵鸟蛋', sell: 468 },
   hulip:       { name: '狐皮', sell: 84 },
   meihualup:   { name: '鹿茸', sell: 168 },
   luotuop:     { name: '驼奶', sell: 252 },
   kongquep:    { name: '孔雀蛋', sell: 504 },
   /* 成体动物(累计产出 ANIMAL_MAX_PRODUCE 次后收获进仓库,key 与 ANIMALS 相同) */
   luhuaji:    { name: '成芦花鸡', sell: 792 },
   guifeiji:   { name: '成贵妃鸡', sell: 1584 },
   huoji:      { name: '成火鸡', sell: 2376 },
   ya:         { name: '成鸭', sell: 4752 },
   e:          { name: '成鹅', sell: 873 },
   can:        { name: '成蚕', sell: 1746 },
   qiuyin:     { name: '成蚯蚓', sell: 2619 },
   ge:         { name: '成鸽', sell: 5238 },
   mifeng:     { name: '成蜜蜂', sell: 957 },
   woniu:      { name: '成蜗牛', sell: 1914 },
   tunshu:     { name: '成豚鼠', sell: 2871 },
   mao:        { name: '成猫', sell: 5742 },
   gou:        { name: '成狗', sell: 1044 },
   ritu:       { name: '成肉兔', sell: 2088 },
   cangshu:    { name: '成仓鼠', sell: 3132 },
   angelatu:   { name: '成安哥拉兔', sell: 6264 },
   mianyang:   { name: '成绵羊', sell: 1140 },
   shanyang:   { name: '成山羊', sell: 2280 },
   zhu:        { name: '成猪', sell: 3420 },
   lv:         { name: '成驴', sell: 6840 },
   shuiniu:    { name: '成水牛', sell: 1236 },
   huangniu:   { name: '成黄牛', sell: 2472 },
   ma:         { name: '成马', sell: 3708 },
   nainiu:     { name: '成奶牛', sell: 7416 },
   maoniu:     { name: '成牦牛', sell: 1341 },
   wuji:       { name: '成乌鸡', sell: 2682 },
   anchun:     { name: '成鹌鹑', sell: 4023 },
   xiangzhu:   { name: '成香猪', sell: 8046 },
   chuiertu:   { name: '成垂耳兔', sell: 1449 },
   rouniu:     { name: '成肉牛', sell: 2898 },
   aizhongma:  { name: '成矮种马', sell: 4347 },
   muyangquan: { name: '成牧羊犬', sell: 8694 },
   fanya:      { name: '成番鸭', sell: 1560 },
   sanhuangji: { name: '成三黄鸡', sell: 3120 },
   huyang:     { name: '成湖羊', sell: 4680 },
   tuoniao:    { name: '成鸵鸟', sell: 9360 },
   huli:       { name: '成狐狸', sell: 1680 },
   meihualu:   { name: '成梅花鹿', sell: 3360 },
   luotuo:     { name: '成骆驼', sell: 2540 },
   kongque:    { name: '成孔雀', sell: 10080 },
};
const ANIMAL_MAX_PRODUCE = 6;      // 动物成熟后可累计产出的次数,满后收获动物本体(产出进度自动累积,不收获也增加)
/* ---------- 养殖栏位:4 行 × 5 列共 20 格,初始开放 4 格,Lv.5 起每升 2 级花金币再开 1 格 ---------- */
const RANCH_TOTAL = 20;              // 栏位总数(4 行 × 5 列)
const RANCH_INITIAL_OPEN = 4;        // 初始开放栏位数
const RANCH_FIRST_LEVEL = 5;         // 扩张栏位起始等级
const RANCH_EXPAND_INTERVAL = 2;     // 每升多少级开放 1 格
const RANCH_UNLOCK_COST = [5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000]; // 扩张格(下标 4~19)扩建费用,60000 后每块 +20000
const FEED_COST = 10;                // 牧草单价(金币)
const FEED_TROUGH_CAP = 1000;        // 牧槽容量(牧草上限)
const FEED_EVERY = 2;                // 每产出 FEED_EVERY 个周期后需要喂食一次(饥饿间隔 = produceEvery*FEED_EVERY)

/* ---------- 牧场存档键 + 默认状态 ---------- */
const RANCH_SAVE_KEY = 'qqfarm_ranch_v1';

function makeDefaultRanch() {
    return {
        coins: 100,
        level: 1,
        xp: 0,
        pond: Array.from({ length: TOTAL_PONDS }, () => null), // 鱼塘 3×4 共 12 格
        unlockedPonds: Array.from({ length: TOTAL_PONDS }, (_, i) => i < POND_INITIAL_OPEN), // 各鱼塘格是否开放(默认开放前 N 格,其余花金币扩张)
        animals: Array.from({ length: RANCH_TOTAL }, () => null), // 养殖栏位
        unlockedRanches: Array.from({ length: RANCH_TOTAL }, (_, i) => i < RANCH_INITIAL_OPEN), // 各栏位是否开放
        feedTrough: 0,                 // 牧槽牧草量(上限 FEED_TROUGH_CAP)
        inventory: { young: {} }, // items/locks 来自共享段
        fish: { fries: { [POND_BONUS_FRY]: POND_BONUS_COUNT } }, // 新游戏赠送鱼苗;成鱼收获后进 inventory.items
        log: [{ t: Date.now(), msg: '欢迎来到 星露谷牧场!鱼塘养鱼、牧栏养动物,产出需在商店购买鱼苗/幼崽,牧草可在牧场商店购买或农场种植草籽获得。' }],
    };
}
