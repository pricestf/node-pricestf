const PricesTF = require('../index');

PricesTF.prototype.getPricelist = function (source, callback) {
    if (callback === undefined) {
        callback = source;
        source = null;
    }

    if (!this._canMakeRequest(5, callback)) {
        return;
    }

    const queryString = {};

    if (source) {
        queryString.src = source;
    }

    queryString.cur = this.currency;

    this.httpMethod('GET', '/items', queryString, {}, (err, body) => {
        if (err) {
            return callback(err, body);
        }

        for (let i = 0; i < body.items.length; i++) {
            const item = body.items[i];
            this._newPrice(item);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getSchema = function (callback) {
    if (!this._canMakeRequest(5, callback)) {
        return;
    }

    this.httpMethod('GET', '/schema', {}, {}, (err, body) => {
        if (err) {
            return callback(err, body);
        }

        const items = [];

        for (let i = 0; i < body.items.length; i++) {
            const item = body.items[i];
            items.push(item.sku);
        }

        this.items = items;

        callback(null, body);
    });
};

PricesTF.prototype.getPrice = function (sku, source, callback) {
    if (callback === undefined) {
        callback = source;
        source = null;
    }

    if (!this._canMakeRequest(1, callback)) {
        return;
    }

    const queryString = {};

    if (source) {
        queryString.src = source;
    }

    queryString.cur = this.currency;

    this.httpMethod('GET', `/items/${sku}`, queryString, {}, function (err, body) {
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

    if (!this._canMakeRequest(2, callback)) {
        return;
    }

    opts.src = source;
    opts.cur = this.currency;

    this.httpMethod('GET', `/items/${sku}/history`, opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getSnapshots = function (sku, opts, callback) {
    if (!this._canMakeRequest(2, callback)) {
        return;
    }

    this.httpMethod('GET', `/items/${sku}/snapshots`, opts, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getSnapshot = function (snapshotId, callback) {
    if (!this._canMakeRequest(1, callback)) {
        return;
    }

    this.httpMethod('GET', `/snapshots/${snapshotId}`, {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.getRecentSnapshot = function (sku, callback) {
    if (!this._canMakeRequest(1, callback)) {
        return;
    }

    this.httpMethod('GET', `/items/${sku}/snapshot`, {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype.requestCheck = function (sku, source, callback) {
    if (!this._canMakeRequest(1, callback)) {
        return;
    }

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
    if (!this._canMakeRequest(1, callback)) {
        return;
    }

    this.httpMethod('POST', `/items/${sku}/snapshot`, {}, {}, function (err, body) {
        if (err) {
            return callback(err, body);
        }

        callback(null, body);
    });
};

PricesTF.prototype._canMakeRequest = function (consume, callback) {
    if (!this.ready) {
        callback(new Error('You need to initialize the module with `ptf.init` before using it'));
        return false;
    } else if (!this.ratelimit) {
        return true;
    }

    const canAfford = this.ratelimit.remaining - consume >= 0;

    if (!canAfford) {
        callback(new Error('Can\'t afford requesting this endpoint'));
    }

    return canAfford;
};

module.exports = PricesTF;
