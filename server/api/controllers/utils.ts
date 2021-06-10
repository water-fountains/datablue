import { Request } from 'express';

export function getSingleStringQueryParam(req: Request, paramName: string): string;
export function getSingleStringQueryParam(req: Request, paramName: string, isOptional: true): string | undefined;
export function getSingleStringQueryParam(req: Request, paramName: string, isOptional = false): string | undefined {
  return getSingleQueryParam(req, paramName, isOptional, 'string');
}

export function getSingleNumberQueryParam(req: Request, paramName: string): number;
export function getSingleNumberQueryParam(req: Request, paramName: string, isOptional: true): number | undefined;
export function getSingleNumberQueryParam(req: Request, paramName: string, isOptional = false): number | undefined {
  return getSingleQueryParam(req, paramName, isOptional, 'number');
}

export function getSingleBooleanQueryParam(req: Request, paramName: string): boolean;
export function getSingleBooleanQueryParam(req: Request, paramName: string, isOptional: true): boolean | undefined;
export function getSingleBooleanQueryParam(req: Request, paramName: string, isOptional = false): boolean | undefined {
  return getSingleQueryParam(req, paramName, isOptional, 'boolean');
}

function getSingleQueryParam<T>(req: Request, paramName: string, isOptional: boolean, type: string): T | undefined {
  const v = req.query[paramName];
  // looks like we sometimes get numbers or booleans and not string even though query[x] does not include it in its type signature
  // since we cannot che
  if (typeof v === type) return v as unknown as T;
  else if (v === undefined && isOptional) return undefined;
  else throw Error(`${paramName} is not a single parameter, was ${JSON.stringify(v)} ${typeof v}`);
}
