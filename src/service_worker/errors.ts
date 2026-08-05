export function wrapError(message: string, cause: unknown): Error {
    return new Error(message, { cause });
}

/** A non-2xx Helix response. `retryAfterMs` is null when the server gave no hint. */
export class HttpError extends Error {
    constructor(public status: number, public retryAfterMs: number | null, url: string) {
        super(`HTTP ${status} for ${url}`);
        this.name = 'HttpError';
    }
}

/** Walks the `cause` chain, since callers rewrap every error with wrapError. */
export function findCause<T>(error: unknown, ctor: new (...args: any[]) => T): T | undefined {
    let current: unknown = error;

    while (current) {
        if (current instanceof ctor) return current;
        current = current instanceof Error ? current.cause : undefined;
    }

    return undefined;
}

export function errorToString(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

export function logErrorChain(context: string, error: unknown) {
    console.error(`[${context}]`, error);

    let currentCause = error instanceof Error ? error.cause : undefined;
    let depth = 1;

    while (currentCause) {
        console.error(`[${context}] cause ${depth}:`, currentCause);
        currentCause = currentCause instanceof Error ? currentCause.cause : undefined;
        depth += 1;
    }
}
