# AXNews Admin API Worker

This is the source for the existing Cloudflare Worker `axnews-admin-api`. It serves AXNews administration and the presidential/vice-presidential election API. Existing production secrets are managed in Cloudflare and must never be added to this repository.

## Voting identity verification

Before deploying the new vote flow:

1. Apply `citizens/worker/migrations/0002_voter_verification_limits.sql` to the existing `axie-citizens` D1 database.
2. Set the same administrator-generated `VOTER_VERIFY_SECRET` on this Worker and `axie-citizens-admin-api`. Enter it directly into Wrangler's prompt; do not put it in source files, chat, or GitHub.
3. Deploy `axie-citizens-admin-api` first so its authenticated `/api/internal/verify-voter` endpoint is live.
4. Deploy this Worker.

The vote endpoint calls the citizen Worker to verify the submitted name, national ID, and active status. It stores only an HMAC of the national ID in `votes.json`, so the raw name and ID do not enter election records. The citizen Worker rate-limits verification attempts by a keyed IP fingerprint.

## Deploy

From this directory, use the Wrangler version configured for the Cloudflare account:

```sh
pnpm dlx wrangler deploy
```

The `AI` binding and existing secrets (`AXNEWS_MANAGEMENT_SYSTEM_ADMIN_PASSWORD`, `AXNEWS_SESSION_SECRET`, `GITHUB_TOKEN`) are managed in Cloudflare. Wrangler secret values are not represented in this repository.
