#!/usr/bin/env bash
set -e
export PRISMA_SKIP_POSTINSTALL_GENERATE=true
npm install
chmod +x node_modules/.bin/prisma || true
npx prisma generate
npx prisma db push
