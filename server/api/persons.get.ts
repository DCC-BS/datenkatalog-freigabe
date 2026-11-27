import { consola } from "consola";
import type { Person } from "#shared/dataspot";

function mapPersons(rows: QueryRow[]): Person[] {
    return rows.map((row) => ({
        id: String(row.id),
        givenName: String(row.given_name),
        familyName: String(row.family_name),
        email: String(row.email),
        gender: row.gender == null ? "" : String(row.gender),
    }));
}

export default defineEventHandler(async (event): Promise<Person[]> => {
    const session = await requireUserSession(event);
    const { withDrafts } = getQuery(event);
    const refine =
        withDrafts === "true" || withDrafts === "1" || withDrafts === true;

    const rows = await executeQuery(
        refine ? PERSONS_WITH_DRAFTS_QUERY : PERSONS_QUERY,
    );
    const allPersons = mapPersons(rows);
    const persons = isDcc(session)
        ? allPersons
        : allPersons.filter((person) =>
              isSameEmail(person.email, session.email),
          );

    consola.info(
        `Loaded ${persons.length} data stewards for ${session.email}` +
            (refine ? " (with DRAFT datasets only)" : " (fast list)"),
    );
    return persons;
});
