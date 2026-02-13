import { Request, Response, NextFunction } from 'express';
import { CustomLogger } from '../common/logger';

export function logIncomingRequests(logger: CustomLogger): (req: Request, _res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    // without custom serializers, we must be explicit
    if (req.url !== '/json' && req.url !== '/json/version') {
      logger.info(`logIncomingRequests: ${req.url}`);
    }
    next();
  };
}
