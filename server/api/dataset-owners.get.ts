import { consola } from "consola";
import type { DataOwner } from "#shared/dataspot";

export type DatasetOwnersResponse = Record<string, DataOwner[]>;

export default defineEventHandler(
    async (event): Promise<DatasetOwnersResponse> => {
        const session = await requireUserSession(event);
        const { personId, datasetIds: datasetIdsRaw } = getQuery(event);

        if (!isUuid(personId)) {
            throw createError({
                statusCode: 400,
                statusMessage: "Bad Request",
                data: { code: "INVALID_PERSON_ID" },
            });
        }

        const datasetIds = String(datasetIdsRaw ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (datasetIds.length === 0) {
            return {};
        }
        if (!datasetIds.every(isUuid)) {
            throw createError({
                statusCode: 400,
                statusMessage: "Bad Request",
                data: { code: "INVALID_PARAMETER" },
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
                    `Denied dataset owners of person ${personId} to ${session.email}`,
                );
                throw createError({
                    statusCode: 403,
                    statusMessage: "Forbidden",
                    data: { code: "FORBIDDEN_PERSON" },
                });
            }
        }

        const ownerRows = await executeQuery(
            dataOwnersByDatasetIdsQuery(datasetIds),
        );
        const ownersByDataset: DatasetOwnersResponse = {};
        for (const row of ownerRows) {
            const datasetId = String(row.dataset_id);
            const owners = ownersByDataset[datasetId] ?? [];
            owners.push({
                givenName: String(row.given_name),
                familyName: String(row.family_name),
            });
            ownersByDataset[datasetId] = owners;
        }

        consola.info(
            `Loaded owners for ${Object.keys(ownersByDataset).length} of ${datasetIds.length} datasets (person ${personId})`,
        );
        return ownersByDataset;
    },
);
