# Browser interface

## How it works
1. Browser requests / and receives index.html.
2. Clicking Check website sends a request to /check.
3. The backend checks example.com and returns JSON.
4. Browser JavaScript displays the result.

## Key concepts
- HTML structures the page; CSS styles it.
- Browser JavaScript handles the button click.
- textContent displays results as text.
- finally restores the button after success or failure.

## Debugging lessons
- Import fs and path before using them.
- Declare each const variable only once in its scope.
- Reading index.html does not serve it; the / route sends it.
- Stop the existing server before starting another on port 4000.
- Inspect saved files with Get-Content when changes seem missing.