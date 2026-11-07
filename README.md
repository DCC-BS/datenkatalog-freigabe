# datenkatalog-freigabe

Small internal web tool for the Basel-Stadt data catalog ([Dataspot](https://datenkatalog.bs.ch)).
It prepares the review-request email that is sent to a Data Steward before their metadata is published.

Workflow:

1. Select a Data Steward (people holding a post with the role `Data Steward`).
2. The tool loads all datasets in status `WORKING` they are responsible for as Data Steward.
3. Select datasets, or the collections that contain them.
4. Edit the generated (German) email and copy it, or open it in your mail program.

The website UI is German; code and documentation are English.

## Stack

- [Nuxt 4](https://nuxt.com) with [Nuxt UI](https://ui.nuxt.com) and [`@dcc-bs/common-ui.bs.js`](https://github.com/DCC-BS/common-ui.bs.js)
- [Bun](https://bun.sh) as package manager, [Biome](https://biomejs.dev) for linting and formatting
- No separate backend: Nitro server routes call the Dataspot Query API directly, so credentials stay on the server.

## Configuration

All configuration is read from `.env` (see `.env.example`):

| Variable | Description |
| --- | --- |
| `DATASPOT_TENANT_ID` | Entra ID tenant of the Dataspot service app registration |
| `DATASPOT_CLIENT_ID` | Client ID of the service app registration |
| `DATASPOT_CLIENT_SECRET` | Client secret of the service app registration |
| `DATASPOT_EXPOSED_CLIENT_ID` | Client ID of the Dataspot API exposed in Entra ID (scope `api://<id>/.default`) |
| `DATASPOT_SERVICE_USER_ACCESS_KEY` | Access key of the Dataspot service user |

These variables provide a service-to-service (M2M) token for Dataspot. They are **not** a login for app users;
the website itself currently has no login.

## Development

```bash
bun install
bun run dev
```

The app runs on <http://localhost:3000>.

Other scripts:

- `bun run check` – lint and fix with Biome
- `bun run tsc` – type checking
- `bun run build` – production build

## Where to change things

- Email text: `app/utils/reviewRequestEmail.ts` (template at the top of the file)
- SQL queries: `server/utils/dataspotQueries.ts`
- Dataspot base URL and database: `shared/dataspot.ts`
- German UI texts: `i18n/locales/de.json`
