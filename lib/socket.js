const io = require('socket.io-client');

const package = require('../package');

const socket = io('wss://api.prices.tf', {
    extraHeaders: {
        'User-Agent': `node-${package.name}@${package.version}`
    }
});

let timeout;

module.exports = function (token) {
    socket.on('connect', function () {
        clearInterval(timeout);
        const args = ['authentication'];
        if (token) {
            args.push(token);
        }
        socket.emit.call(this, ...args);
    });

    socket.on('disconnect', function () {
        timeout = setInterval(function () {
            // If the socket has been destroyed, or we are connected, then stop the connect loop
            if (!socket.subs || socket.connected) {
                clearInterval(timeout);
            } else {
                socket.connect();
            }
        }, 3000);
    });

    return socket;
};
