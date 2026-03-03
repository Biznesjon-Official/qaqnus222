#!/bin/bash

# Load DATABASE_URL from .env if not already set
if [ -z "$DATABASE_URL" ]; then
  if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep DATABASE_URL)
  fi
fi

# Extract DB name/host for display
DB_INFO=$(echo "$DATABASE_URL" | sed 's/postgresql:\/\/[^@]*@//' 2>/dev/null || echo "$DATABASE_URL")

echo ""
echo "========================================="
echo "  WARNING: PRODUCTION DATABASE CLEANUP"
echo "========================================="
echo ""
echo "  Database: $DB_INFO"
echo ""
echo "  This will DELETE all business data:"
echo "  - Products, Sales, Purchases"
echo "  - Customers, Suppliers, Debts"
echo "  - Expenses, Partners, etc."
echo ""
echo "  Only Foydalanuvchi (users) will be kept."
echo ""
echo "========================================="
echo ""
read -p '  Type "yes" to confirm: ' CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo ""
  echo "  Cancelled. No changes made."
  echo ""
  exit 0
fi

echo ""
echo "  Running cleanup..."
echo ""

npm run db:clean

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "  Cleanup completed successfully."
else
  echo "  Cleanup failed with exit code $EXIT_CODE."
fi
echo ""

exit $EXIT_CODE
