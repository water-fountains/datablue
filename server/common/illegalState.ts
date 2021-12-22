import l from '../common/logger';

/**
 * Since throw is not an expression in typescript you cannot do thing like ... || throw
 * Hence this function
 * @author Tegonal GmbH
 * @license AGPL
 */
export function illegalState(msg: string, ...optionalParams: any[]): never {
  const errorMsg = msg + ' ' + optionalParams.map(x => JSON.stringify(x)).join(' // ');
  l.error(errorMsg);
  throw new Error('IllegalState detected: ' + errorMsg);
}
