import type { H3Event } from "h3";

export const DCC_ROLE = "dcc";

export async function requireUserSession(event: H3Event): Promise<SessionUser> {
    const session = await getUserSession(event);
    if (!session) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
    return session;
}

export function isDcc(session: SessionUser): boolean {
    return Array.isArray(session.roles) && session.roles.includes(DCC_ROLE);
}

export function isSameEmail(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
}
