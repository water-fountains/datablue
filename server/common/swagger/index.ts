/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import { Express, Router } from 'express';
import middleware from 'swagger-express-middleware';
import * as path from 'path';

export function swaggerify(app: Express, routerProvider: (app: Express) => Router): void {
  middleware(path.join(__dirname, 'Api.yaml'), app, (_err, mw) => {
    // Enable Express' case-sensitive and strict options
    // (so "/entities", "/Entities", and "/Entities/" are all different)
    app.enable('case sensitive routing');
    app.enable('strict routing');

    app.use(mw.metadata());
    app.use(
      mw.files({
        useBasePath: true,
        apiPath: process.env.SWAGGER_API_SPEC,
        // Disable serving the "Api.yaml" file
        // rawFilesPath: false
      })
    );

    app.use(
      mw.parseRequest({
        // Configure the cookie parser to use secure cookies
        cookie: {
          secret: process.env.SESSION_SECRET,
        },
        json: {
          limit: process.env.REQUEST_LIMIT,
        },
      })
    );

    // These two middleware don't have any options (yet)
    app.use(mw.CORS(), mw.validateRequest());

    // Error handler to display the validation error as HTML
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500);
      res.header('Content-Type', 'text/html');
      res.send(`<h1>${err.status || 500} Error</h1>` + `<pre>${err.message}</pre>`);
    });

    routerProvider(app);
  });
}
