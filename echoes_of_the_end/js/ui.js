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
    },
    // 某材料当前拥有数量（按名称在背包中查找）
    materialCount(bag, name) {
        for (let i = 0; i < bag.length; i++) {
            if (bag[i].name === name) return bag[i].count || 0;
        }
        return 0;
    },
    // 是否满足 cost {材料:数量} 中全部材料需求
    hasMaterials(bag, cost) {
        for (const mat in cost) {
            if (this.materialCount(bag, mat) < cost[mat]) return false;
        }
        return true;
    }
};
