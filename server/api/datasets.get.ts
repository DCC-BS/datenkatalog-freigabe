import { consola } from "consola";
import type { DataOwner, Dataset } from "#shared/dataspot";

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

    const [rows, ownerRows] = await Promise.all([
        executeQuery(DATASETS_QUERY, { person_id: personId }),
        executeQuery(DATA_OWNERS_QUERY, { person_id: personId }),
    ]);

    const ownersByDataset = new Map<string, DataOwner[]>();
    for (const row of ownerRows) {
        const datasetId = String(row.dataset_id);
        const owners = ownersByDataset.get(datasetId) ?? [];
        owners.push({
            givenName: String(row.given_name),
            familyName: String(row.family_name),
        });
        ownersByDataset.set(datasetId, owners);
    }

    const datasets = rows.map((row) => ({
        postId: String(row.post_id),
        postLabel: String(row.post_label),
        datasetId: String(row.dataset_id),
        datasetLabel: String(row.dataset_label),
        collectionId: String(row.collection_id),
        collectionLabel: String(row.collection_label),
        dataOwners: ownersByDataset.get(String(row.dataset_id)) ?? [],
    }));
    consola.info(
        `Loaded ${datasets.length} dataset rows and ${ownerRows.length} data owner rows for person ${personId}`,
    );
    return datasets;
});
