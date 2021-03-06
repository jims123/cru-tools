/**
 * Module dependencies.
 */

process.env.DEBUG= 'cru-tool:server,cru-tool:lic,cru-tool:task';
const app = require('../app');
const debug = require('debug')('cru-tool:server');
const fs = require('fs');
const path = require('path');
// var http = require('http');
const https = require('https');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(CT.config.PORT);
app.set('port', port);

/**
 * Create HTTP server.
 */

// var server = http.createServer(app);

const opts = {
    key: fs.readFileSync(path.resolve(__dirname, '../certs/privatekey.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '../certs/certificate.pem'))
};
const server = https.createServer(opts, app);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            debug(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            debug(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


