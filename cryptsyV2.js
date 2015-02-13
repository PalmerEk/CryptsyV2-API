var stringify     	= require("querystring").stringify,
	hmac          	= require("crypto").createHmac,
	util 			= require('util'),
	EventEmitter 	= require('events').EventEmitter,
	request       	= require("request"),
	Pusher 		  	= require('pusher-node-client').PusherClient,
	_				= require('underscore');



function CryptsyClient(key, secret, requeue) {
	var self    = this;

	self.key     = key;
	self.secret  = secret;
	self.jar     = request.jar();
	self.requeue = requeue || 0;

	self.client = new Pusher({ key: 'cb65d0a7a72cd94adf1f', appId: '', secret: '' });
  	self.queue = [];
	self.pushConnected = false;

	function api_query(method, id, action, auth, callback, args, get_method) {
		var args_tmp = {};

		for(var i in args) {
			if(args[i]) {
				args_tmp[i] = args[i];
			}
		}

		args = args_tmp;

		var options = {
			uri     : 'https://api.cryptsy.com/api/v2/' + method,
			agent   : false,
			method  : get_method || "GET",
			jar     : self.jar,
			headers : {
				"User-Agent": "Mozilla/4.0 (compatible; Cryptsy API node client)"
			}
		};

		if(id) options.uri += ('/'+id);
		if(action) options.uri += ('/'+action);

		if(!auth) {
			if(stringify(args) != '') options.url += ('?' + stringify(args));
		}	else	{
			if (!self.key || !self.secret) {
				throw new Error("Must provide key and secret to make this API request.");
			}	else{
				args.nonce = new Date().getTime();
			 	options.uri += ('?' + stringify(args));
			 	options.headers.Key = self.key;
				options.headers.Sign = new hmac("sha512", self.secret).update(stringify(args)).digest('hex');
			}
		}

		request(options, function(err, res, body) {
			if(!body || !res || res.statusCode != 200) {
				var requeue = +self.requeue;

				if(requeue) {
					setTimeout(function() {
						api_query(method, callback, args);
					}, requeue);
				}
				else if(typeof callback === 'function') {
					console.error(err);
					console.error(body);
					callback.call(this, "Error in server response", null);
				}
			} else {
				var error  = null;
				var result = null;

				try {
					var response = JSON.parse(body);

					if(response.error) {
						error = response.error;
					} else {
						result = response.return || response;
					}
				} catch(e) {
					error = "Error parsing server response: " + e.message;
				}

				if(typeof callback === 'function') {
					callback.call(this, error, result);
				}
			}
		});
	}

	function execute(method, auth, params, callback, options, get_method){
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		api_query(method, params.id, params.action, auth, callback, _.pick(params, options || ''), get_method);
	}

	////////////////////////////////////////////////////////////////////////
	// User
	////////////////////////////////////////////////////////////////////////
	self.info = function(params, callback) {
		execute('info', true, params, callback)
	};

	self.balances = function(params, callback) {
		execute('balances', true, params, callback, ['type'])
	};

	self.deposits = function(params, callback) {
		execute('deposits', true, params, callback, ['limit'])
	};

	self.withdrawals = function(params, callback) {
		execute('withdrawals', true, params, callback, ['limit'])
	};

	self.addresses = function(params, callback) {
		execute('addresses', true, params, callback, ['tradekey'])
	};

	self.transfers = function(params, callback) {
		execute('transfers', true, params, callback, ['type', 'limit'])
	};

	self.orders = function(params, callback) {
		execute('orders', true, params, callback, ['type'])
	};

	self.triggers = function(params, callback) {
		execute('triggers', true, params, callback, ['type'])
	};

	self.tradehistory = function(params, callback) {
		execute('tradehistory', true, params, callback, ['limit', 'start', 'stop'])
	};

	self.validatetradekey = function(params, callback) {
		execute('validatetradekey', true, params, callback, ['tradekey'])
	};

	////////////////////////////////////////////////////////////////////////
	// Markets
	////////////////////////////////////////////////////////////////////////
	self.markets = function(params, callback) {
		execute('markets', false, params, callback)
	};

	self.volume = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', false, _.defaults({action: 'volume'}, params), callback)
	};

	self.ticker = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', false, _.defaults({action: 'ticker'}, params), callback)
	};

	self.fees = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', true, _.defaults({action: 'fees'}, params), callback)
	};

	self.triggers = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', true, _.defaults({action: 'triggers'}, params), callback)
	};

	self.orderbook = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', false, _.defaults({action: 'orderbook'}, params), callback, ['limit', 'type', 'mine'])
	};

	self.tradehistory = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', false, _.defaults({action: 'tradehistory'}, params), callback, ['limit', 'mine', 'start', 'stop'])
	};

	self.ohlc = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('markets', false, _.defaults({action: 'ohlc'}, params), callback, ['limit', 'start', 'stop', 'interval'])
	};

	////////////////////////////////////////////////////////////////////////
	// Currencies
	////////////////////////////////////////////////////////////////////////
	self.currencies = function(params, callback) {
		execute('currencies', false, params, callback)
	};

	self.currencyMarkets = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('currencies', false, _.defaults({action: 'markets'}, params), callback)
	};

	////////////////////////////////////////////////////////////////////////
	// Order
	////////////////////////////////////////////////////////////////////////
	self.getOrder = function(params, callback) {
		execute('order', true, params, callback)
	};

	self.createOrder = function(params, callback) {
		execute('order', true, params, callback, ['marketid', 'ordertype', 'quantity', 'price'], 'POST')
	};

	self.cancelOrder = function(params, callback) {
		execute('order', true, params, callback, null, 'DELETE')
	};	

	////////////////////////////////////////////////////////////////////////
	// Trigger
	////////////////////////////////////////////////////////////////////////
	self.getTrigger = function(params, callback) {
		execute('trigger', true, params, callback)
	};

	self.createTrigger = function(params, callback) {
		execute('trigger', true, params, callback, ['marketid', 'type', 'quantity', 'comparison', 'price', 'orderprice', 'expires'], 'POST')
	};

	self.cancelTrigger = function(params, callback) {
		execute('trigger', true, params, callback, null, 'DELETE')
	};	


	////////////////////////////////////////////////////////////////////////
	// Converter
	////////////////////////////////////////////////////////////////////////
	self.quoteInfo = function(params, callback) {
		execute('converter', true, params, callback)
	};

	self.quoteDepositAddress = function(params, callback) {
		if(typeof params == 'function')	{
			callback = params;
			params = {};
		}

		execute('converter', true, _.defaults({action: 'depositaddress'}, params), callback)
	};

	self.createQuote = function(params, callback) {
		execute('converter', true, params, callback, null, 'POST')
	};	

	////////////////////////////////////////////////////////////////////////
	// Push API
	////////////////////////////////////////////////////////////////////////
	self.subscribe = function(market, type) {
		if(!self.pushConnected) {
			self.client.on('connect', self._subscribeQueue);
			self.client.connect();
		}

		type = (type||'').toLowerCase() == 'trade' ? 'trade' : 'ticker';

	  	// if array, recurse
	  	if(market instanceof Array) return market.forEach(function(m) { self.subscribe(m, type); });
	
		if(self.connected) {
			self._subscribe(type + '.' + market);
		} else {
			self.queue.push(type + '.' + market);
		}
	};

	// after connect, subscribe to all qued markets
	self._subscribeQueue = function() {
	  self.connected = true;
	  self.queue.forEach(self._subscribe);
	  self.queue = [];
	}

	self._subscribe = function(channel) {
	  self.client.subscribe(channel).on('message', self.handle);
	}

	self.handle = function(e) {
	  if(e.channel.indexOf('trade.') >= 0) {
	    self.emit('trade', e);
	  } else if(e.channel.indexOf('ticker.') >= 0) {
	    self.emit('ticker', e);
	  };
	};

}

util.inherits(CryptsyClient, EventEmitter);

module.exports = CryptsyClient;
