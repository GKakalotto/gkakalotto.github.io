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

    // 玩家初始状态（精力/疾病为新增）
    initialStats: { hp: 100, hunger: 100, stamina: 100, sanity: 100, disease: 0, infection: 100 },

    // 安全屋家具
    furniture: [
        { icon: '🛏️', name: '破床 Lv.1', unlocked: true },
        { icon: '🔥', name: '篝火', unlocked: true },
        { icon: '🛠️', name: '工作台', unlocked: false },
        { icon: '🍳', name: '简易灶台', unlocked: false },
        { icon: '🚿', name: '雨水收集器', unlocked: false },
        { icon: '📻', name: '无线电', unlocked: false },
        { icon: '🧊', name: '冷藏箱', unlocked: false },
        { icon: '🪑', name: '舒适座椅', unlocked: false }
    ],

    // 安全屋室外设施（默认锁定）
    outdoors: [
        { icon: '🐕', name: '狗窝', desc: '大黄的窝', unlocked: false },
        { icon: '🛡️', name: '防御栅栏', desc: '加固安全屋外围，抵御入侵', unlocked: false }
    ],

    // ===== 地图 =====
    // 安全屋 km 坐标（用于移动耗时计算）
    safehouseCoord: { x: 0, y: 3 },
    // 安全屋画布位置（左下角，百分比）
    safehouseMapPos: { lx: 8, ly: 92 },
    // 移动速度（km/h）
    walkSpeed: 4,

    // 地图地点（成都真实地名；lx/ly 为画布位置按真实方位分散布满画布，x/y 为 km 坐标用于移动耗时）
    locations: [
        { icon: '🏪', name: '红旗连锁便利店', type: '便利店', lx: 16, ly: 45, x: -1, y: 2, desc: '成都街头的红旗连锁，货架上的零食应该还有剩' },
        { icon: '🛒', name: '舞东风超市', type: '小型超市', lx: 30, ly: 14, x: 2, y: 1, desc: '老成都的社区超市，可能有泡面和矿泉水' },
        { icon: '🏬', name: '伊藤洋华堂', type: '大型综合超市', lx: 38, ly: 40, x: 1.5, y: 0.5, desc: '春熙路的大型超市，物资应该很丰富' },
        { icon: '🏫', name: '成都市实验小学', type: '学校', lx: 22, ly: 62, x: 0.5, y: 1, desc: '人民中路一段的小学，文具和教具或许有用' },
        { icon: '🎓', name: '四川大学', type: '大学', lx: 62, ly: 80, x: 3, y: -2, desc: '望江校区，实验室和图书馆藏有物资' },
        { icon: '🚒', name: '锦江区消防救援大队', type: '消防局', lx: 58, ly: 20, x: 2, y: 1.5, desc: '消防装备和破拆工具在这里' },
        { icon: '👮', name: '锦江区公安分局', type: '警察局', lx: 54, ly: 42, x: 2, y: 0.8, desc: '可能有武器和防护装备' },
        { icon: '🩺', name: '桐梓林社区卫生服务中心', type: '诊所', lx: 32, ly: 88, x: -1, y: -5, desc: '高端社区诊所，药品和设备更齐全' },
        { icon: '🏥', name: '四川大学华西医院', type: '医院', lx: 8, ly: 72, x: -1.5, y: -1.5, desc: '大医院，药品和医疗器材充足' },
        { icon: '🏦', name: '成都银行', type: '银行', lx: 42, ly: 28, x: 1.6, y: 0.4, desc: '春熙路支行，保险柜和钞票' },
        { icon: '🚉', name: '成都东站', type: '火车站', lx: 80, ly: 12, x: 6, y: 3, desc: '交通枢纽，站内商铺可能有物资' },
        { icon: '🚇', name: '天府广场地铁站', type: '地铁站', lx: 48, ly: 55, x: 0, y: 0, desc: '1/2号线换乘站，地下空间相对安全' },
        { icon: '🏢', name: '仁恒滨河湾', type: '居民楼', lx: 76, ly: 92, x: 0.5, y: -7, desc: '金融城的高档小区，住户应该囤了不少物资' },
        { icon: '🌊', name: '锦江·合江亭', type: '河边', lx: 50, ly: 72, x: 1.5, y: -0.8, desc: '府河与南河交汇处，可以钓鱼取水' },
        { icon: '🏭', name: '东郊记忆', type: '工厂', lx: 74, ly: 30, x: 5, y: 4, desc: '原红光电子管厂，能翻出工具和零件' },
        { icon: '🌲', name: '龙泉山城市森林公园', type: '森林', lx: 94, ly: 60, x: 15, y: 9, desc: '城东的山林，木材野果，可能也有野兽' },
        { icon: '🌳', name: '人民公园', type: '公园', lx: 6, ly: 20, x: -2, y: 1, desc: '少城的公园，有绿地和人工湖' }
    ],

    // 初始日志
    initialLogs: [
        { time: '06:00', text: '你从破床上醒来，窗外天色阴沉。' },
        { time: '05:50', text: '屋外传来风声，篝火已经熄灭。' },
        { time: '05:30', text: '昨晚睡得不太安稳，腰背酸痛。' },
        { time: '05:00', text: '雨后的空气里弥漫着泥土味。' }
    ]
};
