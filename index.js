'use strict';

const Server = require('./lib/Server');

const PORT = process.env.PORT || 8081;
const DATABASE = './db/productsDataV1.json';
const SHOP_CONFIG = './conf/shopConfig.json';

const server = new Server();
server.start(PORT, DATABASE, SHOP_CONFIG);
