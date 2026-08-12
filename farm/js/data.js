/* ================= 静态数据 =================
   本文件只放数据,不含游戏逻辑。
   种子/鱼苗 的解锁等级已并入各自对象(见 level 字段);
   地块为按下标索引的等级/费用数组,按固定间隔生成:
   - 种子解锁:每升 1 级解锁 1 种,按商店顺序从 Lv.1 起依次开放
   - 地块间隔:初始 6 块免费;第 7 块起 5 级开放,每升 2 级再扩 1 块
   - 地块费用:5000 起,60000 后每块 +20000 */

/* ---------- 作物数据(名称/种子价/售出价/成熟秒数/经验/解锁等级) ---------- */
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
   mogu:         { name: '蘑菇', cost: 3168 , sell: 15600 , grow: 21600 , xp: 858 , level: 61, },
   boluo:        { name: '菠萝', cost: 6336 , sell: 31600 , grow: 43200 , xp: 1716, level: 62, },
   ruozhu:       { name: '箬竹', cost: 9504 , sell: 47200 , grow: 64800 , xp: 2574, level: 63, },
   wuhuaguo:     { name: '无花果', cost: 19008, sell: 94800 , grow: 129600, xp: 5148, level: 64, },
   yezi:         { name: '椰子', cost: 3492 , sell: 17200 , grow: 21600 , xp: 912 , level: 65, },
   huasheng:     { name: '花生', cost: 6984 , sell: 34800 , grow: 43200 , xp: 1824, level: 66, },
   jinzhengu:    { name: '金针菇', cost: 10476, sell: 52000 , grow: 64800 , xp: 2736, level: 67, },
   hulu:         { name: '葫芦', cost: 20952, sell: 104400, grow: 129600, xp: 5472, level: 68, },
   mihoutao:     { name: '猕猴桃', cost: 3828 , sell: 18800 , grow: 21600 , xp: 960 , level: 69, },
   li:           { name: '梨', cost: 7656 , sell: 38000 , grow: 43200 , xp: 1920, level: 70, },
   shuilian:     { name: '睡莲', cost: 11484, sell: 57200 , grow: 64800 , xp: 2880, level: 71, },
   huolongguo:   { name: '火龙果', cost: 22968, sell: 114800, grow: 129600, xp: 5760, level: 72, },
   pipa:         { name: '枇杷', cost: 4176 , sell: 20800 , grow: 21600 , xp: 1020, level: 73, },
   yingtao:      { name: '樱桃', cost: 8352 , sell: 41600 , grow: 43200 , xp: 2040, level: 74, },
   lizi2:        { name: '李子', cost: 12528, sell: 62400 , grow: 64800 , xp: 3060, level: 75, },
   lizhi:        { name: '荔枝', cost: 25056, sell: 125200, grow: 129600, xp: 6120, level: 76, },
   xianggua:     { name: '香瓜', cost: 4560 , sell: 22800 , grow: 21600 , xp: 1074, level: 77, },
   mugua:        { name: '木瓜', cost: 9120 , sell: 45600 , grow: 43200 , xp: 2148, level: 78, },
   guiyuan:      { name: '桂圆', cost: 13680, sell: 68400 , grow: 64800 , xp: 3222, level: 79, },
   yueshi:       { name: '月柿', cost: 27360, sell: 136800, grow: 129600, xp: 6444, level: 80, },
   yangtao:      { name: '杨桃', cost: 4944 , sell: 24400 , grow: 21600 , xp: 1134, level: 81, },
   hamigua:      { name: '哈密瓜', cost: 9888 , sell: 49200 , grow: 43200 , xp: 2268, level: 82, },
   sangshen:     { name: '桑葚', cost: 14832, sell: 74000 , grow: 64800 , xp: 3402, level: 83, },
   ningmeng:     { name: '柠檬', cost: 29664, sell: 148000, grow: 129600, xp: 6804, level: 84, },
   mangguo:      { name: '芒果', cost: 5364 , sell: 26800 , grow: 21600 , xp: 1194, level: 85, },
   yangmei:      { name: '杨梅', cost: 10728, sell: 53600 , grow: 43200 , xp: 2388, level: 86, },
   liulian:      { name: '榴莲', cost: 16092, sell: 80400 , grow: 64800 , xp: 3582, level: 87, },
   fanshiliu:    { name: '番石榴', cost: 32184, sell: 160800, grow: 129600, xp: 7164, level: 88, },
   pingzishu:    { name: '瓶子树', cost: 5796 , sell: 28800 , grow: 21600 , xp: 1254, level: 89, },
   lanmei:       { name: '蓝莓', cost: 11592, sell: 57600 , grow: 43200 , xp: 2508, level: 90, },
   zhulongcao:   { name: '猪笼草', cost: 17388, sell: 86800 , grow: 64800 , xp: 3762, level: 91, },
   shanzhu:      { name: '山竹', cost: 34776, sell: 173600, grow: 129600, xp: 7524, level: 92, },
   mantuoluohua: { name: '曼陀罗华', cost: 6240 , sell: 31200 , grow: 21600 , xp: 1320, level: 93, },
   manzhusahua:  { name: '曼珠沙华', cost: 12480, sell: 62400 , grow: 43200 , xp: 2640, level: 94, },
   kugua:        { name: '苦瓜', cost: 18720, sell: 93600 , grow: 64800 , xp: 3960, level: 95, },
   tiantangniao: { name: '天堂鸟', cost: 37440, sell: 187200, grow: 129600, xp: 7920, level: 96, },
   donggua:      { name: '冬瓜', cost: 6720 , sell: 33600 , grow: 21600 , xp: 1386, level: 97, },
   baopihua:     { name: '豹皮花', cost: 13440, sell: 67200 , grow: 43200 , xp: 2772, level: 98, },
   xingzi:       { name: '杏子', cost: 10160, sell: 100800, grow: 64800 , xp: 4158, level: 99, },
   jinju:        { name: '金桔', cost: 40320, sell: 201600, grow: 129600, xp: 8316, level: 100, },
};

