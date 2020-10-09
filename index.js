'use strict';

const fs = require('fs');
const uuid = require('uuid');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8081;
const DATABASE = 'database.json';

const HEADER = 'header';
const DATA = 'data';
const ID = 'id';
const POSITION = 'id';

class Server {
    constructor(port) {
        console.log('...loading database...');

        const productDatabase = fs.readFileSync(DATABASE);
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
        client.on('message', this.onMessage.bind(this, client));

        this.handleNewClient(client);
    }

    handleNewClient(client) {
        const clientData = {
            [ID]: client.id,
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

    onMessage(client, messageStr) {
        const messageObj = JSON.parse(messageStr);
        const header = messageObj[HEADER];
        const data = messageObj[DATA];

        console.log(`${client.id} ${header} ${JSON.stringify(data)}`);

        switch(header) {
            case 'echo':
                this.broadcastMessage(messageStr);
                break;
            case 'initPosition':
                this.onInitPositionMessage(client);
                break;
            case 'updatePosition':
                this.onUpdatePositionMessage(data, client);
                break;
        }
    }

    onUpdatePositionMessage(data, senderClient) {
        if (!data || !data.position) {
            return;
        }

        const dataObj = {
            [POSITION]: {
                x: data.position.x,
                y: data.position.y,
                z: data.position.z,
            },
            [ID]: senderClient.id
        };

        this.broadcastData('updatePosition', dataObj, senderClient);
    }

    sendData(header, data, client) {
        const message = JSON.stringify({
            [HEADER]: header,
            [DATA]: data,
        });
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
                client.send(message);
            }
        });
    }
}

new Server(PORT);