#!/usr/bin/env bash
set -euo pipefail

# Builds and pushes the lambda-list-products container image to ECR.
# Required environment variables:
#   AWS_REGION              - AWS region for the ECR registry (e.g., us-east-1)
#   ECR_ACCOUNT_ID          - AWS account ID that owns the ECR registry
#   ECR_REPOSITORY          - Name of the ECR repository (e.g., cloudmart-list-products)
#   IMAGE_TAG               - Tag for the pushed image (defaults to current git commit)
#
# Optional:
#   DOCKERFILE              - Override Dockerfile path (defaults to lambda-list-products/Dockerfile)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKERFILE="${DOCKERFILE:-lambda-list-products/Dockerfile}"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "${REPO_ROOT}" rev-parse --short HEAD)}"

: "${AWS_REGION:?Set AWS_REGION}"
: "${ECR_ACCOUNT_ID:?Set ECR_ACCOUNT_ID}"
: "${ECR_REPOSITORY:?Set ECR_REPOSITORY}"

ECR_URI="${ECR_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"

cd "${REPO_ROOT}"

echo "==> Logging into ECR ${ECR_ACCOUNT_ID} in ${AWS_REGION}"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Building ${ECR_URI}"
docker build \
  -f "${DOCKERFILE}" \
  -t "${ECR_URI}" \
  lambda-list-products

echo "==> Pushing ${ECR_URI}"
docker push "${ECR_URI}"

echo "✅ Image pushed to ${ECR_URI}"
