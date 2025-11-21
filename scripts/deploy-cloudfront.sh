#!/usr/bin/env bash
set -euo pipefail

# Deploys the CloudMart frontend to S3 + CloudFront.
# Usage:
#   export CLOUDFRONT_DISTRIBUTION_ID=ABC123
#   export CLOUDMART_S3_BUCKET=shamikae.com
#   # optionally: export CLOUDMART_S3_PREFIX=cloudmart
#   ./scripts/deploy-cloudfront.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DIST_ID="${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID to the CloudFront distribution ID}"
S3_BUCKET="${CLOUDMART_S3_BUCKET:?Set CLOUDMART_S3_BUCKET to the target S3 bucket name}"
S3_PREFIX="${CLOUDMART_S3_PREFIX:-cloudmart}"

cd "${REPO_ROOT}"

echo "==> Building frontend"
npm run build

echo "==> Syncing dist/ to s3://${S3_BUCKET}/${S3_PREFIX}/"
aws s3 sync dist/ "s3://${S3_BUCKET}/${S3_PREFIX}/" --delete

echo "==> Creating CloudFront invalidation /${S3_PREFIX}/*"
aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths "/${S3_PREFIX}/*"

echo "✅ Deployment complete"
