# Password-protected tester deployment

Prepared 3 November 2026. No service has been created by these files.

## Recommended: Render Free web service

Import this public repository as a Render Blueprint:

https://dashboard.render.com/select-repo?type=blueprint

Repository: https://github.com/msonnendeck/sari-anatomy

The checked-in `render.yaml` selects the Free web-service plan in Frankfurt, builds the client, and starts the Node server. Automatic deploys are off so subsequent prototype commits do not interrupt a tester session. Render supplies the HTTPS URL and `RENDER_EXTERNAL_URL` used by the app's host/origin allowlist.

During Blueprint setup, set `SARI_DEMO_PASSWORD` to a unique password of at least 16 characters. Keep it in Render's secret environment settings, not Git or chat. Default username: `sari`. Visitors see the browser's built-in sign-in prompt. Use an incognito/private window for shared-device testing; browsers cache Basic-auth credentials, and there is no in-app sign-out. Rotate the password in Render and redeploy to revoke the old credentials.

The first deploy has `META_ENABLED=false`. After checking password protection, add `MODEL_API_KEY` privately in Render, then set `META_ENABLED=true` and redeploy. Use the already approved model variant. AI calls spend Meta credits; free hosting does not provide free inference. Credentials, app files, dataset files and APIs all remain behind the same password gate. The only unauthenticated endpoint is `/healthz`, which returns just `ok` for hosting health checks.

Do not enter an API key into a `VITE_` variable. No API key or demo password is shipped in the client build. Hosted startup refuses an absent/short password or a non-HTTPS configured origin. Use Render's HTTPS address; do not bypass certificate warnings.

Before sharing the URL, check in a fresh private browser window:

1. Root page and `/data/spl-atlas/preview.png` require authentication.
2. `/api/status` requires authentication too.
3. Valid login opens the app and loads the atlas.
4. A simple chat and a reviewed-image question work with Meta enabled.
5. Sourced literature results include usable source links.

Render Free sleeps after 15 minutes idle and can take approximately a minute to wake. It has 750 free instance hours per workspace/month and separate build/bandwidth allowances. Account-wide allowances and payment settings matter: inspect the dashboard to avoid enabling paid extras. A database or disk is not needed for this prototype; personal sessions remain in the browser. A new online URL has separate browser storage from localhost, so existing local sessions will not automatically appear online. Bundled public research samples ship with the build; approved image extracts are processed by the server and Meta, not stored as server-side patient uploads.

## Alternative: Koyeb Free

Koyeb documents one free web-service instance per organization: 512 MB RAM, 0.1 vCPU, 2 GB SSD, Frankfurt or Washington, D.C., sleeping after one hour idle. Deploy the same Node app with build `npm ci --include=dev && npm run build`, start `npm start`, `HOST=0.0.0.0`, provider-assigned `PORT`, `NODE_ENV=production`, and `PUBLIC_ORIGIN=https://your-service.koyeb.app`. Set the same secret password and Meta variables. Its small CPU allocation is the principal tradeoff. Check current account/card requirements before signup.

## Verified sources

- https://render.com/docs/free
- https://render.com/docs/web-services
- https://render.com/docs/blueprint-spec
- https://render.com/docs/environment-variables
- https://www.koyeb.com/docs/reference/instances
- https://www.koyeb.com/docs/faqs/pricing

## Password gate scope

Shared demo access uses HTTP Basic authentication over the hosting provider's HTTPS connection. Authentication runs before static serving, request-body parsing or API routing. Password comparisons are timing-safe digests. Invalid credential attempts are limited in a bounded single-process window; this is a small-group shared-password demo, not individual account management. Host and Origin checks remain enabled for local and hosted modes. Changing the shared password invalidates old credentials on subsequent requests but does not erase data already downloaded by a tester.
