// ============ 子页共用小工具（依赖 data.js，须在 data.js 之后加载） ============
var UI = {
    // 物品分类图标 / 名称
    catIcon(type) {
        const c = GameData.itemCategories[type];
        return c ? c.icon : '❓';
    },
    catName(type) {
        const c = GameData.itemCategories[type];
        return c ? c.name : '未知';
    }
};