/* ---------- 鱼塘:鱼数据(名称/鱼苗价/售出价/生长秒数/经验/解锁等级) ----------
   与作物同一套三定位平衡思路:按解锁顺序循环 快收/暴利/经验,互不碾压。
   level = 解锁等级(从 Lv.1 起每升 1 级解锁 1 种,按商店顺序依次开放) */
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

/* ---------- 地块解锁等级(按地块下标,共 24 块)
   前 6 块(下标 0-5)初始解锁;第 7 块起 5 级开放,每升 2 级再扩 1 块 ---------- */
const PLOT_LEVEL_REQ = [1, 1, 1, 1, 1, 1, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];

/* ---------- 地块解锁费用(金币,按地块下标;5000 起,60000 后每块 +20000) ---------- */
const PLOT_UNLOCK_COST = [0, 0, 0, 0, 0, 0, 5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000, 220000, 240000, 260000, 280000, 300000];

/* ---------- 鱼塘:默认开放,无区域解锁条件 ----------
   鱼塘默认开放,初始 POND_INITIAL_OPEN 格直接可用;
   其余格每升 POND_EXPAND_INTERVAL 级花金币再开 1 格(共 TOTAL_PONDS 格),扩张格费用见 POND_CELL_UNLOCK_COST;
   新游戏赠送 POND_BONUS_COUNT 条鱼苗 ---------- */
const POND_OPEN_LEVEL = 5;      // 单格扩张解锁的起始等级基准(鱼塘本身无需此等级即可使用)
const POND_INITIAL_OPEN = 4;    // 默认开放的鱼塘格数(区域默认开放,初始即开放这些格)
const POND_EXPAND_INTERVAL = 2; // 每升多少级再开放 1 格鱼塘
const POND_CELL_UNLOCK_COST = [5000, 10000, 20000, 30000, 40000, 60000, 80000, 100000]; // 扩张格(下标 4~11)解锁费用,60000 后每块 +20000
const POND_BONUS_FRY = 'caoyu'; // 新游戏赠送的鱼苗种类
const POND_BONUS_COUNT = 3;     // 赠送鱼苗数量
const POND_COLS = 4;            // 鱼塘列数
const POND_ROWS = 3;            // 鱼塘行数
const TOTAL_PONDS = POND_COLS * POND_ROWS; // 12 个鱼塘

