## Setup

Clone the repository:

```sh
git clone https://github.com/gmt5723/pulseops.git
cd pulseops
```

Install the root development tools and frontend dependencies:

```sh
npm ci
npm --prefix frontend ci
```

The backend uses built-in Node.js modules. The root development
dependency, concurrently, runs both servers together.

## Run locally

From the repository root:

```sh
npm run dev
```

This starts:
- Backend API: http://127.0.0.1:4000
- Frontend dashboard: http://localhost:3000

Wait for the frontend to report Ready, then open the dashboard.

Keep this terminal running. Use a separate terminal for Git and tests.
Press Ctrl+C to stop both servers.

Restart the command after changing backend code. Frontend changes
reload automatically during development.

Stop any separately running frontend or backend instances before
using this command to avoid port conflicts.

To run either server separately from the repository root:

```sh
npm run dev:api
npm run dev:web
```

Use separate terminals when running these individual commands.
### Missing dev script

Run development commands from the repository root after installing
dependencies with npm ci. The root npm run dev command starts both
servers.

