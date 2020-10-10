'use strict';

const fs = require('fs');
const uuid = require('uuid');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8081;
const DATABASE = 'database.json';

const HEADER = 'header';
const DATA = 'data';
const ID = 'id';
const NAME = 'name';
const POSITION = 'position';

class Server {
    start(port, databasePath) {
        console.log('...loading database...');

        const productDatabase = fs.readFileSync(databasePath);
        this._products = JSON.parse(productDatabase);

        console.log('...started...');

        this.onConnection = this.onConnection.bind(this);

        this._clientData = {};

        this._server = new WebSocket.Server({port});

        this._server.on('connection', this.onConnection);
    }

    onConnection(client) {
        client.id = uuid.v4();
        console.log(`...connected... (${client.id})`);
        client.on('message', this.onClientMessage.bind(this, client));
    }

    onClientMessage(client, messageStr) {
        const messageObj = JSON.parse(messageStr);
        const header = messageObj[HEADER];
        const data = messageObj[DATA];

        console.log(`--> ${client.id} ${messageStr}`);

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
            case 'buyProduct':
                this.onBuyProductMessage(data, client);
                break;
        }
    }

    onInitMessage(data, client) {
        if (!data) {
            return;
        }

        const clientData = {
            [ID]: client.id,
            [NAME]: data.name,
            [POSITION]: {
                x: Math.random() * 100 + 0,
                y: Math.random() * 100 + 0,
                z: Math.random() * 0 + 0,
            },
        };

        this._clientData[client.id] = clientData;

        const initData = {
            products: this._products,
            clientList: Object.values(this._clientData),
            [ID]: client.id,
        };

        this.sendData('init', initData, client);
        this.broadcastData('initClient', clientData, client);
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

    sendData(header, data, client) {
        const message = JSON.stringify({
            [HEADER]: header,
            [DATA]: data,
        });
        this.sendMessage(message, client);
    }

    sendMessage(message, client) {
        console.log(`<-- ${client.id} ${message}`);
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
}

const server = new Server();
server.start(PORT, DATABASE);
