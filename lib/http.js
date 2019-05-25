const PricesTF = require('../index');

/**
 * Gets the pricelist
 * @param {String} [source] The source(s) to get
 * @param {Function} callback Function to call when done
 */
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

/**
 * Gets the item schema of all items known by PricesTF to exist
 * @param {Function} callback
 */
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

/**
 * Gets the price of an item
 * @param {String} sku SKU of the item
 * @param {String} [source] The source(s) to get
 * @param {Function} callback Function to call when done
 */
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

/**
 * Gets a list of prices that the item has been priced at
 * @param {String} sku SKU of the item
 * @param {String} source Source of the price
 * @param {Object} [opts] Additional query options
 * @param {Function} callback Function to call when done
 */
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

/**
 * Gets a list of the most recent snapshots taken of an item
 * @param {String} sku SKU of the item
 * @param {Object} [opts] Additional query options
 * @param {Boolean} [opts.listings] Populate snapshots with listings
 * @param {Boolean} [opts.empty] Get empty snapshots
 * @param {Number} [opts.limit] Amount of snapshots to get
 * @param {Number} [opts.time] Unix time for when to get the snapshots from
 * @param {Function} callback Function to call when done
 */
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

/**
 * Finds snapshot by snapshot id
 * @param {String} snapshotId Id of the snapshot
 * @param {Function} callback Function to call when done
 */
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

/**
 * Gets the most recent snapshot taken of an item
 * @param {String} sku SKU of the item
 * @param {Function} callback Function to call when done
 */
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

/**
 * Request a price check for an item
 * @param {String} sku SKU of the item
 * @param {String} source Source to check (bptf, mptf, scm)
 * @param {Function} callback Function to call when done
 */
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

/**
 * Requests a snapshot to be taken of an item
 * @param {String} sku SKU of the item
 * @param {Function} callback Function to call when done
 */
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

/**
 * Check if we can afford to consume points
 * @param {Number} consume Amount of points to consume
 * @param {Function} callback Function to call when done
 * @return {Boolean} Returns true if we can consume the points
 */
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