/* ---------- 养殖:动物数据(幼崽价/生长秒数/产出间隔秒数/产物/经验/解锁等级)
   成熟后持续产出:每 produceEvery 秒产 1 个产物,累计 ANIMAL_MAX_PRODUCE 次后可收获动物本体进仓库;
   产出次数 10→6,每次间隔相应上调 5/3 倍,总产出时长不变;
   牧槽不空时每 FEED_EVERY 个周期自动消耗 1 牧草,缺草时生长/产出暂停 ---------- */
const ANIMALS = {
   luhuaji:    { name: '芦花鸡', cost: 3168 , grow: 14400, produceEvery: 7200, product: 'luhuajip'   , xp: 3003 , level: 10 },
   guifeiji:   { name: '贵妃鸡', cost: 6336 , grow: 28800, produceEvery: 14400, product: 'guifeijip'  , xp: 6006 , level: 11 },
   huoji:      { name: '火鸡', cost: 9504 , grow: 43200, produceEvery: 21600, product: 'huojip'     , xp: 9009 , level: 12 },
   ya:         { name: '鸭', cost: 19008, grow: 86400, produceEvery: 43200, product: 'yap'        , xp: 18018, level: 13 },
   e:          { name: '鹅', cost: 3492 , grow: 14400, produceEvery: 7200, product: 'ep'         , xp: 3192 , level: 14 },
   can:        { name: '蚕', cost: 6984 , grow: 28800, produceEvery: 14400, product: 'canp'       , xp: 6384 , level: 15 },
   qiuyin:     { name: '蚯蚓', cost: 10476, grow: 43200, produceEvery: 21600, product: 'qiuyinp'    , xp: 9576 , level: 16 },
   ge:         { name: '鸽', cost: 20952, grow: 86400, produceEvery: 43200, product: 'gep'        , xp: 19152, level: 17 },
   mifeng:     { name: '蜜蜂', cost: 3828 , grow: 14400, produceEvery: 7200, product: 'mifengp'    , xp: 3360 , level: 18 },
   woniu:      { name: '蜗牛', cost: 7656 , grow: 28800, produceEvery: 14400, product: 'woniup'     , xp: 6720 , level: 19 },
   tunshu:     { name: '豚鼠', cost: 11484, grow: 43200, produceEvery: 21600, product: 'tunshup'    , xp: 10080, level: 20 },
   mao:        { name: '猫', cost: 22968, grow: 86400, produceEvery: 43200, product: 'maop'       , xp: 20160, level: 21 },
   gou:        { name: '狗', cost: 4176 , grow: 14400, produceEvery: 7200, product: 'goup'       , xp: 3570 , level: 22 },
   ritu:       { name: '肉兔', cost: 8352 , grow: 28800, produceEvery: 14400, product: 'ritup'      , xp: 7140 , level: 23 },
   cangshu:    { name: '仓鼠', cost: 12528, grow: 43200, produceEvery: 21600, product: 'cangshup'   , xp: 10710, level: 24 },
   angelatu:   { name: '安哥拉兔', cost: 25056, grow: 86400, produceEvery: 43200, product: 'angelatup'  , xp: 21420, level: 25 },
   mianyang:   { name: '绵羊', cost: 4560 , grow: 14400, produceEvery: 7200, product: 'mianyangp'  , xp: 3759 , level: 26 },
   shanyang:   { name: '山羊', cost: 9120 , grow: 28800, produceEvery: 14400, product: 'shanyangp'  , xp: 7518 , level: 27 },
   zhu:        { name: '猪', cost: 13680, grow: 43200, produceEvery: 21600, product: 'zhup'       , xp: 11277, level: 28 },
   lv:         { name: '驴', cost: 27360, grow: 86400, produceEvery: 43200, product: 'lvp'        , xp: 22554, level: 29 },
   shuiniu:    { name: '水牛', cost: 4944 , grow: 14400, produceEvery: 7200, product: 'shuiniup'   , xp: 3969 , level: 30 },
   huangniu:   { name: '黄牛', cost: 9888 , grow: 28800, produceEvery: 14400, product: 'huangniup'  , xp: 7938 , level: 31 },
   ma:         { name: '马', cost: 14832, grow: 43200, produceEvery: 21600, product: 'map'        , xp: 11907, level: 32 },
   nainiu:     { name: '奶牛', cost: 29664, grow: 86400, produceEvery: 43200, product: 'nainiup'    , xp: 23814, level: 33 },
   maoniu:     { name: '牦牛', cost: 5364 , grow: 14400, produceEvery: 7200, product: 'maoniup'    , xp: 4179 , level: 34 },
   wuji:       { name: '乌鸡', cost: 10728, grow: 28800, produceEvery: 14400, product: 'wujip'      , xp: 8358 , level: 35 },
   anchun:     { name: '鹌鹑', cost: 16092, grow: 43200, produceEvery: 21600, product: 'anchunp'    , xp: 12537, level: 36 },
   xiangzhu:   { name: '香猪', cost: 32184, grow: 86400, produceEvery: 43200, product: 'xiangzhup'  , xp: 25074, level: 37 },
   chuiertu:   { name: '垂耳兔', cost: 5796 , grow: 14400, produceEvery: 7200, product: 'chuiertup'  , xp: 4389 , level: 38 },
   rouniu:     { name: '肉牛', cost: 11592, grow: 28800, produceEvery: 14400, product: 'rouniup'    , xp: 8778 , level: 39 },
   aizhongma:  { name: '矮种马', cost: 17388, grow: 43200, produceEvery: 21600, product: 'aizhongmap' , xp: 13167, level: 40 },
   muyangquan: { name: '牧羊犬', cost: 34776, grow: 86400, produceEvery: 43200, product: 'muyangquanp', xp: 26334, level: 41 },
   fanya:      { name: '番鸭', cost: 6240 , grow: 14400, produceEvery: 7200, product: 'fanyap'     , xp: 4620 , level: 42 },
   sanhuangji: { name: '三黄鸡', cost: 12480, grow: 28800, produceEvery: 14400, product: 'sanhuangjip', xp: 9240 , level: 43 },
   huyang:     { name: '湖羊', cost: 18720, grow: 43200, produceEvery: 21600, product: 'huyangp'    , xp: 13860, level: 44 },
   tuoniao:    { name: '鸵鸟', cost: 37440, grow: 86400, produceEvery: 43200, product: 'tuoniaop'   , xp: 27720, level: 45 },
   huli:       { name: '狐狸', cost: 6720 , grow: 14400, produceEvery: 7200, product: 'hulip'      , xp: 4851 , level: 46 },
   meihualu:   { name: '梅花鹿', cost: 13440, grow: 28800, produceEvery: 14400, product: 'meihualup'  , xp: 9702 , level: 47 },
   luotuo:     { name: '骆驼', cost: 20160, grow: 43200, produceEvery: 21600, product: 'luotuop'    , xp: 14553, level: 48 },
   kongque:    { name: '孔雀', cost: 40320, grow: 86400, produceEvery: 43200, product: 'kongquep'   , xp: 29106, level: 49 },
};

