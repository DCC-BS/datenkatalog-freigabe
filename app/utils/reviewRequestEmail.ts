import { type CatalogAssetType, catalogUrl } from "#shared/dataspot";

export const REVIEW_REQUEST_SUBJECT =
    "Datenkatalog: Prüfung und Freigabe der Metadaten";

export const REVIEW_REQUEST_BODY = `Guten Tag {givenName}

Wir haben fast alle Metadaten fertig erfasst. Nun beginnen wir mit der Freigabe der bereits erfassten Metadaten. Hier ist das Resultat.

Könntest du bitte die Beschreibungen sowie die Angaben zu den Personendaten, der Schutzbedarfsstufe und der Vertraulichkeit der Datenprodukte kurz prüfen?

{assetList}

Anpassungen kannst du entweder direkt über das Stift-Symbol im Datenkatalog vornehmen oder mir deine Änderungswünsche einfach mitteilen.

Vielen Dank nochmals für deine Zeit und Unterstützung!

Liebe Grüsse
Josephine`;

export interface EmailAsset {
    id: string;
    label: string;
}

export interface ReviewRequestEmail {
    subject: string;
    body: string;
}

export function buildReviewRequestEmail(
    givenName: string,
    assetType: CatalogAssetType,
    assets: EmailAsset[],
): ReviewRequestEmail {
    const assetList = assets
        .map(
            (asset) => `*\t${asset.label} <${catalogUrl(assetType, asset.id)}>`,
        )
        .join("\n");

    return {
        subject: REVIEW_REQUEST_SUBJECT,
        body: REVIEW_REQUEST_BODY.replace("{givenName}", givenName).replace(
            "{assetList}",
            assetList,
        ),
    };
}

export function buildMailtoLink(
    recipient: string,
    subject: string,
    body: string,
): string {
    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
