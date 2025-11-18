#!/bin/bash

# Script to check for common TypeScript and import errors

echo "=== Checking for import errors ==="

# Check for any undefined imports in marketplace adapters
echo "Checking marketplace adapters..."
grep -r "import.*from" src/lib/marketplaces/*.ts | grep -v "types\|base-adapter\|adapter-factory" | head -10

echo ""
echo "=== Checking for missing exports in index files ==="
# Check if all marketplace adapters are exported
for file in src/lib/marketplaces/*-adapter.ts; do
    basename=$(basename "$file" .ts)
    if ! grep -q "$basename" src/lib/marketplaces/index.ts; then
        echo "Missing export: $basename"
    fi
done

echo ""
echo "=== Checking for syntax errors in key files ==="
# Check for common syntax errors
node -c src/lib/auth.ts 2>&1 || echo "Syntax error in auth.ts"
node -c src/lib/prisma.ts 2>&1 || echo "Syntax error in prisma.ts"
node -c src/lib/tenant.ts 2>&1 || echo "Syntax error in tenant.ts"

echo ""
echo "=== Checking TypeScript files count ==="
find src -name "*.ts" -o -name "*.tsx" | wc -l

echo ""
echo "=== Checking for duplicate declarations ==="
# Look for potential duplicate exports
grep -r "export.*Worker" src/jobs/ | head -5

echo ""
echo "All basic checks completed!"
