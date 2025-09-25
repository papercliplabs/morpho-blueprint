import { ensureError } from "./error";

export type Result<T, E = Error> = { data: T; error: null } | { data: null; error: E };

// Utility to flatten the promise into a result object that helps avoid deeply nested try/catch blocks
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (e) {
    const error = ensureError(e);
    return { data: null, error: error as E };
  }
}
