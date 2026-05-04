#!/usr/bin/env bash
npm install
npx prisma generate
npx prisma db push
