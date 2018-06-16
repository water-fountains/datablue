import Express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerify from './swagger';
import l from './logger';
import fs from 'fs';

let privateKey = '';
let certificate = '';
if(process.env.NODE_ENV === 'production') {
  privateKey = fs.readFileSync('privatekey.pem');
  certificate = fs.readFileSync('certificate.pem');
}

const app = new Express();

export default class ExpressServer {
  constructor() {
    const root = path.normalize(`${__dirname}/../..`);
    app.set('appPath', `${root}client`);
    app.use(cors());
    app.use(helmet());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(Express.static(`${root}/public`));
  }

  router(routes) {
    swaggerify(app, routes);
    return this;
  }

  listen(port = process.env.PORT) {
    const welcome = p => () => l.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${p}}`);
    if(process.env.NODE_ENV === 'production'){
      https.createServer({
        key: privateKey,
        cert: certificate
      }, app).listen(port, welcome(port));
      return app;
    }else{
      http.createServer(app).listen(port, welcome(port));
      return app;
    }
  }
}