/* 动物产物与成体(与收获物同仓库,统一出售);牧草作为商品存在仓库,手动添入牧槽 */
const ANIMAL_PRODUCTS = {
   siliao:    { name: '牧草', sell: 2   },
   /* 各动物产物(累计产出 ANIMAL_MAX_PRODUCE 次后收获进仓库) */
   luhuajip:    { name: '芦花鸡蛋', sell: 7800 },
   guifeijip:   { name: '贵妃鸡蛋', sell: 16454 },
   huojip:      { name: '火鸡蛋', sell: 25469 },
   yap:         { name: '鸭蛋', sell: 52801 },
   ep:          { name: '鹅蛋', sell: 9857 },
   canp:        { name: '蚕丝', sell: 20464 },
   qiuyinp:     { name: '蚯蚓粪', sell: 31307 },
   gep:         { name: '鸽蛋', sell: 64229 },
   mifengp:     { name: '蜂蜜', sell: 11800 },
   woniup:      { name: '蜗牛肉', sell: 24296 },
   tunshup:     { name: '豚鼠肉', sell: 37209 },
   maop:        { name: '猫崽', sell: 75895 },
   goup:        { name: '狗崽', sell: 13961 },
   ritup:       { name: '兔肉', sell: 28324 },
   cangshup:    { name: '仓鼠肉', sell: 43063 },
   angelatup:   { name: '安哥拉兔毛', sell: 87511 },
   mianyangp:   { name: '羊毛', sell: 16131 },
   shanyangp:   { name: '羊奶', sell: 32635 },
   zhup:        { name: '猪崽', sell: 49493 },
   lvp:         { name: '驴奶', sell: 100028 },
   shuiniup:    { name: '水牛奶', sell: 18021 },
   huangniup:   { name: '牛崽', sell: 36687 },
   map:         { name: '马奶', sell: 55691 },
   nainiup:     { name: '牛奶', sell: 112370 },
   maoniup:     { name: '牦牛奶', sell: 20522 },
   wujip:       { name: '乌鸡蛋', sell: 41381 },
   anchunp:     { name: '鹌鹑蛋', sell: 62563 },
   xiangzhup:   { name: '猪崽', sell: 126083 },
   chuiertup:   { name: '兔毛', sell: 22749 },
   rouniup:     { name: '牛肉', sell: 45823 },
   aizhongmap:  { name: '马奶', sell: 69529 },
   muyangquanp: { name: '狗崽', sell: 139990 },
   fanyap:      { name: '番鸭蛋', sell: 25323 },
   sanhuangjip: { name: '三黄鸡蛋', sell: 50964 },
   huyangp:     { name: '羊毛', sell: 76914 },
   tuoniaop:    { name: '鸵鸟蛋', sell: 154741 },
   hulip:       { name: '狐皮', sell: 27934 },
   meihualup:   { name: '鹿茸', sell: 56182 },
   luotuop:     { name: '驼奶', sell: 84735 },
   kongquep:    { name: '孔雀蛋', sell: 170372 },
   /* 成体动物(累计产出 ANIMAL_MAX_PRODUCE 次后收获进仓库,key 与 ANIMALS 相同) */
   luhuaji:    { name: '成芦花鸡', sell: 2112 },
   guifeiji:   { name: '成贵妃鸡', sell: 4224 },
   huoji:      { name: '成火鸡', sell: 6336 },
   ya:         { name: '成鸭', sell: 12672 },
   e:          { name: '成鹅', sell: 2328 },
   can:        { name: '成蚕', sell: 4656 },
   qiuyin:     { name: '成蚯蚓', sell: 6984 },
   ge:         { name: '成鸽', sell: 13968 },
   mifeng:     { name: '成蜜蜂', sell: 2552 },
   woniu:      { name: '成蜗牛', sell: 5104 },
   tunshu:     { name: '成豚鼠', sell: 7656 },
   mao:        { name: '成猫', sell: 15312 },
   gou:        { name: '成狗', sell: 2784 },
   ritu:       { name: '成肉兔', sell: 5568 },
   cangshu:    { name: '成仓鼠', sell: 8352 },
   angelatu:   { name: '成安哥拉兔', sell: 16704 },
   mianyang:   { name: '成绵羊', sell: 3040 },
   shanyang:   { name: '成山羊', sell: 6080 },
   zhu:        { name: '成猪', sell: 9120 },
   lv:         { name: '成驴', sell: 18240 },
   shuiniu:    { name: '成水牛', sell: 3296 },
   huangniu:   { name: '成黄牛', sell: 6592 },
   ma:         { name: '成马', sell: 9888 },
   nainiu:     { name: '成奶牛', sell: 19776 },
   maoniu:     { name: '成牦牛', sell: 3576 },
   wuji:       { name: '成乌鸡', sell: 7152 },
   anchun:     { name: '成鹌鹑', sell: 10728 },
   xiangzhu:   { name: '成香猪', sell: 21456 },
   chuiertu:   { name: '成垂耳兔', sell: 3864 },
   rouniu:     { name: '成肉牛', sell: 7728 },
   aizhongma:  { name: '成矮种马', sell: 11592 },
   muyangquan: { name: '成牧羊犬', sell: 23184 },
   fanya:      { name: '成番鸭', sell: 4160 },
   sanhuangji: { name: '成三黄鸡', sell: 8320 },
   huyang:     { name: '成湖羊', sell: 12480 },
   tuoniao:    { name: '成鸵鸟', sell: 24960 },
   huli:       { name: '成狐狸', sell: 4480 },
   meihualu:   { name: '成梅花鹿', sell: 8960 },
   luotuo:     { name: '成骆驼', sell: 13440 },
   kongque:    { name: '成孔雀', sell: 26880 },
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
const SEED_DROP_CHANCE = 0.08;   // 作物收获时额外掉落 1 颗对应种子的概率(鱼不再掉落鱼苗)
