const io = require('socket.io-client');

const socket = io('https://api.prices.tf');
let timeout;

module.exports = function (token) {
    socket.on('connect', function () {
        clearTimeout(timeout);
        socket.emit('authentication', token);
    });

    socket.on('disconnect', function () {
        timeout = setInterval(function () {
            if (socket.connected) {
                clearInterval(timeout);
            } else {
                socket.connect();
            }
        }, 3000);
    });

    return socket;
};
