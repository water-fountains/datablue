/*
 * @license
 * (c) Copyright 2019 | MY-D Foundation | Created by Matthew Moy de Vitry
 * Use of this code is governed by the GNU Affero General Public License (https://www.gnu.org/licenses/agpl-3.0)
 * and the profit contribution agreement available at https://www.my-d.org/ProfitContributionAgreement
 */

import * as express from 'express';
import controller from './controller';
import { buildInfoController } from './build-info.controller';

// This file maps API routes to functions
export const Router = express
  .Router()
  .get('/fountain/', controller.getSingle)
  .get('/fountains/', controller.byLocation)
  .get('/metadata/fountain_properties/', controller.getPropertyMetadata)
  .get('/metadata/locations/', controller.getLocationMetadata)
  .get('/metadata/shared-constants/', controller.getSharedConstants)
  .get('/processing-errors/', controller.getProcessingErrors)
  .get('/build-info', buildInfoController)

