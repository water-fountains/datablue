import * as express from 'express';
import controller from './controller';

export default express
  .Router()
  .post('/examples/', controller.create)
  .get('/examples/', controller.all)
  .get('/fountain/', controller.byCoords)
  .get('/examples/:id', controller.byId);
