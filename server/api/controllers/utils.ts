import { Request } from 'express';

export function getSingleQueryParam(req: Request, paramName: string): string {
  const v = req.query[paramName];
  if (typeof v === 'string') return v;
  else throw Error(`${paramName} is not a single parameter, was ${JSON.stringify(v)}`);
}
