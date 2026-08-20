// ============ 全局常量（依赖 data.js / map.js，须在它们之后加载） ============
const SEASONS = GameData.seasons;
const SEASON_BASE_TEMP = GameData.seasonBaseTemp;
const WEATHER_ICON = GameData.weatherIcon;
const WEATHER_TEMP_ADJ = GameData.weatherTempAdj;
const WEATHER_TABLE = GameData.weatherTable;
const SAVE_KEY = GameData.saveKey;

// 时间规则常量（由数据推导）
const MINUTE_SECONDS = GameData.secondsPerMinute;
const HOUR_SECONDS = GameData.minutesPerHour * MINUTE_SECONDS;
const HOURS_PER_DAY = GameData.hoursPerDay;
const DAY_SECONDS = HOURS_PER_DAY * HOUR_SECONDS;
const DAYS_PER_SEASON = GameData.daysPerSeason;
const GAME_SECONDS_PER_REAL_SECOND = GameData.realSecondToGameSecond;

// 持续搜索：每累计该游戏秒数随机产出一次（1 游戏分钟）
const SEARCH_INTERVAL = MINUTE_SECONDS;

// 地图常量（15 列 × 19 行格子地图，数据来自 MapData）
const MAP_COLS = MapData.mapCols;
const MAP_ROWS = MapData.mapRows;
