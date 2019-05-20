module.exports = PricesTF;

require('util').inherits(PricesTF, require('events').EventEmitter);

function PricesTF (options) {
    options = options || {};

    this.token = options.token;
    this.currency = options.currency || 'USD';

    this.retryAfter = null;
}

PricesTF.prototype.init = function (callback) {
    if (this.socket !== undefined) {
        this.socket.destroy();
    }

    this.socket = require('./lib/socket')(this.token);

    this.socket.once('authenticated', authenticated);
    this.socket.once('unauthorized', unauthorized);

    const self = this;

    let called = false;

    setTimeout(() => {
        if (!this.socket.connected && !called) {
            self.socket.destroy();
            callback(new Error('Failed to connect / took too long to the socket server'));
        }
    }, 5000);

    function authenticated () {
        called = true;
        self.socket.removeListener('unauthorized', unauthorized);
        callback(null);
    }

    function unauthorized () {
        called = true;
        self.socket.destroy();
        callback(new Error('Invalid token'));
    }
};

PricesTF.prototype.shutdown = function () {
    this.socket.destroy();
};

require('./lib/request');
require('./lib/http');
