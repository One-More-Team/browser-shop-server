# Browser Shop Server

## Servers
* Test server: **ws://192.168.2.112:8081** (local network)
* Production server: **wss://browser-shop.herokuapp.com**

## Received and sent messages ([-->] from client, [<--] to client)

#### (some data structures)

* CLIENT: {id, name, position: POSITION}
* SHOP: {shelters: [...SHELTER]}
* SHELTER: {position: POSITION, product: PRODUCT_DATA}
* POSITION: {x, y, z, rotation}
* PRODUCT_DATA: "struct of product in the database"

### INIT
* --> {header: "init", data: {name, color}}
* <-- (to sender) {header: "init", data: {id, clientList: [...CLIENT], shops: [...SHOP]}}
* <-- (to others) {header: "join", data: CLIENT}
* <-- (to others) {header: "leave", data: "client id"} //coming after connection close if "init" was called earlier

### POSITION
* --> {header: "updatePosition", data: POSITION}
* <-- (to others) {header: "updatePosition", data: {id, position: POSITION}}

### CHAT
* --> {header: "sendChatMessage", data: "chat message"}
* <-- (to all) {header: "sendChatMessage", data: {id, message}}

### BUY (temporarily removed)
* --> {header: "buyProduct", data: "product id"}
* <-- (to all) {header: "productUpdate", data: {id, stock}}

### ECHO
* --> {header: "echo", data}
* <-- (to all) {header: "echo", data}

## Collecting products data (V2) from Amazon.de by Rainforest API (https://rainforestapi.com)
### Minified
```javascript
async function searchOnAmazonDe(a,e,n=100,t=3,r=10){const c=`https://api.rainforestapi.com/request?api_key=${e}&type=search&amazon_domain=amazon.de&search_term=${a.split(" ").join("+")}&language=en_US`,o=await fetch(c);return(await o.json()).search_results.map(e=>{try{return{category:a,id:e.asin,type:e.title,stock:Math.round(7*Math.random())+3,price:e.prices[0].raw,preview:e.image,link:e.link}}catch(a){return null}}).filter(a=>null!==a)}async function searchMoreOnAmazonDe(a,e){const n=a.map(a=>"string"==typeof a?searchOnAmazonDe(a,e):searchOnAmazonDe(a.category,e,a.maxResult,a.minStock,a.maxStock)),t=await Promise.all(n);return[].concat.apply([],t)}
```
### Original source
```javascript
async function searchOnAmazonDe(category, apiKey, maxResult = 100, minStock = 3, maxStock = 10) {
    const url = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=search&amazon_domain=amazon.de&search_term=${category.split(' ').join('+')}&language=en_US`;

    const response = await fetch(url);
    const data = await response.json();

    return data.search_results.map(entry => {
		try {
			return {
				category: category,
				id: entry.asin,
				type: entry.title,
				stock: Math.round(Math.random() * 7) + 3,
				price: entry.prices[0].raw,
				preview: entry.image,
				link: entry.link
			};
		} catch(e) {
			return null;
		}
    }).filter(o => o !== null);
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
