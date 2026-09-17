# HTTP basics

- Node.js runs JavaScript outside the browser.
- A client sends a request; a server sends a response.
- GET /health is our backend's health-check route.
- HTTP 200 means success.
- HTTP 404 means the requested route was not found.
- JSON.stringify converts a JavaScript object into JSON text.
- response.end sends the response and finishes the request.
- localhost refers to my computer.
- Our backend listens on port 4000.

## What I built
A Node.js server that returns:
{"service":"PulseOps API","status":"ok"}

## Debugging lesson
JavaScript belongs in server.js.
Terminal commands belong in PowerShell.
Run the file using: node --watch server.js