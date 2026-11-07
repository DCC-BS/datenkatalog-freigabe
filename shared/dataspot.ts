export const DATASPOT_BASE_URL = "https://datenkatalog.bs.ch";
export const DATASPOT_DATABASE = "prod";

export type CatalogAssetType = "datasets" | "collections";

export function catalogUrl(type: CatalogAssetType, id: string): string {
    return `${DATASPOT_BASE_URL}/web/${DATASPOT_DATABASE}/${type}/${id}`;
}

export interface Person {
    id: string;
    givenName: string;
    familyName: string;
    email: string;
}

export interface WorkingDataset {
    postId: string;
    postLabel: string;
    datasetId: string;
    datasetLabel: string;
    collectionId: string;
    collectionLabel: string;
}

export type DataspotErrorCode =
    | "DATASPOT_AUTH_FAILED"
    | "DATASPOT_TIMEOUT"
    | "DATASPOT_QUERY_FAILED";
