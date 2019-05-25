module.exports = PricesTF;

require('util').inherits(PricesTF, require('events').EventEmitter);

const async = require('async');
const moment = require('moment');

/**
 * PricesTF constructor
 * @param {Object} options An object of options
 * @param {String} [options.token] PricesTF access token
 * @param {Array<String>} [options.sources] A list of price sources to keep cached. Default `['bptf']`
 * @param {Function} [options.filter] A filter called for every item to see if it should be cached or not
 */
function PricesTF (options) {
    options = options || {};

    this.ready = false;
    this.token = options.token;
    this.currency = 'USD';
    this.sources = options.sources || ['bptf'];
    this.filter = options.filter || defaultFilter;

    this.items = [];
    this.prices = {};

    this.retryAfter = null;
    this.ratelimit = null;
}

/**
 * Initializes the module
 * @param {Function} callback Function to call when done
 */
PricesTF.prototype.init = function (callback) {
    this.ready = false;

    this._socketInit((err) => {
        if (err) {
            return callback(err);
        }

        this.ready = true;

        async.parallel([
            (callback) => {
                this.getPricelist(this.sources.join(','), callback);
            },
            (callback) => {
                this.getSchema(callback);
            }
        ], (err) => {
            if (err) {
                return callback(err);
            }

            this.emit('ready');

            this.socket.on('price', (price) => {
                this._newPrice(price, true);
            });

            this.socket.on('item', (item) => {
                if (!this.items.indexOf(item.sku)) {
                    this.items.push(item.sku);
                    this.emit('item', item);
                }
            });

            callback(null);
        });
    });
};

/**
 * Default filter function
 * @param {String} sku SKU of the item
 * @return {Boolean}
 */
function defaultFilter (sku) {
    return true;
}

/**
 * Function used to filter and populate the cache
 * @param {Object} price
 * @param {Boolean} [emit] If the price should be emitted
 */
PricesTF.prototype._newPrice = function (price, emit) {
    const keep = this.sources.indexOf(price.source) !== -1 && this.filter(price.sku);
    if (keep) {
        if (!this.prices[price.source]) {
            this.prices[price.source] = {};
        }

        this.prices[price.source][price.sku] = {
            name: price.name,
            time: price.time === undefined ? moment() : moment.unix(price.time),
            price: price.price
        };

        if (emit) {
            this.emit('price', price);
        }
    }
};

/**
 * Initializes the socket connection by connecting and authenticating
 * @param {Function} callback Function to call when done
 */
PricesTF.prototype._socketInit = function (callback) {
    if (this.socket !== undefined) {
        this.socket.destroy();
    }

    this.socket = require('./lib/socket')(this.token);

    this.socket.on('ratelimit', (ratelimit) => {
        this._ratelimit(moment(), ratelimit);
    });

    this.socket.once('authenticated', authenticated);
    this.socket.once('unauthorized', unauthorized);
    this.socket.once('disconnect', disconnect);

    const self = this;

    const timeout = setTimeout(() => {
        if (!this.socket.connected) {
            self.socket.destroy();
            callback(new Error('Failed to connect / took too long to the socket server'));
        }
    }, 5000);

    function authenticated () {
        clearTimeout(timeout);
        self.socket.removeListener('unauthorized', unauthorized);
        self.socket.removeListener('disconnect', unauthorized);
        callback(null);
    }

    function unauthorized () {
        clearTimeout(timeout);
        self.socket.destroy();
        callback(new Error('Invalid token'));
    }

    function disconnect () {
        if (self.ratelimit && self.ratelimit.remaining === 0) {
            // The socket server disconnected us because we are ratelimited
            clearTimeout(timeout);
            self.socket.destroy();
            callback(new Error('Too Many Requests'));
        }
    }
};

/**
 * Gracefully stop the PricesTF instance
 */
PricesTF.prototype.shutdown = function () {
    this.socket.destroy();
};

/**
 * Function called every time a ratelimit is seen
 * @param {Number} time
 * @param {Object} ratelimit
 * @param {Number} ratelimit.current Current consumed points
 * @param {Number} ratelimit.remaining Remaining points
 * @param {Number} ratelimit.reset Time when the ratelimit is reset
 */
PricesTF.prototype._ratelimit = function (time, ratelimit) {
    if (!this.ratelimit || time > this.ratelimit.time) {
        // Only update and emit the ratelimit if it is the newest one
        ratelimit.reset = moment.unix(ratelimit.reset);
        ratelimit.time = time;
        this.ratelimit = ratelimit;
        this.emit('ratelimit', ratelimit);
    }
};

require('./lib/request');
require('./lib/http');
