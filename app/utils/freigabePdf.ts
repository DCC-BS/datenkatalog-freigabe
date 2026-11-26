export const FREIGABE_PDF_TEXT = {
    department: "Präsidialdepartement des Kantons Basel-Stadt",
    unit: "Data Competence Center",
    titleLines: [
        "Freigabe der Veröffentlichung von Metadaten",
        "im kantonalen Datenkatalog",
    ],
    catalogUrl: "https://datenkatalog.bs.ch",
    heading: "Fachliche Verantwortung – Data Steward",
    intro: "Hiermit gebe ich als Data Steward die Metadaten der folgenden Datenprodukte,",
    exceptionsIntro:
        "Von dieser Veröffentlichung im kantonalen Datenportal (https://data.bs.ch/) sind folgende Datenprodukte ausgenommen:",
    consent:
        "für die ich die Rolle des «Data Steward» wahrnehme, zur Veröffentlichung im kantonalen Datenkatalog frei. Mir ist bewusst, dass diese Metadaten damit sämtlichen Mitarbeitenden der kantonalen Verwaltung im Datenkatalog (https://datenkatalog.bs.ch/) sowie im kantonalen Datenportal (https://data.bs.ch/) auch der Öffentlichkeit zugänglich gemacht werden.",
    consentAll:
        "für die ich die Rolle des «Data Steward» wahrnehme, zur Veröffentlichung im kantonalen Datenkatalog frei. Mir ist bewusst, dass diese Metadaten damit sämtlichen Mitarbeitenden der kantonalen Verwaltung im Datenkatalog (https://datenkatalog.bs.ch/) zugänglich gemacht werden. Eine Veröffentlichung im kantonalen Datenportal (https://data.bs.ch/) erfolgt nicht.",
    signature: "Datum, Unterschrift(en) - elektronisch oder analog",
};

export type PortalExclusionCategory = "none" | "partial" | "all";

export function portalExclusionCategory(
    selectedCount: number,
    excludedCount: number,
): PortalExclusionCategory {
    if (excludedCount <= 0) return "none";
    if (selectedCount > 0 && excludedCount >= selectedCount) return "all";
    return "partial";
}

export function buildFreigabePdfFilename(familyName: string): string {
    return `Freigabe-Metadaten-${familyName}.pdf`;
}
