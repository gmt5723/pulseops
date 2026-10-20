# PulseOps free deployment

## What this version does
A shared portfolio demo: manual checks of example.com/example.org, named monitor CRUD,
filters, and the most recent 20 saved checks. No accounts, scheduling or alerts.
All visitors share the same monitors/history and can modify them. Use demo data only.
Supabase stores hosted data; the original local JSON mode is unchanged when both
Supabase environment variables are absent. Existing local JSON records are not
imported automatically. New hosted storage starts empty.

## 1. Apply and verify
Copy the contents of this update folder into D:\Projects\pulseops, replacing matching
files. Do not replace/delete your whole project. No dependency installation is needed.
In PowerShell at the project root:

```powershell
npm.cmd test
git diff --stat
```
The update adds 5 mocked cloud-adapter tests (45 total). It does not change frontend
source. The SQL and real Supabase connection still require the following live check.

## 2. Supabase
Open your pulseops project, open SQL Editor, create a new query, paste the entire
supabase/schema.sql file and run it. It creates two backend-only tables and a function
that atomically saves/prunes history to 20 rows. RLS is enabled with no browser policies;
only the backend service role can access these tables.

Find your project URL and secret API key in the project settings/API keys area.
Use the sb_secret_ key (not the publishable key). A legacy service_role JWT also works.
Never paste a secret into chat, Git, screenshots or a NEXT_PUBLIC_ variable.

## 3. Push the update
After reviewing the files, run:

```powershell
git add server.js package.json supabaseStore.js supabase/schema.sql tests/supabaseStore.test.js DEPLOYMENT.md .env.example PROGRESS.md
git commit -m "feat: add Supabase persistence and deployment guide"
git push -u origin feat/deployment
```
Deploy this branch first. Merge into main after the live checks pass, then switch both
hosting services to main.

## 4. Render API
Create a Web Service from the PulseOps GitHub repository:

- Branch: feat/deployment
- Runtime: Node
- Root directory: leave blank
- Build command: npm ci
- Start command: npm start
- Instance: Free
- Health check path: /health
- Environment: HOST=0.0.0.0
- Environment: SUPABASE_URL=<your HTTPS Supabase project URL>
- Environment: SUPABASE_SECRET_KEY=<your secret key>
- Environment: NODE_VERSION=22

Do not set DATA_DIR on Render. Render supplies PORT. Do not put secrets in Netlify.
Open https://YOUR-API.onrender.com/health and confirm status ok. Then open /monitors
and /checks; both should return JSON arrays, initially empty. Health alone does not
verify database access. If either fails, check the SQL and Render environment values.
Free Render sleeps when idle; initial startup can take about a minute. Open /health
and wait before testing the frontend. A dashboard timeout can be retried after wakeup.

## 5. Netlify frontend
Import the same GitHub repository and choose:

- Branch: feat/deployment
- Base directory: frontend
- Build command: npm run build
- Publish directory: .next
- Environment: NODE_VERSION=22
- Environment: API_BASE_URL=https://YOUR-API.onrender.com

Set API_BASE_URL before building; rebuild whenever it changes. Keep Netlify's detected
Next.js support enabled. The browser calls /api routes on Netlify, which proxy to Render.
No CORS changes or browser database keys are required.

## 6. Live acceptance checks
1. Add a named https://example.org monitor; rename it.
2. Run checks from the main form and the saved monitor.
3. Confirm history updates and filter buttons/counts work.
4. Reload the page and confirm monitors/history remain.
5. Restart/redeploy the Render API; once awake, confirm the data still remains.
6. Try a duplicate URL and an unsupported URL; verify useful errors.
7. Delete a monitor and verify it stays deleted after reload.
8. Test narrow-screen layout and keyboard controls.

Stop if database operations fail; do not advertise persistence until steps 4–5 pass.
Supabase free projects may pause after low activity. Restore them from the dashboard.
This package was tested with mocked Supabase responses, not your live credentials.

References:
https://render.com/docs/free
https://supabase.com/docs/guides/getting-started/api-keys
https://supabase.com/docs/guides/api
https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
