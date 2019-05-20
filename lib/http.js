const PricesTF = require('../index');

PricesTF.prototype.getPricelist = function (opts, callback) {
    if (callback === undefined) {
        callback = opts;
        opts = {};
    }

    this.httpMethod('GET', '/items', opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getSchema = function (callback) {
    this.httpMethod('GET', '/schema', {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getPrices = function (sku, opts, callback) {
    if (callback === undefined) {
        callback = opts;
        opts = {};
    }

    delete opts.src;

    this.httpMethod('GET', `/items/${sku}`, opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getPrice = function (sku, source, opts, callback) {
    if (callback === undefined) {
        callback = opts;
        opts = {};
    }

    opts.src = source;

    if (!opts.cur) {
        opts.cur = this.currency;
    }

    this.httpMethod('GET', `/items/${sku}`, opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getPriceHistory = function (sku, source, opts, callback) {
    if (callback === undefined) {
        callback = opts;
        opts = {};
    }

    opts.src = source;

    if (!opts.cur) {
        opts.cur = this.currency;
    }

    this.httpMethod('GET', `/items/${sku}/history`, opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getSnapshots = function (sku, opts, callback) {
    this.httpMethod('GET', `/items/${sku}/snapshots`, opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getSnapshot = function (snapshotId, callback) {
    this.httpMethod('GET', `/snapshots/${snapshotId}`, {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getRecentSnapshot = function (sku, callback) {
    this.httpMethod('GET', `/items/${sku}/snapshot`, {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.requestCheck = function (sku, source, callback) {
    this.httpMethod('POST', `/items/${sku}`, {}, {
        source: source
    }, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.requestSnapshot = function (sku, callback) {
    this.httpMethod('POST', `/items/${sku}/snapshot`, {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

module.exports = PricesTF;
