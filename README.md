\# PulseOps



A local website-monitoring prototype built with Next.js, TypeScript,

and a Node.js HTTP API.



Create named monitors, manually check approved websites, inspect

responses, and keep monitor definitions across backend restarts.



\## Features



\- Manual checks showing status, HTTP response code, response time,

&nbsp; and errors.

\- Backend URL validation for two approved HTTPS origins:

&nbsp; - https://example.com

&nbsp; - https://example.org

\- Five-second backend request timeout and disabled redirect following.

\- Named monitors with independent latest check results.

\- JSON-file persistence for monitor definitions.

\- Monitor deletion with confirmation and persistent removal.

\- Recent history for the last 20 checks from the main check form.

\- GitHub Actions for backend tests, frontend type checking,

&nbsp; linting, and production builds.



\## Technology



\- Frontend: Next.js, React, TypeScript, Tailwind CSS.

\- Backend: Node.js built-in HTTP server.

\- Storage: local JSON file.

\- Tests: Node.js built-in test runner.

\- CI: GitHub Actions.



\## Requirements



\- Node.js 26 and npm.

\- Git.

\- Internet access to install frontend dependencies and check websites.



\## Setup



Clone the repository:



```sh

git clone https://github.com/gmt5723/pulseops.git

cd pulseops

```



Install frontend dependencies:



```sh

cd frontend

npm ci

cd ..

```



The backend currently uses built-in Node.js modules and requires

no separate dependency installation.



\## Run locally



Keep the backend and frontend running in separate terminals.

Use a third terminal for Git and verification commands.



\### Terminal 1: backend



From the repository root:



```sh

node server.js

```



The API listens at http://127.0.0.1:4000.



Restart this process after changing backend code.



\### Terminal 2: frontend



From the repository root:



```sh

cd frontend

npm run dev

```



Open http://localhost:3000.



Enter a monitor name and an approved website URL, create the monitor,

then click \*\*Check now\*\*.



The frontend forwards API requests to the backend through Next.js

rewrites.



\## Production build



From the frontend folder:



```sh

npm run build

npm run start

```



Keep the backend running separately.



Stop the frontend development server before starting the production

server because both normally use port 3000.



Production builds and local production-mode checks have been tested.

The application has not been deployed publicly.



\## Backend API



| Method | Path | Purpose |

| --- | --- | --- |

| GET | /health | Check whether the API responds |

| GET | /check?url=https%3A%2F%2Fexample.org | Manually check an approved URL |

| GET | /monitors | List saved monitors |

| POST | /monitors | Create a named monitor |

| DELETE | /monitors/:id | Delete a monitor by its ID |



Creating a monitor requires `Content-Type: application/json` and

a body such as:



```json

{

&nbsp; "name": "Example website",

&nbsp; "url": "https://example.org"

}

```



A completed website check can return API HTTP 200 even when the

target website check failed. Inspect the response's `status`,

`httpStatus`, and `error` fields.



\## Storage and history



Monitor definitions are saved to `data/monitors.json`, which is

created after the first successful monitor creation.



\- Monitor IDs, names, URLs, and creation dates survive backend restarts.

\- Deletions are saved to disk.

\- The local data directory is ignored by Git.

\- Storage supports the current single-process backend.

\- Invalid saved data causes startup to fail rather than silently

&nbsp; replacing it.



Check results and recent history remain in browser memory and clear

on refresh. Named-monitor checks do not enter the separate recent

history list.



\## Verification



Run backend tests from the repository root:



```sh

node --test tests/\*.test.js

```



The suite contains 22 tests covering URL validation, mocked website

checks, persistence, and deletion.



Storage tests use temporary folders and fresh Node processes.

They do not modify the application's saved monitors.



Run frontend checks from the frontend folder:



```sh

npx next typegen

npx tsc --noEmit

npm run lint

npm run build

```



GitHub Actions runs the configured checks on pushes and pull requests

targeting main.



\## Project structure



| Path | Purpose |

| --- | --- |

| server.js | HTTP routes and request handling |

| checkWebsite.js | Website requests and check results |

| validateUrl.js | Backend URL validation |

| monitorStore.js | Monitor creation, listing, deletion, and storage |

| frontend/src/app | Next.js pages and layouts |

| frontend/src/components | Shared interface components |

| frontend/src/types | Shared frontend types |

| tests | Backend tests |

| notes | Learning notes |

| .github/workflows | Automated CI checks |



\## Troubleshooting



\### Browser says connection refused



Start the frontend from the `frontend` folder and keep its terminal

running. API operations also require the backend on port 4000.



\### EADDRINUSE on port 4000



An existing process is already using the backend port. Stop the

existing backend in its terminal before starting another instance.



\### Missing dev script



Run `npm run dev` from the `frontend` folder.



\### Missing component import



Shared components belong in `frontend/src/components`.

Avoid creating duplicate copies under `frontend/src/app/components`.



\### Website URL rejected



The prototype permits only HTTPS URLs on example.com and example.org.

Localhost and other destinations are intentionally unsupported.



\## Current limitations



\- Manual checks only; no scheduling or alerts.

\- No authentication or user accounts.

\- No database or support for multiple backend processes.

\- No persistent check history.

\- No automated browser interaction tests.

\- No public deployment or scalability validation.



Response times measure the request through response headers, not a

complete page download. Individual readings are not performance

benchmarks, and one failed check does not prove a website is down

for everyone.



\## Learning record



See `PROGRESS.md`, `PROJECT\_ACHIEVEMENTS.md`, and `notes/` for the

development milestones and debugging lessons.

