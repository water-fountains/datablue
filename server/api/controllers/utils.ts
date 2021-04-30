import { Request } from 'express';

export function getSingleQueryParam(req: Request, paramName: string, isOptional: false): string;

export function getSingleQueryParam(req: Request, paramName: string, isOptional: true): string | undefined;
export function getSingleQueryParam(req: Request, paramName: string, isOptional: true): string | undefined;
export function getSingleQueryParam(req: Request, paramName: string): string;
export function getSingleQueryParam(req: Request, paramName: string, isOptional = false): string | undefined {
  const v = req.query[paramName];
  // looks like we sometimes get numbers and not string even though query[x] does not include it in its type signature
  if (typeof v === 'string' || typeof v === 'number') return v;
  else if (v === undefined && isOptional) return v;
  else throw Error(`${paramName} is not a single parameter, was ${JSON.stringify(v)} ${typeof v}`);
}
