import { consola } from "consola";
import type { Person } from "#shared/dataspot";

export default defineEventHandler(async (event): Promise<Person[]> => {
    const session = await requireUserSession(event);
    const rows = await executeQuery(PERSONS_QUERY);
    const allPersons = rows.map((row) => ({
        id: String(row.id),
        givenName: String(row.given_name),
        familyName: String(row.family_name),
        email: String(row.email),
    }));
    const persons = isDcc(session)
        ? allPersons
        : allPersons.filter((person) =>
              isSameEmail(person.email, session.email),
          );
    consola.info(`Loaded ${persons.length} data stewards for ${session.email}`);
    return persons;
});
