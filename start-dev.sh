#!/bin/sh

cd backend
echo "=== Backend .env ==="
cat .env
echo "==================="
npm run dev
cd ..

cd frontend
echo "=== Frontend .env ==="
cat .env
echo "===================="
npm run dev
cd ..