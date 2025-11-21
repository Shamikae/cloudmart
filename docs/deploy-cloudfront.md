# CloudMart Frontend – S3 + CloudFront Deployment Guide

CloudMart’s Vite config (`vite.config.js`) sets `base: "/cloudmart/"`, meaning the app is meant to be served under `https://shamikae.com/cloudmart`. The steps below describe how to reproduce that deployment using Amazon S3 and CloudFront.

---

## 1. Prerequisites

1. Working Node/Vite toolchain to build the site.
2. AWS CLI v2 configured with credentials that can manage S3, CloudFront, and ACM.
3. Domain `shamikae.com` managed in Route 53 (or elsewhere) with the ability to edit DNS.
4. An ACM certificate for `shamikae.com` + `*.shamikae.com` in `us-east-1` (required for CloudFront).

---

## 2. Build the frontend

```bash
npm install          # first time
npm run build        # outputs static files to dist/
```

> The `dist/` directory is what will be uploaded to S3.

---

## 3. S3 bucket layout

1. Create (or reuse) an S3 bucket that holds the static site, e.g. `shamikae.com`.
2. Keep the bucket private (CloudFront will fetch via an Origin Access Control).
3. Inside the bucket, create a folder/prefix named `cloudmart/`. CloudFront will map requests such as `/cloudmart/index.html` to `s3://shamikae.com/cloudmart/index.html`.

Upload the latest build:

```bash
aws s3 sync dist/ s3://shamikae.com/cloudmart/ --delete
```

---

## 4. CloudFront distribution

1. **Origin**
   - Domain: the S3 bucket regional endpoint (e.g. `shamikae.com.s3.amazonaws.com`).
   - Origin Path: `/cloudmart` (so CloudFront automatically prepends it).
   - Attach an Origin Access Control (recommended) or an old-style OAI so S3 stays private.
2. **Behaviors**
   - Default behavior can stay pointing to the same origin, or add a path-based behavior for `/cloudmart/*`.
   - Allowed methods: `GET, HEAD`.
   - Cache policy: CachingOptimized is fine; consider a custom policy if you need shorter TTLs.
3. **Error pages**
   - Create a custom error response returning `/cloudmart/index.html` for `404` and `403` (status code 200). This ensures client-side routing keeps working.
4. **TLS & domain**
   - Associate the ACM certificate for `shamikae.com`.
   - Add `shamikae.com` (and optional `www.shamikae.com`) to “Alternate Domain Names (CNAMEs)”.
5. **Invalidations**
   - After each deploy, invalidate cached files:
     ```bash
     aws cloudfront create-invalidation \
       --distribution-id ABC123XYZ \
       --paths "/cloudmart/*"
     ```

---

## 5. DNS (Route 53 or registrar)

Create (or update) an `A`/`AAAA` record for `shamikae.com` that aliases the CloudFront distribution. Once DNS propagates, `https://shamikae.com/cloudmart/` should serve the React app.

---

## 6. Putting it together (script example)

You can wrap the build + deploy steps in a script (bash example):

```bash
#!/usr/bin/env bash
set -euo pipefail

DIST_ID="E1ZJOMPFBUC7LW"
S3_BUCKET="my-fantastic-websitese"
PREFIX="cloudmart"

npm run build
aws s3 sync dist/ "s3://${S3_BUCKET}/${PREFIX}/" --delete
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/${PREFIX}/*"
```

Update `DIST_ID`, `S3_BUCKET`, and `PREFIX` to match your environment. Commit the script (e.g., `scripts/deploy-cloudfront.sh`) if you want it version-controlled.

---

## 7. Environment variables

Ensure `.env.production` contains the Lambda URL exposed through CloudFront (if you front it) or the direct Lambda Function URL:

```
VITE_LIST_PRODUCTS_URL=https://YOUR_PUBLIC_URL/...
```

Rebuild whenever this value changes; Vite inlines it during `npm run build`.

---

With these steps documented, anyone can reproduce the static hosting setup and deploy new builds to `https://shamikae.com/cloudmart`.
