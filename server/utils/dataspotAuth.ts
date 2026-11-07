// Service-to-service (M2M) authentication for Dataspot, ported from dataspot_auth.py.
// This is NOT a login for app users.

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface TokenResponse {
    access_token: string;
    expires_in?: number | string;
}

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
}

async function requestBearerToken(): Promise<string> {
    const tenantId = requireEnv("DATASPOT_TENANT_ID");
    const exposedClientId = requireEnv("DATASPOT_EXPOSED_CLIENT_ID");

    const response = await $fetch<TokenResponse>(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
            method: "POST",
            body: new URLSearchParams({
                client_id: requireEnv("DATASPOT_CLIENT_ID"),
                client_secret: requireEnv("DATASPOT_CLIENT_SECRET"),
                grant_type: "client_credentials",
                scope: `api://${exposedClientId}/.default`,
            }),
            timeout: 30_000,
        },
    );

    const expiresInSeconds = Number(response.expires_in ?? 3600);
    cachedToken = response.access_token;
    cachedTokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    return cachedToken;
}

async function getBearerToken(): Promise<string> {
    if (
        cachedToken &&
        Date.now() < cachedTokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS
    ) {
        return cachedToken;
    }
    return requestBearerToken();
}

export async function getDataspotHeaders(): Promise<Record<string, string>> {
    const accessKey = requireEnv("DATASPOT_SERVICE_USER_ACCESS_KEY");
    const bearerToken = await getBearerToken();
    return {
        Authorization: `Bearer ${bearerToken}`,
        "dataspot-access-key": accessKey,
        "Content-Type": "application/json",
    };
}
