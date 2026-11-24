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
    consent:
        "für die ich die Rolle des «Data Steward» wahrnehme, zur Veröffentlichung im kantonalen Datenkatalog frei. Mir ist bewusst, dass diese Metadaten damit sämtlichen Mitarbeitenden der kantonalen Verwaltung im Datenkatalog (https://datenkatalog.bs.ch/) sowie im kantonalen Datenportal (https://data.bs.ch/) auch der Öffentlichkeit zugänglich gemacht werden.",
    consentNoPortal:
        "für die ich die Rolle des «Data Steward» wahrnehme, zur Veröffentlichung im kantonalen Datenkatalog frei. Mir ist bewusst, dass diese Metadaten damit sämtlichen Mitarbeitenden der kantonalen Verwaltung im Datenkatalog (https://datenkatalog.bs.ch/) zugänglich gemacht werden.",
    signature: "Datum, Unterschrift(en) - elektronisch oder analog",
};

export function buildFreigabePdfFilename(familyName: string): string {
    return `Freigabe-Metadaten-${familyName}.pdf`;
}
