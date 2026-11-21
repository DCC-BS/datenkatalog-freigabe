import { type CatalogAssetType, catalogUrl } from "#shared/dataspot";

export const REVIEW_REQUEST_SUBJECT =
    "Datenkatalog: Prüfung und Freigabe der Metadaten";

export const REVIEW_REQUEST_BODY = `Guten Tag {givenName}

Wir haben fast alle Metadaten fertig erfasst. Nun beginnen wir mit der Freigabe der bereits erfassten Metadaten. Hier ist das Resultat.

Könntest du bitte die Beschreibungen sowie die Angaben zu den Personendaten, der Schutzbedarfsstufe und der Vertraulichkeit der Datenprodukte kurz prüfen?

{assetList}

Anpassungen kannst du entweder direkt über das Stift-Symbol im Datenkatalog vornehmen oder mir deine Änderungswünsche einfach mitteilen.

Vielen Dank nochmals für deine Zeit und Unterstützung!

{weisungLine}

Liebe Grüsse
{senderGivenName}`;

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
    senderGivenName: string,
    assetType: CatalogAssetType,
    assets: EmailAsset[],
    weisungUrl: string,
): ReviewRequestEmail {
    const assetList = assets
        .map(
            (asset) => `-\t${asset.label} (${catalogUrl(assetType, asset.id)})`,
        )
        .join("\n");

    const trimmedWeisungUrl = weisungUrl.trim();
    const weisungLine = trimmedWeisungUrl
        ? `Mehr Informationen zu Schutzbedarfsstufe (Kapitel 3) und Vertraulichkeit (Kapitel 3.1) gibt es hier: ${trimmedWeisungUrl}`
        : "PLEASE SET NUXT_PUBLIC_WEISUNG_SCHUTZMASSNAHMEN_URL IN .ENV";

    return {
        subject: REVIEW_REQUEST_SUBJECT,
        body: REVIEW_REQUEST_BODY.replace("{givenName}", givenName)
            .replace("{senderGivenName}", senderGivenName)
            .replace("{assetList}", assetList)
            .replace("{weisungLine}", weisungLine),
    };
}

export function buildMailtoLink(
    recipient: string,
    subject: string,
    body: string,
): string {
    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
