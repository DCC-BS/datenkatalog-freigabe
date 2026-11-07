import { consola } from "consola";
import type { WorkingDataset } from "#shared/dataspot";

export default defineEventHandler(async (event): Promise<WorkingDataset[]> => {
    const { personId } = getQuery(event);
    if (!isUuid(personId)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            data: { code: "INVALID_PERSON_ID" },
        });
    }

    const rows = await executeQuery(WORKING_DATASETS_QUERY, {
        person_id: personId,
    });
    const datasets = rows.map((row) => ({
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
