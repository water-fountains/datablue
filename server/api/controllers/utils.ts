import { Request } from 'express';
import { isArray, isObject } from 'lodash';

export function getSingleStringQueryParam(req: Request, paramName: string): string;
export function getSingleStringQueryParam(req: Request, paramName: string, isOptional: true): string | undefined;
export function getSingleStringQueryParam(req: Request, paramName: string, isOptional = false): string | undefined {
  return getSingleQueryParamTypeOfCheck(req, paramName, isOptional, 'string');
}

export function getSingleNumericQueryParam(req: Request, paramName: string): number;
export function getSingleNumericQueryParam(req: Request, paramName: string, isOptional: true): number | undefined;
export function getSingleNumericQueryParam(req: Request, paramName: string, isOptional = false): number | undefined {
  return getSingleQueryParam(
    req,
    paramName,
    isOptional,
    'numeric',
    v => isNumeric(v),
    v => Number(v)
  );
}

export function isNumeric(v: string | undefined): boolean {
  if (typeof v === 'number') return true;
  if (typeof v !== 'string') return false;
  return (
    // we also use parseFloat next to Number because Number returns 0 for a blank string and we don't want to accept a blank string
    // on the other hand parseFloat accepts things like `10 bananas` which we also don't want, thus the combination
    !isNaN(Number(v)) && !isNaN(parseFloat(v))
  );
}

export function getSingleBooleanQueryParam(req: Request, paramName: string): boolean;
export function getSingleBooleanQueryParam(req: Request, paramName: string, isOptional: true): boolean | undefined;
export function getSingleBooleanQueryParam(req: Request, paramName: string, isOptional = false): boolean | undefined {
  return getSingleQueryParam(
    req,
    paramName,
    isOptional,
    'boolean',
    v => typeof v === 'boolean' || v === 'true' || v === 'false',
    v => (typeof v === 'boolean' ? v : v === 'true')
  );
}

function getSingleQueryParamTypeOfCheck<T>(
  req: Request,
  paramName: string,
  isOptional: boolean,
  type: string
): T | undefined {
  return getSingleQueryParam(
    req,
    paramName,
    isOptional,
    type,
    v => typeof v === type,
    v => v as unknown as T
  );
}

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}

function getSingleQueryParam<T>(
  req: Request,
  paramName: string,
  isOptional: boolean,
  type: string,
  typeCheck: (v: string | undefined) => boolean,
  typeConversion: (v: string | undefined) => T
): T | undefined {
  const param: undefined | string | string[] | ParsedQs[] = throwIfParsedQs(req.query[paramName], paramName);
  if (isArray(param)) {
    return getSingleQueryParamFromArray(param, paramName, isOptional, type, typeCheck, typeConversion);
  } else {
    return typeCheckAndConvertParam(param, paramName, isOptional, type, typeCheck, typeConversion);
  }
}

function getSingleQueryParamFromArray<T>(
  arr: string[] | ParsedQs[],
  paramName: string,
  isOptional: boolean,
  type: string,
  typeCheck: (v: string | undefined) => boolean,
  typeConversion: (v: string | undefined) => T
): T | undefined {
  if (arr.length === 0 && isOptional) {
    return undefined;
  } else if (arr.length > 1) {
    throw Error(`${paramName} is not a single parameter, was ${JSON.stringify(arr)} with type ${typeof arr}`);
  } else {
    return typeCheckAndConvertParam(
      throwIfParsedQs(arr[0], paramName),
      paramName,
      isOptional,
      type,
      typeCheck,
      typeConversion
    );
  }
}

function typeCheckAndConvertParam<T>(
  param: string | undefined,
  paramName: string,
  isOptional: boolean,
  type: string,
  typeCheck: (v: string | undefined) => boolean,
  typeConversion: (v: string | undefined) => T
): T | undefined {
  if (param === undefined && isOptional) {
    return undefined;
  } else if (typeCheck(param)) {
    return typeConversion(param);
  } else {
    throw Error(
      `${paramName} was of a wrong type, expected ${type} was ${JSON.stringify(param)} with type ${typeof param}`
    );
  }
}

function throwIfParsedQs<T>(param: T | ParsedQs, paramName: string): T {
  if (isObject(param)) {
    throw Error(
      `${paramName} is not a single parameter, was an object ${JSON.stringify(param)} with type ${typeof param}`
    );
  } else {
    return param;
  }
}
