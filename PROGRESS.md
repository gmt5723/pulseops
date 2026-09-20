# PulseOps progress

## Current milestone
A local website-monitoring prototype with a Next.js dashboard,
a Node.js backend, persistent named monitors, and automated checks.

## Completed
- Built a Next.js interface using React, TypeScript, and Tailwind CSS.
- Connected frontend API requests to the Node.js backend.
- Added manual website checks with HTTP status, response time, and errors.
- Restricted targets to https://example.com and https://example.org.
- Rejected unsupported protocols, credentials, and unapproved origins.
- Added a five-second backend timeout and disabled redirect following.
- Extracted reusable result, history, and monitor-management components.
- Added recent history for the last 20 checks from the main check form.
- Added named monitors with independent manual checks and latest results.
- Saved monitor definitions to a local JSON file.
- Reloaded saved monitors after backend restarts.
- Added monitor deletion with confirmation and persistent removal.
- Added GitHub Actions workflows for backend tests and frontend checks.
- Used feature branches, pull requests, and merges.

## Testing
The backend suite contains 22 tests:
- 11 URL-validation tests.
- 5 mocked website-checker tests.
- 6 monitor-storage tests.

Storage tests use temporary folders and fresh Node processes.
They cover saving, reloading, duplicate prevention, corrupt storage,
persistent deletion, and deletion of unknown IDs.

Manual checks demonstrated:
- Successful website checks and rejected duplicate monitors.
- Independent results for named monitors.
- Monitor persistence across backend restarts.
- Cancelling deletion and keeping deleted monitors absent after restart.

Frontend checks use TypeScript and ESLint.
GitHub Actions runs checks on pushes and pull requests to main.

## Current limits
- Runs locally; production deployment has not been verified.
- Supports only two approved HTTPS origins.
- Checks are manual; there is no scheduler or alerting.
- Monitor definitions use JSON storage for one backend process.
- Check results and recent history clear on page refresh.
- Named-monitor checks do not enter the separate recent-history list.
- No authentication, user accounts, or database yet.
- No automated browser interaction tests yet.
- CI checks types and lint but does not yet verify a production build.

## Debugging lessons
- Save code in the exact file before testing.
- Keep shared components in frontend/src/components.
- Keep backend files in the project root.
- Relative imports resolve from the importing file.
- Run frontend commands from the frontend folder.
- Keep frontend and backend servers in separate terminals.
- Use another terminal for Git and verification commands.
- Restart the backend after changing its code.
- Inspect duplicate files before removing them.

## To revise
- Explain async/await and request timeouts.
- Trace browser requests through Next.js to the backend.
- Explain why validation must happen on the backend.
- Explain React state versus persistent storage.
- Explain why storage is saved before memory is changed.
- Explain mocked tests, process isolation, and CI.

## Next milestone
Verify the frontend production build and include it in CI.