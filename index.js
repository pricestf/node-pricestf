module.exports = PricesTF;

require('util').inherits(PricesTF, require('events').EventEmitter);

function PricesTF (options) {
    options = options || {};

    this.token = options.token;
    this.currency = options.currency || 'USD';

    this.retryAfter = null;
}

require('./lib/request');
require('./lib/http');
