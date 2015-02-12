# CryptsyV2-API
NodeJS Client Library for the CryptsyV2 (cryptsy.com) API

Very much based on the work of https://github.com/nothingisdead/npm-cryptsy-api

It exposes all the API methods found here: https://www.cryptsy.com/pages/apiv2

Does not expose the push API yet!
Example Usage:

```javascript
var util = require('util');

var CryptsyAPI = require('cryptsyv2-api');
var cryptsy = new CryptsyAPI("YOUR-KEY-FOR-PRIVATE-FUNCTIONS", "YOUR-SECRET-FOR-PRIVATE-FUNCTIONS");

cryptsy.markets(function(err, markets) {
	if(err) return;

	if(markets.success) {
		markets.data.forEach(function(market) {
			console.log(util.format("%s: %d Low %d High %d Volume", market.label, market['24hr'].price_low, market['24hr'].price_high, market['24hr'].volume));
		})
	}
});
```