# browser-shop-server
Browser Show Server

## Servers
* Test server: ws://192.168.2.112:8081 (local network)
* Production server: wss://browser-shop.herokuapp.com

## Received and sent messages (from client -->, <-- to client)

#### (some data structures)

* CLIENT: {id, name, position: POSITION}
* PRODUCT_DATEBASE: "struct of database"
* POSITION: {x, y, z}

### INIT
* --> {header: "init", data: {name}}
* <-- (to sender) {header: "init", data: {id, clientList: [...CLIENT], products: PRODUCT_DATEBASE}}
* <-- (to others) {header: "join", data: CLIENT}
* <-- (to others) {header: "leave", data: "client id"} //coming after connection close if "init" was called earlier

### POSITION
* --> {header: "updatePosition", data: POSITION}
* <-- (to others) {header: "updatePosition", data: {id, position: POSITION}}

### CHAT
* --> {header: "sendChatMessage", data: "chat message"}
* <-- (to all) {header: "sendChatMessage", data: {id, message}}

### BUY
* --> {header: "buyProduct", data: "product id"}
* <-- (to all) {header: "productUpdate", data: {id, stock}}

### ECHO
* --> {header: "echo", data}
* <-- (to all) {header: "echo", data}
