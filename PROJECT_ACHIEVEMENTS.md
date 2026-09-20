# PulseOps achievements

## Implemented

* Built a Next.js dashboard with React, TypeScript, and Tailwind CSS.
* Connected the dashboard to a Node.js HTTP API.
* Implemented manual website checks with timeout handling,
  HTTP status reporting, and response timing.
* Added backend validation for two approved HTTPS origins.
* Created reusable interface components and session check history.
* Added named monitors with independent manual check results.
* Implemented JSON persistence for monitor definitions.
* Added persistent deletion with a confirmation step.
* Added 22 backend tests using Node's built-in test runner.
* Configured GitHub Actions for backend tests, TypeScript, and ESLint.
* Managed changes through feature branches and pull requests.

## Demonstrated behavior

* Successful checks displayed in the dashboard.
* Unapproved destinations and duplicate monitors rejected.
* Saved monitors reloaded with the same IDs after backend restart.
* Deleted monitors remained absent after restart.
* Separate named monitors retained their own displayed check results.
* Backend CI completed successfully on GitHub.

## Scope of evidence

Response times observed during development are individual samples,
not performance benchmarks. Timing measures the request through
response headers, rather than a complete page download.

Checker tests simulate responses and errors. The timeout-error test
checks error handling; it does not measure a real five-second timeout.

Storage tests use isolated temporary folders. They do not establish
support for concurrent backend processes.

This is a local learning prototype. Production readiness, scalability,
availability, and security beyond the implemented controls have not
been established.

