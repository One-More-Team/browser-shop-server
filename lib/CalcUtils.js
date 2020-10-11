'use strict';

const CalcUtils = {

    calcWallShelters: (defaultConfig, shopConfig, xAxisName, zAxisName, zValue, rotationMultiplier) => {
        const width = defaultConfig[`${xAxisName}Length`];
        const colNum = defaultConfig.colNum;
        const rowNum = defaultConfig.rowNum;
        const stepX = width / (colNum + 1);
        const centerX = shopConfig.center[xAxisName];
        const centerZ = shopConfig.center[zAxisName];
        const minX = centerX - width / 2;
        const shelterList = [];

        for (var y = 0; y < rowNum; ++y) {
            for (var x = 0; x < colNum; ++x) {
                shelterList.push({
                    position: {
                        [xAxisName]: minX + stepX * (x + 1),
                        [zAxisName]: centerZ + zValue,
                        y: shopConfig.center.y + defaultConfig.rowStartY + y * defaultConfig.rowDistance,
                        rotation: defaultConfig.defaultRotation + defaultConfig.rotationDirection * rotationMultiplier
                    }
                });
            }
        }

        return shelterList;
    },

    calcShelters: defaultConfig => {
        return defaultConfig.shops.map(shopConfig => {
            const shelterList = [];
            const x2 = defaultConfig.xLength / 2;
            const z2 = defaultConfig.zLength / 2;
            let wallShelters;

            if (shopConfig.walls.front) {
                wallShelters = CalcUtils.calcWallShelters(defaultConfig, shopConfig, 'z', 'x', -z2, 0);
                shelterList.push(wallShelters);
            }

            if (shopConfig.walls.right) {
                wallShelters = CalcUtils.calcWallShelters(defaultConfig, shopConfig, 'x', 'z', -x2, 1);
                shelterList.push(wallShelters);
            }

            if (shopConfig.walls.back) {
                wallShelters = CalcUtils.calcWallShelters(defaultConfig, shopConfig, 'z', 'x', z2, 2);
                shelterList.push(wallShelters);
            }

            if (shopConfig.walls.left) {
                wallShelters = CalcUtils.calcWallShelters(defaultConfig, shopConfig, 'x', 'z', x2, 3);
                shelterList.push(wallShelters);
            }

            const shelters = [].concat.apply([], shelterList);

            return {shelters};
        });
    },

    mergeProductsToShops: (shops, products) => {
        shops.forEach(shop => {
            const productList = [].concat.apply([], Object.values(products));
            shop.shelters.forEach(shelter => {
                const randomProductIndex = Math.floor(Math.random() * productList.length);
                const product = productList[randomProductIndex];

                productList.splice(randomProductIndex, 1);

                shelter.product = product;
            });
        });
    }
};

module.exports = CalcUtils;
