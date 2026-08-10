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

    // 初始日志
    initialLogs: [
        { time: '05:00', text: '雨后的空气里弥漫着泥土味。' },
        { time: '05:30', text: '昨晚睡得不太安稳，腰背酸痛。' },
        { time: '05:50', text: '屋外传来风声，篝火已经熄灭。' },
        { time: '06:00', text: '你从破床上醒来，窗外天色阴沉。' }
    ]
};
