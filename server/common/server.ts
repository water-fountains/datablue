/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { swaggerify } from './swagger';
import { l } from './logger';
import * as fs from 'fs';
import { logIncomingRequests } from '../middleware/log.incoming';
import buildInfo from './build.info';

export class ExpressServer {
  private app = express();

  constructor() {
    const root = path.normalize(`${__dirname}/../..`);
    this.app.set('appPath', `${root}client`);
    this.app.use(cors()); // allow cross-origin requests
    this.app.use(helmet()); // helmet helps secure Express apps with appropriate HTTP headers
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cookieParser(process.env.SESSION_SECRET)); // sign cookies. not sure what benefit is. See https://github.com/expressjs/cookie-parser
    this.app.use(logIncomingRequests(l)); // log all incoming requests for debugging
    this.app.use(express.static(`${root}/public`));
  }

  // swaggerify uses the api definition in common/swagger/Api.yml to configure api endpoints
  router(routeProvider: (express: express.Express) => express.Router) {
    swaggerify(this.app, routeProvider);
    return this;
  }

  listen() {
    let privateKey = '';
    let certificate = '';
    let port = '';

    if (process.env.NODE_ENV === 'production') {
      // When running in production mode, read private key and certificate for encryption
      try {
        privateKey = fs.readFileSync('privatekey.pem').toString();
        certificate = fs.readFileSync('certificate.pem').toString();
      } catch (error) {
        l.info('could not read privatekey or/and certificate, will startup in http');
      }
      // use port 3001 running the stable branch, otherwise use port 3000
      port = buildInfo.branch === 'stable' ? '3001' : '3000';
    } else {
      // if not running in production, then use the port as defined in the .env file and if not defined, fall back to 3000
      port = process.env.PORT || '3000';
    }

    const hasCertificate = privateKey && certificate;
    const welcome = (p: string) => () =>
      l.info(
        `server.js: up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${p} via ${
          hasCertificate ? 'https' : 'http'
        }`
      );
    if (hasCertificate) {
      https
        .createServer(
          {
            key: privateKey,
            cert: certificate,
          },
          this.app
        )
        .listen(port, welcome(port));
      return this.app;
    } else {
      http.createServer(this.app).listen(port, welcome(port));
      return this.app;
    }
  }
}
