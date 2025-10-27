#!/bin/bash
# Clean build artifacts and caches

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🧹 Cleaning SyncCode project..."

cd "$PROJECT_ROOT"

# Clean build artifacts
echo "Removing build artifacts..."
find packages -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
find packages -type d -name "build" -exec rm -rf {} + 2>/dev/null || true

# Clean node_modules (optional - comment out if not needed)
# echo "Removing node_modules..."
# find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

# Clean Yarn cache (be careful with this)
# yarn cache clean

# Clean TypeScript build info
echo "Removing TypeScript build info..."
find . -type f -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Clean Prisma generated client
echo "Removing Prisma generated client..."
rm -rf packages/server/node_modules/.prisma 2>/dev/null || true

echo "✅ Clean complete!"
echo ""
echo "Run 'yarn install' to reinstall dependencies"
echo "Run 'yarn build' to rebuild packages"
