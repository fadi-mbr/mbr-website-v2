#!/bin/bash

# Email Testing Script Wrapper
# Makes it easier to run the email test

if [ -z "$1" ]; then
    echo "❌ Please provide a test email address"
    echo "Usage: ./scripts/test-email.sh <test-email@example.com>"
    exit 1
fi

echo "🧪 Running email test..."
echo ""

npx tsx scripts/test-email.ts "$1"

