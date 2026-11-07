import { consola } from "consola";
import type { Person } from "#shared/dataspot";

export default defineEventHandler(async (): Promise<Person[]> => {
    const rows = await executeQuery(PERSONS_QUERY);
    const persons = rows.map((row) => ({
        id: String(row.id),
        givenName: String(row.given_name),
        familyName: String(row.family_name),
        email: String(row.email),
    }));
    consola.info(`Loaded ${persons.length} data stewards`);
    return persons;
});
