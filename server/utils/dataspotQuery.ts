import { consola } from "consola";
import {
    DATASPOT_BASE_URL,
    DATASPOT_DATABASE,
    type DataspotErrorCode,
} from "#shared/dataspot";

const QUERY_URL = `${DATASPOT_BASE_URL}/api/${DATASPOT_DATABASE}/queries/download?format=JSON`;
const QUERY_TIMEOUT_MS = 120_000;
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QueryRow = Record<string, unknown>;

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

function getHttpStatus(error: unknown): number | undefined {
    if (typeof error !== "object" || error === null) return undefined;
    const { status, statusCode } = error as {
        status?: number;
        statusCode?: number;
    };
    return status ?? statusCode;
}

function isTimeout(error: unknown): boolean {
    if (typeof error !== "object" || error === null) return false;
    const { name, cause } = error as {
        name?: string;
        cause?: { name?: string };
    };
    return (
        name === "TimeoutError" ||
        name === "AbortError" ||
        cause?.name === "TimeoutError" ||
        cause?.name === "AbortError"
    );
}

function toClientError(error: unknown) {
    const status = getHttpStatus(error);
    const message = error instanceof Error ? error.message : String(error);

    let code: DataspotErrorCode;
    let statusCode: number;
    if (status === 401) {
        code = "DATASPOT_AUTH_FAILED";
        statusCode = 502;
        consola.error(
            `Dataspot rejected the credentials (HTTP 401). The client secret or the service user access key has likely expired: ${message}`,
        );
    } else if (message.startsWith("Environment variable")) {
        code = "DATASPOT_AUTH_FAILED";
        statusCode = 502;
        consola.error(`Dataspot configuration incomplete: ${message}`);
    } else if (isTimeout(error)) {
        code = "DATASPOT_TIMEOUT";
        statusCode = 504;
        consola.error(
            `Dataspot query timed out after ${QUERY_TIMEOUT_MS} ms: ${message}`,
        );
    } else {
        code = "DATASPOT_QUERY_FAILED";
        statusCode = 502;
        const responseBody = (error as { data?: unknown }).data;
        consola.error(
            `Dataspot query failed (HTTP ${status ?? "n/a"}): ${message}`,
            responseBody ?? "",
        );
    }

    return createError({
        statusCode,
        statusMessage: "Bad Gateway",
        data: { code },
    });
}

export async function executeQuery(
    sql: string,
    params: Record<string, string> = {},
): Promise<QueryRow[]> {
    let resolvedSql = sql;
    for (const [name, value] of Object.entries(params)) {
        if (!isUuid(value)) {
            throw createError({
                statusCode: 400,
                statusMessage: "Bad Request",
                data: { code: "INVALID_PARAMETER" },
            });
        }
        resolvedSql = resolvedSql.replaceAll(`{${name}}`, value);
    }

    try {
        const headers = await getDataspotHeaders();
        return await $fetch<QueryRow[]>(QUERY_URL, {
            method: "PUT",
            body: { sql: resolvedSql },
            headers,
            timeout: QUERY_TIMEOUT_MS,
        });
    } catch (error) {
        throw toClientError(error);
    }
}
