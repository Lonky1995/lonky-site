# Private Thesis sync

`/market?tab=thesis` is a Clerk owner-only view. LonkyClaw is the source of truth; this site stores only a projection in the private `Lonky1995/lonky-thesis-data` repository.

## Vercel production variables

- `THESIS_OWNER_USER_ID`: the one Clerk user ID permitted to read the page (preferred).
- `THESIS_OWNER_EMAIL`: an alternative owner binding using the Clerk account's email address.
- `THESIS_GITHUB_TOKEN`: a dedicated GitHub token with read/write access to `Lonky1995/lonky-thesis-data`; do not reuse the public site's GitHub token.
- `THESIS_SYNC_SECRET`: a random, shared HMAC secret. Never expose it to the browser.
- `GITHUB_TOKEN`: existing token with read/write access to `Lonky1995/lonky-thesis-data`.

## VPS variables

- `THESIS_SYNC_URL=https://www.lonky.me/api/private/theses/sync`
- `THESIS_SYNC_SECRET`: exactly the same value as Vercel.

The VPS signs `timestamp.raw-json` with HMAC-SHA256. The receiver rejects unsigned, invalid, or older-than-five-minute requests. Payloads contain Thesis projections only; Discord source messages, account credentials, event streams, and user IDs stay on the VPS.
