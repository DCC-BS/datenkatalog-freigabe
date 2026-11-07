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

## Todos

### Deploy

Add a production Docker image and CI so others can run the app without `bun run dev`.

- Add a multi-stage `Dockerfile` in the style of other DCC-BS Nuxt apps (e.g. `datenkatalog-dashboard`): build with Bun, run `node server/index.mjs` from `.output`.
- Wire GitHub Actions via the shared DCC-BS `ci-workflows` (and optionally a `mise.toml` for tool versions).
- Pass the existing `DATASPOT_*` variables as runtime secrets/env in the host; do not bake them into the image.
- Decide `baseURL` / port with whoever hosts it (this app currently assumes `/` on port 3000).

### Real Feedback button

[`app/components/FeedbackButton.vue`](app/components/FeedbackButton.vue) currently only shows the toast "Noch nicht implementiert!".

- Create the feedback GitHub repo `opendatabs/Feedback_datenkatalog-freigabe` (name was agreed during planning; confirm if the org should instead be `DCC-BS` like `Feedback_datenkatalog-dashboard`).
- Extend the DCC-BS layer `github:DCC-BS/nuxt-layers/feedback-control` and replace the stub button with that layer's feedback control (same pattern as `datenkatalog-dashboard`).
- Add the layer's runtime config (`repo`, `repoOwner`, `project`, `githubToken` / `FEEDBACK_GITHUB_TOKEN`, `label`) and document the token in `.env.example` without copying real secrets.

### Website login (Azure Entra)

The Dataspot credentials are M2M only. Anyone who can reach the site can call `/api/persons` and `/api/working-datasets` today.

- Extend `github:DCC-BS/nuxt-layers/auth` with `AUTH_LAYER_URI=github:DCC-BS/nuxt-layers/azure-auth` (the logger layer is usually required alongside auth layers).
- Add the `NUXT_AZURE_AUTH_*` variables to `.env.example` and protect pages via the layer middleware.
- In `server/api/persons.get.ts` and `server/api/working-datasets.get.ts`, return 401 when `getUserSession(event)` is null so the Dataspot routes are not callable anonymously.
- Keep Dataspot M2M auth (`server/utils/dataspotAuth.ts`) separate from user login.
