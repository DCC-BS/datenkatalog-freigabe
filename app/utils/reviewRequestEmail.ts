import {
    type CatalogAssetType,
    catalogUrl,
    type DataOwner,
} from "#shared/dataspot";

export const REVIEW_REQUEST_SUBJECT =
    "Datenkatalog: Prüfung und Freigabe der Metadaten";

export const REVIEW_REQUEST_BODY = `Guten Tag {givenName}

Wir haben fast alle Metadaten fertig erfasst. Nun beginnen wir mit der Freigabe der bereits erfassten Metadaten. Hier ist das Resultat.

Könntest du bitte die Beschreibungen sowie die Angaben zu den Personendaten, der Schutzbedarfsstufe und der Vertraulichkeit der Datenprodukte kurz prüfen?

{assetList}

Anpassungen kannst du entweder direkt über das Stift-Symbol im Datenkatalog vornehmen oder mir deine Änderungswünsche einfach mitteilen.

{dataOwnerLine}

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
    dataOwners: DataOwner[],
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
            .replace("{dataOwnerLine}", buildDataOwnerLine(dataOwners))
            .replace("{weisungLine}", weisungLine),
    };
}

function buildDataOwnerLine(dataOwners: DataOwner[]): string {
    if (dataOwners.length === 0) return "KEIN DATA OWNER GEFUNDEN";

    const names = dataOwners.map(
        (owner) => `${owner.givenName} ${owner.familyName}`,
    );
    const recipients =
        names.length === 1
            ? `dem Data Owner, ${names[0]},`
            : `den Data Owners, ${names.slice(0, -1).join(", ")} und ${names.at(-1)},`;
    return `Nach deiner Unterschrift würden wir die Mail ${recipients} zur Freigabe weiterleiten.`;
}

export function buildMailtoLink(
    recipient: string,
    subject: string,
    body: string,
): string {
    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
