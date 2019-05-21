module.exports = PricesTF;

require('util').inherits(PricesTF, require('events').EventEmitter);

const moment = require('moment');

function PricesTF (options) {
    options = options || {};

    this.token = options.token;
    this.currency = options.currency || 'USD';

    this.retryAfter = null;
    this.ratelimit = null;
}

PricesTF.prototype.init = function (callback) {
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
        if (self.ratelimit.remaining === 0) {
            // The socket server disconnected us because we are ratelimited
            clearTimeout(timeout);
            self.socket.destroy();
            callback(new Error('Too Many Requests'));
        }
    }
};

PricesTF.prototype.shutdown = function () {
    this.socket.destroy();
};

PricesTF.prototype._canMakeRequest = function (consume, callback) {
    if (!this.ratelimit) {
        return true;
    }

    const canAfford = this.ratelimit.remaining - consume >= 0;

    if (!canAfford) {
        callback(new Error('Can\'t afford requesting this endpoint'));
    }

    return canAfford;
};

PricesTF.prototype._ratelimit = function (time, ratelimit) {
    if (!this.ratelimit || time > this.ratelimit.time) {
        // Only update and emit the ratelimit if it is the current one
        ratelimit.reset = moment.unix(ratelimit.reset);
        ratelimit.time = time;
        this.ratelimit = ratelimit;
        this.emit('ratelimit', ratelimit);
    }
};

require('./lib/request');
require('./lib/http');
