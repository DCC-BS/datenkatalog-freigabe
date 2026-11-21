import {
    type CatalogAssetType,
    catalogUrl,
    type DataOwner,
} from "#shared/dataspot";

export const REVIEW_REQUEST_SUBJECT =
    "Datenkatalog: Prüfung und Freigabe der Metadaten";

export const REVIEW_REQUEST_BODY = `Hallo {givenName}

Wir haben alle Metadaten im kantonalen Datenkatalog fertig erfasst! Hier siehst du das Resultat:
{assetList}

Könntest du bitte die folgenden Punkte für die oben genannten Datenprodukte überprüfen?
-\tBeschreibungen: Sind sie präzise und verständlich?
-\tPersonendaten: Sind die Angaben korrekt?
-\tSchutzbedarfsstufe: Sind die Angaben korrekt?*
-\tVertraulichkeit: Sind die Angaben korrekt?*

Anpassungen kannst du entweder direkt über das Stift-Symbol im Datenkatalog vornehmen oder mir deine Änderungswünsche per E-Mail oder in einem Teams-Call mitteilen.

Wenn alles für dich korrekt ist, bitte ich dich freundlich, das Freigabe-Dokument bis zum {deadline} via e-Signatur (https://esignatur.egov.bs.ch/) zu unterzeichnen. Sobald du die Metadaten für den Datenkatalog freigibst, {dataOwnerLine}

Bitte beachte den Hinweis zum kantonalen Datenportal im Freigabe-Dokument. Du kannst dich bei Bedarf entscheiden, ob bestimmte Metadaten nicht im Datenportal veröffentlicht werden sollen. Der Data Owner muss hierfür ohnehin auch die endgültige Genehmigung erteilen.

Bei Fragen bin ich gerne für dich da.

Vielen Dank nochmals für deine Zeit und Unterstützung!

Liebe Grüsse
{senderGivenName}

*{weisungLine}`;

const REVIEW_DEADLINE_DAYS = 14;

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
            .replace("{deadline}", buildDeadline())
            .replace("{dataOwnerLine}", buildDataOwnerLine(dataOwners))
            .replace("{weisungLine}", weisungLine),
    };
}

function buildDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + REVIEW_DEADLINE_DAYS);
    const day = String(deadline.getDate()).padStart(2, "0");
    const month = String(deadline.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${deadline.getFullYear()}`;
}

function buildDataOwnerLine(dataOwners: DataOwner[]): string {
    if (dataOwners.length === 0) return "KEIN DATA OWNER GEFUNDEN";

    const names = dataOwners.map(
        (owner) => `${owner.givenName} ${owner.familyName}`,
    );
    const recipients =
        names.length === 1
            ? `den Data Owner, ${names[0]},`
            : `die Data Owners, ${names.slice(0, -1).join(", ")} und ${names.at(-1)},`;
    return `kontaktieren wir ${recipients} um die Metadaten im Datenkatalog kantonsintern sichtbar zu machen.`;
}

export function buildMailtoLink(
    recipient: string,
    subject: string,
    body: string,
): string {
    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
