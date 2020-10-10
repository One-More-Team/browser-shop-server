# browser-shop-server
Browser Show Server

## Servers
* Test server: **ws://192.168.2.112:8081** (local network)
* Production server: **wss://browser-shop.herokuapp.com**

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

## Collecting products data from Amazon by Rainforest (https://rainforestapi.com)
### Minified
```javascript
async function searchOnAmazonDe(a,e,n=100,t=3,r=10){const o=`https://api.rainforestapi.com/request?api_key=${e}&type=search&amazon_domain=amazon.de&search_term=${a.split(" ").join("+")}&language=en_US`,c=await fetch(o);return(await c.json()).search_results.map(e=>({category:a,id:e.asin,type:e.title,stock:Math.round(7*Math.random())+3,price:e.prices.raw,preview:e.image,link:e.link}))}async function searchMoreOnAmazonDe(a,e){const n=a.map(a=>"string"==typeof a?searchOnAmazonDe(a,e):searchOnAmazonDe(a.category,e,a.maxResult,a.minStock,a.maxStock)),t=await Promise.all(n);return[].concat.apply([],t)}
```
### Original source
```javascript
async function searchOnAmazonDe(category, apiKey, maxResult = 100, minStock = 3, maxStock = 10) {
    const url = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=search&amazon_domain=amazon.de&search_term=${category.split(' ').join('+')}&language=en_US`;

    const response = await fetch(url);
    const data = await response.json();

    return data.search_results.map(entry => {
        return {
            category: category,
            id: entry.asin,
            type: entry.title,
            stock: Math.round(Math.random() * 7) + 3,
            price: entry.prices.raw,
            preview: entry.image,
            link: entry.link
        };
    });
}
```
```javascript
async function searchMoreOnAmazonDe(categories, apiKey) {
    const promises = categories.map(cat => {
		if (typeof cat === 'string') {
			return searchOnAmazonDe(cat, apiKey);
		} else {
			return searchOnAmazonDe(cat.category, apiKey, cat.maxResult, cat.minStock, cat.maxStock);
		}
	});
	
	const results = await Promise.all(promises);
	
	return [].concat.apply([], results);
}
```
