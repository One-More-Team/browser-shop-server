'use strict';

const fs = require('fs');
const uuid = require('uuid');
const WebSocket = require('ws');
const CalcUtils = require('./CalcUtils');

const HEADER = 'header';
const DATA = 'data';
const ID = 'id';
const NAME = 'name';
const POSITION = 'position';

class Server {
    start(port, databasePath, shopConfigPath) {
        this.log('...loading database...');

        const productDatabase = fs.readFileSync(databasePath);
        const products = JSON.parse(productDatabase);

        const shopConfigData = fs.readFileSync(shopConfigPath);
        const shopConfig = JSON.parse(shopConfigData);
        this._shops = CalcUtils.calcShelters(shopConfig);

        CalcUtils.mergeProductsToShops(this._shops, products);

        this.log('...started...');

        this.onConnection = this.onConnection.bind(this);
        this.onClose = this.onClose.bind(this);

        this._clientData = {};

        this._server = new WebSocket.Server({port});

        this._server.on('connection', this.onConnection);
    }

    onConnection(client) {
        client.id = uuid.v4();

        this.log(`CONNECTED: ${client.id}`);

        client.on('message', this.onClientMessage.bind(this, client));
        client.on('close', this.onClose.bind(this, client));
    }

    onClose(client) {
        if (this._clientData[client.id]) {
            delete this._clientData[client.id];
            this.broadcastData('leave', client.id, client);
            this.log(`LEFT: ${client.id} [clients: ${this.getClientNum()}]`);
        }

        this.log(`DISCONNECTED: ${client.id}`);
    }

    onClientMessage(client, messageStr) {
        let messageObj;

        // this.log(`--> ${client.id} ${messageStr}`);

        try {
            messageObj = JSON.parse(messageStr);
        } catch (e) {
            this.log(e);

            return;
        }

        const header = messageObj[HEADER];
        const data = messageObj[DATA];

        switch (header) {
            case 'echo':
                this.broadcastMessage(messageStr);
                break;
            case 'init':
                this.onInitMessage(data, client);
                break;
            case 'updatePosition':
                this.onUpdatePositionMessage(data, client);
                break;
            case 'sendChatMessage':
                this.onSendChatMessage(data, client);
                break;
            /*
            case 'buyProduct':
                this.onBuyProductMessage(data, client);
                break;
            */
        }
    }

    onInitMessage(data, client) {
        if (!data || this._clientData[client.id]) {
            return;
        }

        const clientData = {
            [ID]: client.id,
            [NAME]: data.name,
            color: data.color,
            [POSITION]: {
                x: Math.round(Math.random() * 10) + 30,
                y: 0.5,
                z: Math.round(Math.random() * 10) + 0,
                rotation: 0,
            },
        };

        this._clientData[client.id] = clientData;

        this.log(`JOINED: ${client.id} [clients: ${this.getClientNum()}]`);

        const initData = {
            shops: this._shops,
            clientList: Object.values(this._clientData),
            [ID]: client.id,
        };

        this.sendData('init', initData, client);
        this.broadcastData('join', clientData, client);
    }

    onUpdatePositionMessage(data, client) {
        if (!data) {
            return;
        }

        const dataObj = {
            [ID]: client.id,
            [POSITION]: {
                x: data.x,
                y: data.y,
                z: data.z,
                rotation: data.rotation,
            },
        };

        this.broadcastData('updatePosition', dataObj, client);
    }

    onSendChatMessage(message, client) {
        const dataObj = {
            [ID]: client.id,
            message,
        };

        this.broadcastData('sendChatMessage', dataObj);
    }

    /*
    onBuyProductMessage(productId, client) {
        const product = [].concat.apply([], Object.values(this._products)).find(product => product.id === productId);

        if (product && product.stock > 0) {
            --product.stock;

            const productData = {
                [ID]: product.id,
                stock: product.stock,
            };

            this.broadcastData('productUpdate', productData);
        }
    }
    */

    getClientNum() {
        return Object.keys(this._clientData).length;
    }

    sendData(header, data, client) {
        const message = JSON.stringify({
            [HEADER]: header,
            [DATA]: data,
        });
        this.sendMessage(message, client);
    }

    sendMessage(message, client) {
        // this.log(`<-- ${client.id} ${message}`);
        client.send(message);
    }

    broadcastData(header, data, senderClient) {
        const message = JSON.stringify({
            [HEADER]: header,
            [DATA]: data,
        });
        this.broadcastMessage(message, senderClient);
    }

    broadcastMessage(message, senderClient) {
        this._server.clients.forEach(client => {
            const isSender = senderClient && senderClient === client;

            if (!isSender && client.readyState === WebSocket.OPEN) {
                this.sendMessage(message, client);
            }
        });
    }

    log(message) {
        console.log(`${new Date().toLocaleString()}: ${message}`);
    }
}

module.exports = Server;
