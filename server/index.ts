/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import * as dotenv from "dotenv";

dotenv.config();

[
  "PORT", //
  "REQUEST_LIMIT",
  "SESSION_SECRET",
  "SWAGGER_API_SPEC",
].forEach((name) => {
  if (process.env[name] === undefined) {
    throw Error(`make sure you define ${name} in .env, cannot start server`);
  }
});

import { Router } from "./api/controllers/router";
import { ExpressServer } from "./common/server";
import { Express } from "express";


export default new ExpressServer()
  .router((app: Express) => app.use("/api/v1", Router))
  .listen();
