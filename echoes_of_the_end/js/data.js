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
        { icon: '🔥', name: '篝火', unlocked: true, desc: '取暖、照明，驱散黑夜的寒意。' },
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
        { icon: '🍳', name: '简易灶台', unlocked: false, desc: '加热食物、净水，改善伙食。' },
        { icon: '🚿', name: '雨水收集器', unlocked: false, desc: '收集并初步过滤雨水。' },
        { icon: '📦', name: '仓库', unlocked: true, isStorage: true,
          // 四级存储设施、三次升级；capacity 为该级可单独存放的容量，upgrade 为升到下一级所需材料（最高级为 null）
          storageLevel: 0,
          storageLevels: [
              { name: '储物箱',   capacity: 200, upgrade: { '废铁': 5 } },
              { name: '大储藏柜', capacity: 400, upgrade: { '废铁': 8, '布料': 3 } },
              { name: '储藏间',   capacity: 800, upgrade: { '废铁': 15, '布料': 6 } },
              { name: '仓库',     capacity: 1500, upgrade: null }
          ] },
        { icon: '🧊', name: '冷藏箱', unlocked: false, desc: '延长食物保鲜时间。' },
        { icon: '🪑', name: '舒适座椅', unlocked: false, desc: '坐着休息，缓解疲惫。' }
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
        material: { name: '材料', icon: '🧱' }
    },

    // 初始背包物资（点击 🎒 后模态框显示；type 决定图标，weight 为具体重量 kg）
    bag: [
        { type: 'food',     name: '一包薯片',   weight: 0.2 },
        { type: 'food',     name: '压缩饼干',   weight: 0.35 },
        { type: 'water',    name: '一瓶矿泉水', weight: 0.55 },
        { type: 'water',    name: '净水壶',     weight: 1.2 },
        { type: 'medicine', name: '绷带',       weight: 0.1 },
        { type: 'medicine', name: '消炎药',     weight: 0.05 },
        { type: 'weapon',   name: '棒球棒',     weight: 0.9 },
        { type: 'weapon',   name: '小刀',       weight: 0.25 },
        { type: 'tool',     name: '多功能工具', weight: 0.4 },
        { type: 'tool',     name: '手电筒',     weight: 0.3 },
        { type: 'material', name: '废铁',       weight: 1.5,  count: 20 },
        { type: 'material', name: '布料',       weight: 0.2,  count: 10 }
    ],

    // 初始日志
    initialLogs: [
        { time: '05:00', text: '雨后的空气里弥漫着泥土味。' },
        { time: '05:30', text: '昨晚睡得不太安稳，腰背酸痛。' },
        { time: '05:50', text: '屋外传来风声，篝火已经熄灭。' },
        { time: '06:00', text: '你从破床上醒来，窗外天色阴沉。' }
    ]
};
