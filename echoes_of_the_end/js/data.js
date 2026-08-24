// ============ 游戏数据（独立于逻辑，供 app.js 引用） ============
var GameData = {
    // ===== 时间规则 =====
    secondsPerMinute: 60,
    minutesPerHour: 60,
    hoursPerDay: 24,
    daysPerSeason: 30,
    // 时间流速：1 现实秒推进多少游戏秒（1 游戏天 = 现实 2 小时）
    realSecondToGameSecond: 12,

    // ===== 初始进度 =====
    startHour: 6,           // 开局时间：秋季第 1 天 6:00
    startWeather: '晴',
    startScene: 'safehouse',

    // ===== 存档 =====
    saveKey: 'echoes_of_the_end_save',

    // 季节：秋 → 冬 → 春 → 夏，每季 30 天，从秋季开始
    seasons: [
        { name: '秋', icon: '🍂' },
        { name: '冬', icon: '❄️' },
        { name: '春', icon: '🌱' },
        { name: '夏', icon: '☀️' }
    ],
    // 各季节基准温度（°C）
    seasonBaseTemp: [15, -2, 12, 28],

    // 天气图标
    weatherIcon: {
        '晴': '☀️', '多云': '⛅', '阴天': '☁️',
        '中雨': '🌦️', '大雨': '🌧️', '暴雨': '⛈️',
        '雪': '❄️', '大风': '🌬️'
    },
    // 天气对温度的修正（°C）
    weatherTempAdj: {
        '晴': 1, '多云': 0, '阴天': -1,
        '中雨': -2, '大雨': -3, '暴雨': -4,
        '雪': -3, '大风': -2
    },
    // 各季节天气权重表：[秋, 冬, 春, 夏]，每天 0 点按此随机一次
    weatherTable: [
        [ // 秋
            { n: '晴', w: 30 }, { n: '多云', w: 25 }, { n: '阴天', w: 15 },
            { n: '中雨', w: 15 }, { n: '大雨', w: 10 }, { n: '大风', w: 5 }
        ],
        [ // 冬
            { n: '雪', w: 35 }, { n: '阴天', w: 20 }, { n: '多云', w: 15 },
            { n: '晴', w: 10 }, { n: '大风', w: 10 }, { n: '中雨', w: 5 }, { n: '大雨', w: 5 }
        ],
        [ // 春
            { n: '晴', w: 25 }, { n: '多云', w: 25 }, { n: '阴天', w: 15 },
            { n: '中雨', w: 15 }, { n: '大雨', w: 10 }, { n: '大风', w: 5 }, { n: '暴雨', w: 5 }
        ],
        [ // 夏
            { n: '晴', w: 30 }, { n: '多云', w: 20 }, { n: '阴天', w: 10 },
            { n: '中雨', w: 10 }, { n: '大雨', w: 15 }, { n: '暴雨', w: 10 }, { n: '大风', w: 5 }
        ]
    ],
    // 雨水收集器自动收集速率（份/游戏小时）：雨量越大收集越快
    rainRates: {
        '中雨': 10,
        '大雨': 30,
        '暴雨': 60
    },

    // 玩家初始状态（生命/饱食/水分/理智/健康/力量/速度/知识/经验）
    initialStats: {
        hp: 200, hunger: 150, water: 150, sanity: 200,
        health: 100, strength: 1, speed: 1, knowledge: 0, exp: 0
    },

    // 安全屋家具（desc：点击后模态框显示的说明；家具[0] 为「床」，含等级与升级配置）
    furniture: [
        {
            icon: '🛏️', name: '床', unlocked: true, isBed: true,
            bedLevel: 0,
            // 四级状态、三次升级；recover 为恢复倍率，upgrade 为升到下一级所需材料（最高级为 null）
            bedLevels: [
                { name: '草席',     recover: 1.0, upgrade: { '木板': 2 } },
                { name: '简易睡袋', recover: 1.3, upgrade: { '木板': 4, '布料': 2 } },
                { name: '木板床',   recover: 1.6, upgrade: { '木板': 8, '布料': 4 } },
                { name: '席梦思',   recover: 2.0, upgrade: null }
            ]
        },
        { icon: '🔥', name: '篝火', unlocked: true, isFireplace: true, desc: '取暖、照明，驱散黑夜的寒意。',
          // 两级设施、一次升级；hoursPerWood 为每块木板燃烧小时数，upgrade 为升到下一级所需材料（最高级为 null）
          fireLevel: 0,
          fireLevels: [
              { name: '石头篝火', hoursPerWood: 1, upgrade: { '石头': 3, '金属废料': 2 } },
              { name: '火炉',     hoursPerWood: 2, upgrade: null }
          ] },
        { icon: '🛠️', name: '工作台', unlocked: true, isWorkbench: true,
          // 折叠分区：武器 / 工具 / 防具 / 药品 / 食物 / 加工，每个蓝图含产物类型与所需材料
          // axe 标记斧头类工具（砍树必需）；碗/杯子为消耗性容器（烹饪锅做菜需碗、榨汁需杯子）
          blueprints: {
              weapon: [
                  { name: '木矛',   type: 'weapon', damage: 10, durability: 25, cost: { '木板': 1, '布料': 1 } },
                  { name: '金属矛', type: 'weapon', damage: 14, durability: 45, cost: { '铁': 2, '木板': 1 } },
                  { name: '棒球棒', type: 'weapon', damage: 12, durability: 35, cost: { '木板': 3 } },
                  { name: '大砍刀', type: 'weapon', damage: 18, durability: 60, cost: { '铁': 2, '金属废料': 1 } },
                  { name: '弓',     type: 'weapon', damage: 12, cost: { '木板': 2, '绳子': 1 } },
                  { name: '燃烧瓶', type: 'weapon', damage: 30, durability: 2, cost: { '火药': 1, '木板': 1, '布料': 1 }, desc: '投掷造成高额伤害，耐久低，用几次即毁。' }
              ],
              tool: [
                  { name: '石斧', type: 'tool', axe: true, durability: 30, cost: { '石头': 2, '木板': 1 } },
                  { name: '铁斧', type: 'tool', axe: true, durability: 50, cost: { '铁': 2, '木板': 1 } },
                  { name: '铁锹', type: 'tool', durability: 30, cost: { '铁': 1, '木板': 1 } },
                  { name: '镐',   type: 'tool', durability: 50, cost: { '铁': 2, '木板': 1 } },
                  { name: '鱼竿', type: 'tool', durability: 25, cost: { '木板': 2, '绳子': 1 } },
                  { name: '撬棍', type: 'tool', durability: 40, cost: { '铁': 2, '木板': 1 } }
              ],
              armor: [
                  { name: '木甲',   type: 'armor', defense: 2, durability: 30, cost: { '木板': 2, '绳子': 1 } },
                  { name: '金属甲', type: 'armor', defense: 4, durability: 60, cost: { '铁': 2, '绳子': 2 } },
                  { name: '布甲',   type: 'armor', defense: 1, durability: 25, cost: { '布料': 2, '绳子': 1 } }
              ],
              medicine: [
                  { name: '绷带', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 15, max: 100 }, cost: { '布料': 1 } },
                  { name: '药膏', type: 'medicine', cost: { '草药': 2 } }
              ],
              food: [
                  { name: '碗',   type: 'tool', cost: { '黏土': 2 } },
                  { name: '杯子', type: 'tool', cost: { '塑料': 2 } },
                  { name: '锅',   type: 'tool', cost: { '铁': 2, '木板': 1 }, desc: '烹饪锅升级用，也可在灶台做菜。' }
              ],
              process: [
                  // count 为单次制作产出数量（加工类批量产出）
                  { name: '木板',   type: 'material', count: 4, cost: { '原木': 1 } },
                  { name: '砖头',   type: 'material', count: 4, cost: { '黏土': 2, '沙子': 1 } },
                  { name: '绳子',   type: 'material', count: 2, cost: { '布料': 2 } },
                  { name: '钉子',   type: 'material', count: 10, cost: { '铁': 1 } },
                  { name: '电路板', type: 'material', count: 1, cost: { '铜': 2, '塑料': 2 } },
                  { name: '电池',   type: 'material', count: 1, cost: { '电路板': 1, '金属废料': 2 } },
                  { name: '螺栓',   type: 'material', count: 1, cost: { '铁': 1 } },
                  { name: '铰链',   type: 'material', count: 1, cost: { '铁': 1 } },
                  { name: '箭',     type: 'material', count: 6, cost: { '木板': 1, '铁': 1 } },
                  { name: '火药',   type: 'material', count: 1, cost: { '硝石': 2 }, desc: '硝石加工的火药，用于制作燃烧瓶。' }
              ]
          } },
        { icon: '🍳', name: '简易灶台', unlocked: false, isStove: true, unlockCost: { '砖头': 2 },
          // 两级灶台、一次升级；0 级可加热食物/净水，1 级（烹饪锅）额外解锁菜谱做饭
          stoveLevel: 0,
          stoveLevels: [
              { name: '简易灶台', upgrade: { '锅': 1 } },
              { name: '烹饪锅',   upgrade: null }
          ] },
        { icon: '🚿', name: '雨水收集器', unlocked: false, isRainCollector: true, rainWater: 0, unlockCost: { '木板': 2, '塑料': 1, '布料': 1 },
          // 五级设施、四次升级；升级只增加容量（每级 capacity）；以木板/塑料/布料制造
          rainLevel: 0,
          rainLevels: [
              { name: '简易桶',   capacity: 200,  upgrade: { '木板': 3, '塑料': 1, '布料': 1 } },
              { name: '塑料罐',   capacity: 400,  upgrade: { '木板': 4, '塑料': 2, '布料': 2 } },
              { name: '集水桶',   capacity: 800,  upgrade: { '木板': 6, '塑料': 3, '布料': 3 } },
              { name: '蓄水塔',   capacity: 1600, upgrade: { '木板': 8, '塑料': 4, '布料': 4 } },
              { name: '巨型水槽', capacity: 3200, upgrade: null }
          ] },
        { icon: '📦', name: '仓库', unlocked: true, isStorage: true,
          // 四级存储设施、三次升级；容量固定 200 格，升级只提升每槽堆叠上限（stack）
          storageLevel: 0,
          storageLevels: [
              { name: '储物箱',   capacity: 200, stack: 20,  upgrade: { '木板': 5, '螺栓': 1 } },
              { name: '大储藏柜', capacity: 200, stack: 40,  upgrade: { '木板': 8, '铁': 2, '螺栓': 2 } },
              { name: '储藏间',   capacity: 200, stack: 60,  upgrade: { '木板': 15, '铁': 4, '螺栓': 3 } },
              { name: '仓库',     capacity: 200, stack: 100, upgrade: null }
          ] },
        { icon: '🥤', name: '榨汁机', unlocked: false, isJuicer: true, unlockCost: { '木板': 6, '塑料': 10, '电路板': 1, '螺栓': 1 }, desc: '把蔬果榨成营养饮品，留住维生素。' },
        { icon: '🏭', name: '熔炉', unlocked: false, isFurnace: true, unlockCost: { '木板': 4, '砖头': 6, '铁': 2, '钉子': 6 }, desc: '以木板为燃料，6 个加工槽可同时熔炼，将垃圾/金属废料炼成塑料与铁。' },
        { icon: '🌱', name: '种植园', unlocked: false, isPlantation: true, unlockCost: { '木板': 6, '钉子': 2, '螺栓': 1, '黏土': 4 },
          // 三级种植设施、两次升级；slots 为可同时种植的槽位数（0 级 2 槽，之后每级 +2 槽）
          plantationLevel: 0,
          plantationLevels: [
              { name: '简易苗圃', slots: 2, upgrade: { '木板': 4, '黏土': 3, '钉子': 1 } },
              { name: '菜园',     slots: 4, upgrade: { '木板': 8, '黏土': 6, '钉子': 2, '螺栓': 1 } },
              { name: '大种植园', slots: 6, upgrade: null }
          ] },
    ],

    // 床：睡觉时每小时基础恢复量（倍率 1.0×）与各属性上限（等级越高倍率越大，恢复越快）
    bedSleep: {
        base: { hp: 8, sanity: 20 },
        max:  { hp: 200, sanity: 200 }
    },

    // 丧尸：移动路上遇敌后自动战斗；hp 血量 / atk 攻击 / exp 击杀经验；无暴击、不考虑防御
    zombies: {
        weak:   { name: '弱小丧尸', icon: '🧟', hp: 15, atk: 4,  exp: 8 },
        normal: { name: '普通丧尸', icon: '🧟', hp: 30, atk: 7,  exp: 15 },
        fat:    { name: '臃肿丧尸', icon: '🧟', hp: 60, atk: 10, exp: 30 }
    },

    // 地点搜刮：按地点类型定义掉落池与搜刮次数上限（搜刮 1 次随机掉 1 件，按权重 w 占比）
    // 掉落以基础材料（布料/垃圾/石头/沙子/原木/金属废料等）为主；塑料/铁/铜/电池等高级材料仅少量掉落；
    // 撬棍/消防斧/武士刀为整档限量的极稀有物品（权重 2）
    locationLoot: {
        // rooms：地点房间数（搜刮按房间进度推进，房间数体现地点繁荣程度）；
        // 绷带/创可贴 restore 为恢复健康度（health），其他药品走 itemUse 默认恢复血量
        '便利店':   { rooms: 16,  drops: [ { name: '罐头', type: 'food', w: 22 }, { name: '薯片', type: 'food', w: 22 }, { name: '矿泉水', type: 'water', w: 18 }, { name: '垃圾', type: 'material', w: 15 }, { name: '布料', type: 'material', w: 10 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 12 }, { name: '塑料', type: 'material', w: 5 } ] },
        '小型超市': { rooms: 30,  drops: [ { name: '罐头', type: 'food', w: 18 }, { name: '薯片', type: 'food', w: 18 }, { name: '矿泉水', type: 'water', w: 18 }, { name: '应急干粮', type: 'food', w: 13 }, { name: '垃圾', type: 'material', w: 15 }, { name: '布料', type: 'material', w: 8 }, { name: '锅', type: 'tool', w: 2 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 10 }, { name: '塑料', type: 'material', w: 4 } ] },
        '大型综合超市': { rooms: 60, drops: [ { name: '罐头', type: 'food', w: 16 }, { name: '薯片', type: 'food', w: 13 }, { name: '应急干粮', type: 'food', w: 10 }, { name: '矿泉水', type: 'water', w: 16 }, { name: '垃圾', type: 'material', w: 15 }, { name: '布料', type: 'material', w: 10 }, { name: '金属废料', type: 'material', w: 5 }, { name: '锅', type: 'tool', w: 2 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 10 }, { name: '塑料', type: 'material', w: 4 } ] },
        '学校':     { rooms: 30,  drops: [ { name: '布料', type: 'material', w: 40 }, { name: '垃圾', type: 'material', w: 30 }, { name: '矿泉水', type: 'water', w: 15 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 15 }, { name: '塑料', type: 'material', w: 4 } ] },
        '大学':     { rooms: 36, drops: [ { name: '布料', type: 'material', w: 30 }, { name: '垃圾', type: 'material', w: 25 }, { name: '硝石', type: 'material', w: 15 }, { name: '金属废料', type: 'material', w: 10 }, { name: '石头', type: 'material', w: 10 }, { name: '矿泉水', type: 'water', w: 6 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 6 }, { name: '塑料', type: 'material', w: 3 } ] },
        '消防局':   { rooms: 30, drops: [ { name: '金属废料', type: 'material', w: 30 }, { name: '垃圾', type: 'material', w: 15 }, { name: '石头', type: 'material', w: 10 }, { name: '棒球棒', type: 'weapon', damage: 10, durability: 35, w: 2 }, { name: '头盔', type: 'armor', defense: 2, durability: 30, w: 2 }, { name: '汽油喷灯', type: 'tool', durability: 50, w: 3 }, { name: '消防斧', type: 'weapon', damage: 16, durability: 1000, w: 2 }, { name: '铁', type: 'material', w: 8 } ] },
        '警察局':   { rooms: 34, enemyChance: 0.6, drops: [ { name: '金属废料', type: 'material', w: 30 }, { name: '垃圾', type: 'material', w: 15 }, { name: '棒球棒', type: 'weapon', damage: 10, durability: 35, w: 2 }, { name: '皮甲', type: 'armor', defense: 3, durability: 40, w: 2 }, { name: '武士刀', type: 'weapon', damage: 18, durability: 1000, w: 2 }, { name: '铁', type: 'material', w: 8 } ] },
        '诊所':     { rooms: 20,  drops: [ { name: '绷带', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 15, max: 100 }, w: 25 }, { name: '消炎药', type: 'medicine', w: 20 }, { name: '草药包', type: 'medicine', w: 16 }, { name: '草药', type: 'medicine', w: 10 }, { name: '布料', type: 'material', w: 12 }, { name: '垃圾', type: 'material', w: 8 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 18 }, { name: '塑料', type: 'material', w: 3 } ] },
        '医院':     { rooms: 50, drops: [ { name: '绷带', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 15, max: 100 }, w: 22 }, { name: '消炎药', type: 'medicine', w: 18 }, { name: '草药包', type: 'medicine', w: 16 }, { name: '草药', type: 'medicine', w: 8 }, { name: '布料', type: 'material', w: 10 }, { name: '垃圾', type: 'material', w: 10 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 15 }, { name: '塑料', type: 'material', w: 3 }, { name: '电池', type: 'material', w: 3 } ] },
        '银行':     { rooms: 16,  drops: [ { name: '布料', type: 'material', w: 40 }, { name: '垃圾', type: 'material', w: 30 }, { name: '金属废料', type: 'material', w: 20 }, { name: '石头', type: 'material', w: 10 }, { name: '电池', type: 'material', w: 3 } ] },
        '火车站':   { rooms: 38, drops: [ { name: '罐头', type: 'food', w: 30 }, { name: '布料', type: 'material', w: 25 }, { name: '垃圾', type: 'material', w: 20 }, { name: '金属废料', type: 'material', w: 15 }, { name: '石头', type: 'material', w: 10 }, { name: '塑料', type: 'material', w: 4 } ] },
        '地铁站':   { rooms: 28,  drops: [ { name: '布料', type: 'material', w: 35 }, { name: '垃圾', type: 'material', w: 30 }, { name: '罐头', type: 'food', w: 30 }, { name: '石头', type: 'material', w: 10 } ] },
        '居民楼':   { rooms: 44, drops: [ { name: '薯片', type: 'food', w: 26 }, { name: '矿泉水', type: 'water', w: 26 }, { name: '布料', type: 'material', w: 17 }, { name: '垃圾', type: 'material', w: 15 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 14 }, { name: '塑料', type: 'material', w: 3 } ] },
        '工厂':     { rooms: 34, drops: [ { name: '金属废料', type: 'material', w: 35 }, { name: '垃圾', type: 'material', w: 20 }, { name: '石头', type: 'material', w: 10 }, { name: '撬棍', type: 'tool', durability: 40, w: 2 }, { name: '铁', type: 'material', w: 12 }, { name: '铜', type: 'material', w: 6 } ] },
        '动物园':   { mode: 'zoo' },
        '植物园':   { mode: 'botanic' },
        '驾校':     { mode: 'dismantle', cars: 15 },
        '机场':     { rooms: 40, drops: [ { name: '罐头', type: 'food', w: 30 }, { name: '布料', type: 'material', w: 25 }, { name: '垃圾', type: 'material', w: 20 }, { name: '金属废料', type: 'material', w: 15 }, { name: '塑料', type: 'material', w: 4 } ] },
        '景区':     { rooms: 26,  drops: [ { name: '原木', type: 'material', w: 40 }, { name: '石头', type: 'material', w: 30 }, { name: '草药', type: 'medicine', w: 30 } ] },
        '体育馆':   { rooms: 18,  drops: [ { name: '布料', type: 'material', w: 45 }, { name: '垃圾', type: 'material', w: 25 }, { name: '薯片', type: 'food', w: 25 }, { name: '矿泉水', type: 'water', w: 10 } ] },
        '宾馆':     { rooms: 24,  drops: [ { name: '布料', type: 'material', w: 40 }, { name: '薯片', type: 'food', w: 30 }, { name: '矿泉水', type: 'water', w: 30 }, { name: '垃圾', type: 'material', w: 15 } ] },
        '办公楼':   { rooms: 24,  drops: [ { name: '布料', type: 'material', w: 35 }, { name: '垃圾', type: 'material', w: 25 }, { name: '金属废料', type: 'material', w: 15 }, { name: '石头', type: 'material', w: 10 }, { name: '矿泉水', type: 'water', w: 8 }, { name: '电池', type: 'material', w: 3 } ] },
        '百货商场': { rooms: 46, drops: [ { name: '布料', type: 'material', w: 35 }, { name: '薯片', type: 'food', w: 25 }, { name: '垃圾', type: 'material', w: 20 }, { name: '矿泉水', type: 'water', w: 15 }, { name: '创可贴', type: 'medicine', restore: { stat: 'health', statName: '健康', amount: 8, max: 100 }, w: 10 }, { name: '塑料', type: 'material', w: 4 } ] },
        '邮局':     { rooms: 14,  drops: [ { name: '布料', type: 'material', w: 45 }, { name: '垃圾', type: 'material', w: 30 }, { name: '沙子', type: 'material', w: 20 }, { name: '石头', type: 'material', w: 10 } ] },
        '餐饮店':   { rooms: 16,  drops: [ { name: '生肉', type: 'rawfood', w: 35 }, { name: '鱼', type: 'rawfood', w: 30 }, { name: '纯净水', type: 'water', w: 20 }, { name: '脏水', type: 'dirty', w: 15 } ] },
        '停车场':   { mode: 'dismantle', cars: 30 },
        '加油站':   { mode: 'gas' },
        '河边':     { mode: 'river' }
    },

    // 安全屋室外设施（默认锁定）
    outdoors: [
        { icon: '🐕', name: '狗窝', desc: '大黄的窝', unlocked: false },
        { icon: '🛡️', name: '防御栅栏', desc: '加固安全屋外围，降低外出遇敌概率', unlocked: false, unlockCost: { '木板': 8, '铁': 4, '钉子': 6 } }
    ],

    // 物品分类：每类共用一个图标（food 食物 / water 水 / medicine 药品 / weapon 武器 / tool 工具 / material 材料）
    itemCategories: {
        food:     { name: '食物', icon: '🍖' },
        water:    { name: '水',   icon: '💧' },
        medicine: { name: '药品', icon: '💊' },
        weapon:   { name: '武器', icon: '⚔️' },
        tool:     { name: '工具', icon: '🔧' },
        armor:    { name: '防具', icon: '🛡️' },
        life:     { name: '生活', icon: '🧰' },
        material: { name: '材料', icon: '🧱' },
        rawfood:  { name: '生食', icon: '🥩' },
        dirty:    { name: '脏水', icon: '🌊' },
        drink:    { name: '饮品', icon: '🥤' },
        process:  { name: '加工', icon: '🔨' }
    },
    // 可消耗物品的使用效果：背包/仓库点击物品时菜单显示"吃/喝/使用"，恢复对应状态（stat 为 stats 字段，max 为上限）
    itemUse: {
        food:     { label: '吃',   stat: 'hunger', statName: '饱食度', amount: 30, max: 150 },
        water:    { label: '喝',   stat: 'water',  statName: '水分',   amount: 30, max: 150 },
        medicine: { label: '使用', stat: 'hp',     statName: '血量',   amount: 20, max: 200 }
    },
    // 灶台菜单：固定按钮，点击时按背包+仓库当前物资直接制作。
    // level 为所需灶台等级（0=简易灶台即可，1=需升级为烹饪锅），inputs 按物品 name 计，output 入背包。
    // 食材限定：肉、鱼、蛋、土豆、甜菜、草莓、菠萝、西瓜、香蕉、椰子、芒果；仅肉/鱼/土豆/甜菜可烧烤。
    // 菜谱需加 1 份「纯净水」（水以 1 为单位，来自烧水）。
    stoveMenu: [
        { name: '烤肉',     level: 0, inputs: { '生肉': 1 },                                  output: { name: '烤肉',     type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 45,  max: 150 } } },
        { name: '烤鱼',     level: 0, inputs: { '鱼': 1 },                                  output: { name: '烤鱼',     type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 40,  max: 150 } } },
        { name: '烤肉干',   level: 0, inputs: { '生肉': 2 },                                  output: { name: '肉干',     type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 30,  max: 150 } } },
        { name: '烤土豆',   level: 0, inputs: { '土豆': 1 },                                output: { name: '烤土豆',   type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 30,  max: 150 } } },
        { name: '烤甜菜',   level: 0, inputs: { '甜菜': 1 },                                output: { name: '烤甜菜',   type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 30,  max: 150 } } },
        { name: '煎蛋',     level: 0, inputs: { '蛋': 1 },                                  output: { name: '煎蛋',     type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 35,  max: 150 } } },
        { name: '烧水',     level: 0, inputs: { '脏水': 1 },                                output: { name: '纯净水',   type: 'water' } },
        { name: '炖肉煲',   level: 1, inputs: { '生肉': 1, '土豆': 1, '纯净水': 1, '碗': 1 },          output: { name: '炖肉煲',   type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 65,  max: 150 } } },
        { name: '烤蔬菜盘', level: 1, inputs: { '土豆': 1, '甜菜': 1, '纯净水': 1, '碗': 1 },        output: { name: '烤蔬菜盘', type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 55,  max: 150 } } },
        { name: '海陆拼盘', level: 1, inputs: { '生肉': 1, '鱼': 1, '纯净水': 1, '碗': 1 },            output: { name: '海陆拼盘', type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 80,  max: 150 } } },
        { name: '营养大餐', level: 1, inputs: { '生肉': 1, '鱼': 1, '土豆': 1, '甜菜': 1, '纯净水': 1, '碗': 1 }, output: { name: '营养大餐', type: 'food', restore: { stat: 'hunger', statName: '饱食度', amount: 110, max: 150 } } }
    ],
    // 榨汁机菜单：只用蔬果类食材 + 1 份「纯净水」榨成营养饮品
    juiceRecipes: [
        { name: '草莓汁',   inputs: { '草莓': 2, '纯净水': 1, '杯子': 1 },                             output: { name: '草莓汁',   type: 'drink', restore: { stat: 'hp', statName: '生命', amount: 15, max: 200 } } },
        { name: '菠萝汁',   inputs: { '菠萝': 1, '纯净水': 1, '杯子': 1 },                             output: { name: '菠萝汁',   type: 'drink', restore: { stat: 'hp', statName: '生命', amount: 18, max: 200 } } },
        { name: '西瓜汁',   inputs: { '西瓜': 1, '纯净水': 1, '杯子': 1 },                             output: { name: '西瓜汁',   type: 'drink', restore: { stat: 'water',     statName: '水分', amount: 25, max: 150 } } },
        { name: '香蕉奶昔', inputs: { '香蕉': 2, '纯净水': 1, '杯子': 1 },                             output: { name: '香蕉奶昔', type: 'drink', restore: { stat: 'hp', statName: '生命', amount: 20, max: 200 } } },
        { name: '椰子水',   inputs: { '椰子': 1, '纯净水': 1, '杯子': 1 },                             output: { name: '椰子水',   type: 'drink', restore: { stat: 'water',     statName: '水分', amount: 30, max: 150 } } },
        { name: '芒果汁',   inputs: { '芒果': 2, '纯净水': 1, '杯子': 1 },                             output: { name: '芒果汁',   type: 'drink', restore: { stat: 'hp', statName: '生命', amount: 18, max: 200 } } },
        { name: '混合果汁', inputs: { '草莓': 1, '菠萝': 1, '西瓜': 1, '纯净水': 1, '杯子': 1 },        output: { name: '混合果汁', type: 'drink', restore: { stat: 'hp', statName: '生命', amount: 35, max: 200 } } }
    ],
    // 熔炉菜单：以木板为燃料（1 块燃烧 1 游戏小时，仅加工时消耗），后台加工 10 游戏分钟
    // 10 垃圾 → 1 塑料；10 金属废料 → 1 铁（原料取背包+仓库）
    furnaceRecipes: [
        { name: '塑料', inputs: { '垃圾': 10 }, output: { name: '塑料', type: 'material' } },
        { name: '铁',   inputs: { '金属废料': 10 }, output: { name: '铁', type: 'material' } }
    ],
    // 种植园作物：seed 为种植消耗物（seed===name 表示直接用作物种植，如土豆/甜菜），
    // type 为果实类型，growHours 为生长所需游戏小时（后台生长，成熟后手动收获 1~3 个）
    plantationCrops: [
        { name: '香蕉', seed: '香蕉种子', type: 'food', growHours: 2 },
        { name: '椰子', seed: '椰子种子', type: 'food', growHours: 2 },
        { name: '芒果', seed: '芒果种子', type: 'food', growHours: 2 },
        { name: '草莓', seed: '草莓种子', type: 'food', growHours: 3 },
        { name: '菠萝', seed: '菠萝种子', type: 'food', growHours: 3 },
        { name: '西瓜', seed: '西瓜种子', type: 'food', growHours: 3 },
        { name: '土豆', seed: '土豆', type: 'rawfood', growHours: 2 },
        { name: '甜菜', seed: '甜菜', type: 'rawfood', growHours: 2 }
    ],

    // 背包等级：升级扩充容量（bagMax 随等级更新；0 级 20 格 → 满级 40 格；str 为升级所需力量等级）
    bagLevels: [
        { name: '普通背包', capacity: 20, upgrade: { '布料': 2, '塑料': 1 } },
        { name: '帆布背包', capacity: 28, upgrade: { '布料': 4, '塑料': 2 }, str: 3 },
        { name: '登山背包', capacity: 40, upgrade: null, str: 7 }
    ],

    // 初始背包物资（点击 🎒 后模态框显示；type 决定图标，每槽一种物品、堆叠上限 20）
    bag: [
        { type: 'food',   name: '薯片', count: 1 },
        { type: 'water',  name: '矿泉水', count: 1 },
        { type: 'weapon', name: '棒球棒', damage: 14, durability: 35 }
    ],

    // 初始日志
    initialLogs: [
        { time: '05:00', text: '雨后的空气里弥漫着泥土味。' },
        { time: '05:30', text: '昨晚睡得不太安稳，腰背酸痛。' },
        { time: '05:50', text: '屋外传来风声，篝火已经熄灭。' },
        { time: '06:00', text: '你从破床上醒来，窗外天色阴沉。' }
    ]
};
