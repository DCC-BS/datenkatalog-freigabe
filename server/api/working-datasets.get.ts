import { consola } from "consola";
import type { WorkingDataset } from "#shared/dataspot";

export default defineEventHandler(async (event): Promise<WorkingDataset[]> => {
    const session = await requireUserSession(event);
    const { personId } = getQuery(event);
    if (!isUuid(personId)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            data: { code: "INVALID_PERSON_ID" },
        });
    }

    if (!isDcc(session)) {
        const logins = await executeQuery(PERSON_LOGINS_QUERY, {
            person_id: personId,
        });
        const isOwnPerson = logins.some((row) =>
            isSameEmail(String(row.email), session.email),
        );
        if (!isOwnPerson) {
            consola.warn(
                `Denied working datasets of person ${personId} to ${session.email}`,
            );
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                data: { code: "FORBIDDEN_PERSON" },
            });
        }
    }

    const rows = await executeQuery(WORKING_DATASETS_QUERY, {
        person_id: personId,
    });
    const datasets = rows.map((row) => ({
        postId: String(row.post_id),
        postLabel: String(row.post_label),
        datasetId: String(row.dataset_id),
        datasetLabel: String(row.dataset_label),
        collectionId: String(row.collection_id),
        collectionLabel: String(row.collection_label),
    }));
    consola.info(
        `Loaded ${datasets.length} working dataset rows for person ${personId}`,
    );
    return datasets;
});
