import * as express from 'express';
import controller from './controller';

export default express
  .Router()
  .get('/fountain/:queryType/', controller.getSingle)
  .get('/fountains/', controller.byLocation)
