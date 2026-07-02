#!/usr/bin/env bash
set -euo pipefail

export AWS_PAGER=""
export AWS_ENDPOINT_URL=http://localhost.localstack.cloud:4566

echo "🏗️ Build NestJS"
npm run build
