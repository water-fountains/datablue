import * as express from 'express';
import controller from './controller';

export default express
  .Router()
  .get('/fountain/', controller.getSingle)
  .get('/fountains/', controller.byLocation)
