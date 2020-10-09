const uuid = require('uuid');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8081;

class Server {
    constructor(port) {
        console.log('...started...');

        this.onConnection = this.onConnection.bind(this);

        this._server = new WebSocket.Server({port});

        this._server.on('connection', this.onConnection);
    }

    onConnection(client) {
        client.id = uuid.v4();
        console.log(`...connected... (${client.id})`);
        client.on('message', this.onMessage.bind(this, client));
    }

    onMessage(client, messageStr) {
        const messageObj = JSON.parse(messageStr);

        console.log(`${client.id} ${messageObj.header} ${JSON.stringify(messageObj.data)}`);

        switch(messageObj.header) {
            case 'position':
                this.onPositionMessage(messageStr, client);
                break;
        }
    }

    onPositionMessage(message, senderClient) {
        this.broadcast(message, senderClient);
    }

    broadcast(data, senderClient) {
        this._server.clients.forEach(client => {
            const isSender = senderClient && senderClient === client;
            
            if (!isSender && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
}

new Server(PORT);