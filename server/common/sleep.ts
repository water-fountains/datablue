/**
 * primitive sleep function using setTimeout
 * @author Tegonal GmbH
 * @license AGPL
 */
export async function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve, _) => setTimeout(resolve, milliseconds));
}
