// ============ 子页共用小工具（依赖 data.js，须在 data.js 之后加载） ============
var UI = {
    // 物品分类图标 / 名称（升级为工作台聚合入口，非物品分类）
    catIcon(type) {
        if (type === 'upgrade') return '⬆️';
        const c = GameData.itemCategories[type];
        return c ? c.icon : '❓';
    },
    catName(type) {
        if (type === 'upgrade') return '升级';
        const c = GameData.itemCategories[type];
        return c ? c.name : '未知';
    }
};
