# Incident Response Runbook

## Scope

Use this runbook for production incidents affecting availability, correctness, security headers, or key user flows.

## Severity Levels

- **SEV-1**: Site unavailable or major data/security risk.
- **SEV-2**: Core routes degraded (`/`, `/blog/`, `/portfolio/`) or key journeys blocked.
- **SEV-3**: Non-critical regressions with acceptable workaround.

## Response Workflow

1. **Acknowledge**
   - Record start time and visible symptoms.
2. **Stabilize**
   - Roll back or redeploy the last healthy production build from your hosting provider if needed.
3. **Diagnose**
   - Inspect latest merged commits and CI status.
   - Validate key endpoints (`/feed.xml`, `/search-index.json`) and page routes.
4. **Recover**
   - Deploy fix.
   - Verify smoke checks and E2E coverage for affected area.
5. **Close**
   - Capture root cause, impact window, and preventive actions.

## Fast Checks

- CI status in GitHub Actions (`build`, `e2e-stable`, `lighthouse`).
- Hosting dashboard (deploy status, CDN/errors if available).
- Browser smoke checks:
  - `/`
  - `/blog/`
  - `/portfolio/`
  - `/offline/`
  - `/feed.xml`

## Security Incidents

- Follow disclosure policy in `.github/SECURITY.md`.
- Rotate any potentially exposed secrets/tokens immediately.
- Tighten CSP and other headers at your CDN or origin when applicable (see [`docs/deployment.md`](deployment.md)).
