const request = require('@nicklason/request-retry');
const moment = require('moment');

const baseUrl = 'https://api.prices.tf';

const PricesTF = require('../index');

PricesTF.prototype.httpMethod = function (httpMethod, method, queryString, body, callback) {
    const options = {
        method: httpMethod,
        url: `${baseUrl}${method}`,
        qs: queryString,
        body: body,
        timeout: 10000,
        json: true
    };

    if (this.token) {
        options.headers = {
            Authorization: `Token ${this.token}`
        };
    }

    request(options, (err, response, body) => {
        if (response) {
            if (response.statusCode === 429) {
                const retryAfter = moment().add(response.headers['retry-after'], 'seconds');
                this.retryAfter = retryAfter;
                this.emit('ratelimited', retryAfter);
            } else if (response.headers['x-ratelimit-limit']) {
                const ratelimit = {};
                ratelimit.limit = parseInt(response.headers['x-ratelimit-limit']);
                ratelimit.remaining = parseInt(response.headers['x-ratelimit-remaining']);
                ratelimit.reset = moment.unix(parseInt(response.headers['x-ratelimit-reset']));

                this.emit('ratelimit', ratelimit);
            }
        }

        callback(err, body);
    });
};