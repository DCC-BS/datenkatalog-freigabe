interface FeedbackBody {
    rating?: string;
    message?: string;
    email?: string;
    attachments?: unknown[];
}

interface FeedbackResponse {
    ok: boolean;
    simulated?: boolean;
    issueUrl?: string | null;
    message?: string;
}

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    const body = await readBody<FeedbackBody>(event);

    const message = body?.message?.trim() || "";
    const email = session.email?.trim() || "";
    const name = session.name?.trim() || "";
    const rating = body?.rating || "not-selected";

    if (!message) {
        throw createError({
            statusCode: 400,
            statusMessage: "Message is required.",
        });
    }

    const runtimeConfig = useRuntimeConfig(event);
    const feedbackConfig = (runtimeConfig.feedback || {}) as {
        repoOwner?: string;
        repo?: string;
        project?: string;
        githubToken?: string;
        label?: string;
    };

    const repoOwner = feedbackConfig.repoOwner || "";
    const repo = feedbackConfig.repo || "";
    const githubToken = feedbackConfig.githubToken || "";
    const project = feedbackConfig.project || "";
    const issueLabel = feedbackConfig.label || project;

    const words = message.split(/\s+/);
    const title =
        words.length > 5
            ? `${project} - ${words.slice(0, 5).join(" ")} ...`
            : `${project} - ${message}`;

    const createdAt = new Date().toISOString();
    const issueBody = [
        `Project: ${project || "n/a"}`,
        `Created: ${createdAt}`,
        "",
        `**Rating:** ${rating}`,
        `**Name:** ${name || "n/a"}`,
        `**Email:** ${email || "n/a"}`,
        "",
        "**Message**",
        message,
    ].join("\n");

    if (!githubToken || !repoOwner || !repo) {
        if (import.meta.dev) {
            console.info(
                "[feedback] Local fallback: feedback accepted without GitHub issue.",
                { title, issueBody },
            );
            return {
                ok: true,
                simulated: true,
                issueUrl: null,
                message:
                    "Feedback was simulated locally because GitHub feedback config is incomplete.",
            } satisfies FeedbackResponse;
        }

        throw createError({
            statusCode: 503,
            statusMessage: "Feedback service is not configured.",
        });
    }

    const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "datenkatalog-freigabe-feedback",
    };

    let response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repo}/issues`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                title,
                body: issueBody,
                labels: [issueLabel],
            }),
        },
    );

    // Fallback: if label is missing in repo, create issue without labels
    if (!response.ok && response.status === 422) {
        response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repo}/issues`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    title,
                    body: issueBody,
                }),
            },
        );
    }

    if (!response.ok) {
        const responseText = await response.text();
        throw createError({
            statusCode: 502,
            statusMessage: `Feedback issue creation failed: ${responseText}`,
        });
    }

    const issue = (await response.json()) as { html_url?: string };
    return {
        ok: true,
        issueUrl: issue.html_url || null,
    } satisfies FeedbackResponse;
});
