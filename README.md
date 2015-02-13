# CryptsyV2-API
NodeJS Client Library for the CryptsyV2 (cryptsy.com) API

Very much based on the work of https://github.com/nothingisdead/npm-cryptsy-api

It exposes all the API methods found here: https://www.cryptsy.com/pages/apiv2
as well as the Socket Push API found here: https://www.cryptsy.com/pages/pushapi

Example:

Get a list of all markets and listen for all ticker and trade event.

```javascript
var util = require('util');

var CryptsyAPI = require('./cryptsyV2');
var cryptsy = new CryptsyAPI("YOUR-KEY-FOR-PRIVATE-FUNCTIONS", "YOUR-SECRET-FOR-PRIVATE-FUNCTIONS");

(function cryptsyPushListener() {
  cryptsy.markets(function(err, markets) {
    if(err) return;

    if(markets.success) {
      var marketIDs = markets.data.reduce(function(all, market) {
        all.push(market.id);
        return all;
      }, [])
      
      cryptsy.subscribe(marketIDs, 'ticker');
      cryptsy.subscribe(marketIDs, 'trade');

      cryptsy.on('ticker', function(ticker) {
        console.log(util.format("Ticker: %s Sell: %d@%d Buy: %d@%d", ticker.trade.marketid, ticker.trade.topsell.quantity, ticker.trade.topsell.price, ticker.trade.topbuy.quantity, ticker.trade.topbuy.price))
      }).on('trade', function(trade) {
        console.log(util.format("Trade: %s %s %d@%d total %d", trade.trade.marketid, trade.trade.type, trade.trade.quantity, trade.trade.price, trade.trade.total))
      });
    }
  });
})();
```