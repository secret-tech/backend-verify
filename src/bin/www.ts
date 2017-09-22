import server from '../server';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import config from '../config';

/**
 * Create HTTP server.
 */
const httpServer = http.createServer(server);

/**
 * Listen on provided port, on all network interfaces.
 */
httpServer.listen(config.server.port);

if (config.server.httpsServer === 'enabled') {
  const httpsOptions = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert: fs.readFileSync(__dirname + '/auth.crt')
  };
  const httpsServer = https.createServer(httpsOptions, server);
  httpsServer.listen(config.server.httpsPort);
}
