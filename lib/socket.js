const io = require('socket.io-client');

const package = require('../package');

const socket = io('wss://api.prices.tf', {
    extraHeaders: {
        'User-Agent': `node-${package.name}@${package.version}`
    },
    forceNew: true
});

socket.on('disconnect', function (reason) {
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

module.exports = function (token) {
    socket.on('connect', function () {
        const args = ['authentication'];
        if (token) {
            args.push(token);
        }
        socket.emit.call(this, ...args);
    });

    return socket;
};
