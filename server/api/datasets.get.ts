import { consola } from "consola";
import type { Dataset } from "#shared/dataspot";

export default defineEventHandler(async (event): Promise<Dataset[]> => {
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
                `Denied datasets of person ${personId} to ${session.email}`,
            );
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                data: { code: "FORBIDDEN_PERSON" },
            });
        }
    }

    const rows = await executeQuery(DATASETS_QUERY, { person_id: personId });
    const datasets = rows.map((row) => ({
        datasetId: String(row.dataset_id),
        datasetLabel: String(row.dataset_label),
        collectionId: String(row.collection_id),
        collectionLabel: String(row.collection_label),
        dataOwners: [],
    }));
    consola.info(
        `Loaded ${datasets.length} dataset rows for person ${personId}`,
    );
    return datasets;
});
