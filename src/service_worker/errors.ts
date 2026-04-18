export function wrapError(message: string, cause: unknown): Error {
    return new Error(message, { cause });
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
