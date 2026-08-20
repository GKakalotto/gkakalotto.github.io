// ============ 游戏数据（独立于逻辑，供 app.js 引用） ============
var GameData = {
    // ===== 时间规则 =====
    secondsPerMinute: 60,
    minutesPerHour: 60,
    hoursPerDay: 24,
    daysPerSeason: 30,
    // 时间流速：1 现实秒推进多少游戏秒（1 游戏天 = 现实 1 小时）
    realSecondToGameSecond: 24,

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

    // 玩家初始状态（生命/饱食/水分/理智/精力/体力/健康/力量/速度/知识）
    initialStats: {
        hp: 200, hunger: 150, water: 150, sanity: 200, stamina: 100,
        physical: 100, health: 100, strength: 1, speed: 1, knowledge: 0
    },

    // 安全屋家具（desc：点击后模态框显示的说明；家具[0] 为「床」，含等级与升级配置）
    furniture: [
        {
            icon: '🛏️', name: '床', unlocked: true, isBed: true,
            bedLevel: 0,
            // 四级状态、三次升级；recover 为恢复倍率，upgrade 为升到下一级所需材料（最高级为 null）
            bedLevels: [
                { name: '草席',     recover: 1.0, upgrade: { '废铁': 2 } },
                { name: '简易睡袋', recover: 1.3, upgrade: { '废铁': 4, '布料': 2 } },
                { name: '木板床',   recover: 1.6, upgrade: { '废铁': 8, '布料': 4 } },
                { name: '席梦思',   recover: 2.0, upgrade: null }
            ]
        },
        { icon: '🔥', name: '篝火', unlocked: true, isFireplace: true, desc: '取暖、照明，驱散黑夜的寒意。',
          // 两级设施、一次升级；hoursPerWood 为每块木板燃烧小时数，upgrade 为升到下一级所需材料（最高级为 null）
          fireLevel: 0,
          fireLevels: [
              { name: '石头篝火', hoursPerWood: 1, upgrade: { '废铁': 3, '布料': 2 } },
              { name: '火炉',     hoursPerWood: 2, upgrade: null }
          ] },
        { icon: '🛠️', name: '工作台', unlocked: true, isWorkbench: true,
          // 折叠分区：武器 / 工具 / 防具 / 生活 / 药品 / 食物，每个蓝图含产物类型、重量与所需材料
          blueprints: {
              weapon: [
                  { name: '小刀',   type: 'weapon', weight: 0.25, cost: { '废铁': 2 } },
                  { name: '木矛',   type: 'weapon', weight: 0.5,  cost: { '废铁': 1, '布料': 1 } },
                  { name: '棒球棒', type: 'weapon', weight: 0.9,  cost: { '废铁': 3 } },
                  { name: '铁斧',   type: 'weapon', weight: 1.2,  cost: { '废铁': 5 } }
              ],
              tool: [
                  { name: '多功能工具', type: 'tool', weight: 0.4,  cost: { '废铁': 3 } },
                  { name: '手电筒',     type: 'tool', weight: 0.3,  cost: { '废铁': 2, '布料': 1 } },
                  { name: '绳索',       type: 'tool', weight: 0.2,  cost: { '布料': 2 } },
                  { name: '撬棍',       type: 'tool', weight: 0.6,  cost: { '废铁': 2 } }
              ],
              armor: [
                  { name: '皮甲', type: 'armor', weight: 1.5, cost: { '废铁': 2, '布料': 3 } },
                  { name: '头盔', type: 'armor', weight: 0.8, cost: { '废铁': 3, '布料': 1 } },
                  { name: '护膝', type: 'armor', weight: 0.4, cost: { '布料': 2 } }
              ],
              life: [
                  { name: '火把',     type: 'life', weight: 0.3, cost: { '布料': 1 } },
                  { name: '净水滤杯', type: 'life', weight: 0.5, cost: { '废铁': 2 } },
                  { name: '简易炉',   type: 'life', weight: 1.0, cost: { '废铁': 3, '布料': 1 } }
              ],
              medicine: [
                  { name: '绷带',   type: 'medicine', weight: 0.1,  cost: { '布料': 1 } },
                  { name: '消炎药', type: 'medicine', weight: 0.05, cost: { '废铁': 1, '布料': 1 } },
                  { name: '草药包', type: 'medicine', weight: 0.15, cost: { '布料': 2 } }
              ],
              food: [
                  { name: '应急干粮', type: 'food', weight: 0.3,  cost: { '布料': 1 } },
                  { name: '肉干',     type: 'food', weight: 0.25, cost: { '废铁': 1 } },
                  { name: '罐头',     type: 'food', weight: 0.4,  cost: { '废铁': 2 } }
              ]
          } },
        { icon: '🍳', name: '简易灶台', unlocked: false, isStove: true,
          // 两级灶台、一次升级；0 级可加热食物/净水，1 级（烹饪锅）额外解锁菜谱做饭
          stoveLevel: 0,
          stoveLevels: [
              { name: '简易灶台', upgrade: { '废铁': 5, '布料': 2 } },
              { name: '烹饪锅',   upgrade: null }
          ] },
        { icon: '🚿', name: '雨水收集器', unlocked: false, isRainCollector: true, rainWater: 0,
          // 五级设施、四次升级；升级只增加容量（每级 capacity）
          rainLevel: 0,
          rainLevels: [
              { name: '简易桶',   capacity: 200,  upgrade: { '废铁': 3,  '布料': 1 } },
              { name: '塑料罐',   capacity: 400,  upgrade: { '废铁': 6,  '布料': 2 } },
              { name: '集水桶',   capacity: 800,  upgrade: { '废铁': 10, '布料': 4 } },
              { name: '蓄水塔',   capacity: 1600, upgrade: { '废铁': 16, '布料': 6 } },
              { name: '巨型水槽', capacity: 3200, upgrade: null }
          ] },
        { icon: '📦', name: '仓库', unlocked: true, isStorage: true,
          // 四级存储设施、三次升级；capacity 为该级可单独存放的容量，upgrade 为升到下一级所需材料（最高级为 null）
          storageLevel: 0,
          storageLevels: [
              { name: '储物箱',   capacity: 200, upgrade: { '废铁': 5 } },
              { name: '大储藏柜', capacity: 400, upgrade: { '废铁': 8, '布料': 3 } },
              { name: '储藏间',   capacity: 800, upgrade: { '废铁': 15, '布料': 6 } },
              { name: '仓库',     capacity: 1500, upgrade: null }
          ] },
        { icon: '🥤', name: '榨汁机', unlocked: false, isJuicer: true, desc: '把蔬果榨成营养饮品，留住维生素。' },
        { icon: '🪑', name: '椅子', unlocked: false, isChair: true,
          // 四级坐具、三次升级；rest 为每次休息恢复的体力值（上限 100）
          chairLevel: 0,
          chairLevels: [
              { name: '小马扎', restore: 10, upgrade: { '废铁': 2, '布料': 1 } },
              { name: '木椅',   restore: 20, upgrade: { '废铁': 4, '布料': 2 } },
              { name: '电竞椅', restore: 35, upgrade: { '废铁': 7, '布料': 3 } },
              { name: '沙发',   restore: 50, upgrade: null }
          ] }
    ],

    // 床：睡觉时每小时基础恢复量（倍率 1.0×）与各属性上限（等级越高倍率越大，恢复越快）
    bedSleep: {
        base: { stamina: 10, hp: 8, physical: 10 },
        max:  { stamina: 100, hp: 200, physical: 100 }
    },

    // 安全屋室外设施（默认锁定）
    outdoors: [
        { icon: '🐕', name: '狗窝', desc: '大黄的窝', unlocked: false },
        { icon: '🛡️', name: '防御栅栏', desc: '加固安全屋外围，抵御入侵', unlocked: false }
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
        drink:    { name: '饮品', icon: '🥤' }
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
        { name: '烤肉',     level: 0, inputs: { '肉': 1 },                                  output: { name: '烤肉',     type: 'food',  weight: 0.3, restore: { stat: 'hunger', statName: '饱食度', amount: 45,  max: 150 } } },
        { name: '烤鱼',     level: 0, inputs: { '鱼': 1 },                                  output: { name: '烤鱼',     type: 'food',  weight: 0.3, restore: { stat: 'hunger', statName: '饱食度', amount: 40,  max: 150 } } },
        { name: '烤土豆',   level: 0, inputs: { '土豆': 1 },                                output: { name: '烤土豆',   type: 'food',  weight: 0.2, restore: { stat: 'hunger', statName: '饱食度', amount: 30,  max: 150 } } },
        { name: '烤甜菜',   level: 0, inputs: { '甜菜': 1 },                                output: { name: '烤甜菜',   type: 'food',  weight: 0.2, restore: { stat: 'hunger', statName: '饱食度', amount: 30,  max: 150 } } },
        { name: '烧水',     level: 0, inputs: { '脏水': 1 },                                output: { name: '纯净水',   type: 'water', weight: 0.55 } },
        { name: '炖肉煲',   level: 1, inputs: { '肉': 1, '土豆': 1, '纯净水': 1 },          output: { name: '炖肉煲',   type: 'food',  weight: 0.6, restore: { stat: 'hunger', statName: '饱食度', amount: 65,  max: 150 } } },
        { name: '烤蔬菜盘', level: 1, inputs: { '土豆': 1, '甜菜': 1, '纯净水': 1 },        output: { name: '烤蔬菜盘', type: 'food',  weight: 0.5, restore: { stat: 'hunger', statName: '饱食度', amount: 55,  max: 150 } } },
        { name: '海陆拼盘', level: 1, inputs: { '肉': 1, '鱼': 1, '纯净水': 1 },            output: { name: '海陆拼盘', type: 'food',  weight: 0.7, restore: { stat: 'hunger', statName: '饱食度', amount: 80,  max: 150 } } },
        { name: '营养大餐', level: 1, inputs: { '肉': 1, '鱼': 1, '土豆': 1, '甜菜': 1, '纯净水': 1 }, output: { name: '营养大餐', type: 'food', weight: 1.0, restore: { stat: 'hunger', statName: '饱食度', amount: 110, max: 150 } } }
    ],
    // 榨汁机菜单：只用蔬果类食材 + 1 份「纯净水」榨成营养饮品
    juiceRecipes: [
        { name: '草莓汁',   inputs: { '草莓': 2, '纯净水': 1 },                             output: { name: '草莓汁',   type: 'drink', weight: 0.4, restore: { stat: 'physical', statName: '体力', amount: 15, max: 100 } } },
        { name: '菠萝汁',   inputs: { '菠萝': 1, '纯净水': 1 },                             output: { name: '菠萝汁',   type: 'drink', weight: 0.5, restore: { stat: 'physical', statName: '体力', amount: 18, max: 100 } } },
        { name: '西瓜汁',   inputs: { '西瓜': 1, '纯净水': 1 },                             output: { name: '西瓜汁',   type: 'drink', weight: 0.6, restore: { stat: 'water',     statName: '水分', amount: 25, max: 150 } } },
        { name: '香蕉奶昔', inputs: { '香蕉': 2, '纯净水': 1 },                             output: { name: '香蕉奶昔', type: 'drink', weight: 0.5, restore: { stat: 'physical', statName: '体力', amount: 20, max: 100 } } },
        { name: '椰子水',   inputs: { '椰子': 1, '纯净水': 1 },                             output: { name: '椰子水',   type: 'drink', weight: 0.5, restore: { stat: 'water',     statName: '水分', amount: 30, max: 150 } } },
        { name: '芒果汁',   inputs: { '芒果': 2, '纯净水': 1 },                             output: { name: '芒果汁',   type: 'drink', weight: 0.5, restore: { stat: 'physical', statName: '体力', amount: 18, max: 100 } } },
        { name: '混合果汁', inputs: { '草莓': 1, '菠萝': 1, '西瓜': 1, '纯净水': 1 },        output: { name: '混合果汁', type: 'drink', weight: 0.8, restore: { stat: 'physical', statName: '体力', amount: 35, max: 100 } } }
    ],

    // 背包等级：升级扩充容量（bagMax 随等级更新；0 级即初始 30 格）
    bagLevels: [
        { name: '普通背包', capacity: 30, upgrade: { '废铁': 2, '布料': 1 } },
        { name: '帆布背包', capacity: 45, upgrade: { '废铁': 4, '布料': 2 } },
        { name: '战术背包', capacity: 60, upgrade: { '废铁': 8, '布料': 4 } },
        { name: '登山背包', capacity: 80, upgrade: null }
    ],

    // 初始背包物资（点击 🎒 后模态框显示；type 决定图标，weight 为具体重量 kg）
    bag: [
        { type: 'food',   name: '薯片',   weight: 0.2 },
        { type: 'water',  name: '矿泉水', weight: 0.55 },
        { type: 'weapon', name: '棒球棒', weight: 0.9 }
    ],

    // 初始日志
    initialLogs: [
        { time: '05:00', text: '雨后的空气里弥漫着泥土味。' },
        { time: '05:30', text: '昨晚睡得不太安稳，腰背酸痛。' },
        { time: '05:50', text: '屋外传来风声，篝火已经熄灭。' },
        { time: '06:00', text: '你从破床上醒来，窗外天色阴沉。' }
    ]
};
