# Firebase security

The public portfolio can read published content. All writes require an authenticated Firebase user whose custom claims include one of:

- `role: "admin"`
- `role: "editor"`
- `admin: true` for backward compatibility

Custom claims must only be assigned from a trusted environment using the Firebase Admin SDK. Never assign roles from the browser or embed service-account credentials in `client/` or `admin/`.

Publicly readable documents (`gallery`, `galleryPage`, published `blogPosts`,
`commissions`, `processSteps`, and `settings/hero`) use closed field lists and
type validation. Never store secrets, private email addresses, internal notes,
or administrative data in those documents.

Storage is not public. Only `admin` and `editor` roles can read or modify files,
and uploads are restricted to images smaller than 10 MB.

Example for a trusted one-time administration environment:

```ts
await admin.auth().setCustomUserClaims(uid, { role: "admin" });
```

After changing a claim, the affected user must sign out and sign in again, or explicitly refresh their ID token.

## Deployment order

1. Assign an administrator claim to the intended account.
2. Confirm that the panel recognizes the role locally.
3. Review the active Firebase project and its current rules.
4. Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules` explicitly.
5. Verify public reads, rejected anonymous writes, and authorized administrator writes against the real project.

No Firebase deployment is performed automatically by this repository.

## Live verification

The live suite is intentionally separate from local tests and performs no
writes. Configure Firebase Admin credentials plus short-lived expired and
revoked test ID tokens, then run:

```bash
pnpm run test:firebase-live
```

The command fails before starting Vitest when credentials or either token are
missing. Token values must stay only in the local environment or the deployment
platform's encrypted secret store.

Production rate limiting uses the private `_serverRateLimits` collection through
Firebase Admin. Client rules deny this collection, and `firestore.indexes.json`
declares a TTL on `expiresAt` so expired counters can be removed automatically
after the index configuration is deployed.
