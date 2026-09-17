# Website checks

## How it works
Browser → PulseOps /check → example.com → result → browser.

## Key concepts
- fetch makes an HTTP request.
- await waits inside an async function.
- response.ok is true for HTTP statuses 200–299.
- HTTP 503 is a response; fetch does not throw just because of it.
- Network failures and timeouts are handled by catch.
- Our response time measures time to headers, not a full download.
- Redirects are not followed in this version.

## Two different statuses
Our API returns HTTP 200 when it successfully provides a check result.
The JSON httpStatus describes the target website's response.
A failed target check does not necessarily mean our API failed.

## Current limits
One fixed target, manual checks, no saved history.
One failed check does not prove a website is down for everyone.
