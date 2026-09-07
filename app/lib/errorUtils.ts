/**
 * Safe and human-readable error formatting utility.
 * Prevents '[object Object]' leaks from FastAPI, Pydantic, or fetch exceptions.
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    if (error.message && error.message !== '[object Object]') {
      return error.message;
    }
  }

  if (typeof error === 'object') {
    const errObj = error as Record<string, any>;

    // 1. Direct string fields
    if (typeof errObj.error === 'string') return errObj.error;
    if (typeof errObj.detail === 'string') return errObj.detail;
    if (typeof errObj.message === 'string' && errObj.message !== '[object Object]') return errObj.message;

    // 2. FastAPI / Pydantic validation errors array
    if (Array.isArray(errObj.detail)) {
      const messages = errObj.detail.map((d: any) => {
        if (typeof d === 'string') return d;
        if (d?.msg) {
          const loc = Array.isArray(d.loc)
            ? ` (${d.loc.filter((l: any) => l !== 'body').join('.')})`
            : '';
          return `${d.msg}${loc}`;
        }
        if (d?.message) return d.message;
        return JSON.stringify(d);
      });
      return messages.join(', ');
    }

    // 3. Nested error objects (e.g. { error: { message: "..." } })
    if (errObj.error && typeof errObj.error === 'object') {
      return formatErrorMessage(errObj.error);
    }
    if (errObj.detail && typeof errObj.detail === 'object') {
      return formatErrorMessage(errObj.detail);
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // ignore
    }
  }

  return String(error);
}
