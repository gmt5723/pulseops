# PulseOps progress

## First working prototype
- Built a browser interface connected to a Node.js backend.
- Added manual checks for two approved HTTPS origins.
- Displayed HTTP status, response time, and errors.
- Added backend URL validation and a request timeout.
- Practiced feature branches and pull requests.

## Problems solved
- JavaScript pasted into PowerShell instead of a file.
- Unsaved or outdated server code.
- Duplicate servers competing for port 4000.
- Missing routes and duplicate variable declarations.

## To revise
- Explain async/await without notes.
- Trace a request from the browser to the target website.
- Explain why backend validation is necessary.

## Next task
Add automated tests for URL validation.
## URL-validation tests
- Added automated acceptance and rejection tests.
- Verified: npm test reports 11 passed, 0 failed.
- Learned assert.equal, assert.throws, and regression testing.
- Next: test website-checking behavior without relying on live websites.
## Website-checker tests
- Used test-scoped mocks to replace fetch.
- Verified 16 tests pass.
- Fixed a nested tests folder that broke a relative import.
- Learned that ../ resolves relative to the importing file.