#!/bin/bash
# MongoDB Migration Start Script
# Interactive script to guide through migration

echo "🚀 FIREBASE → MONGODB MIGRATION TOOL"
echo "===================================="
echo ""

# Check if MongoDB is configured
if ! grep -q "MONGODB_URI" .env; then
    echo "❌ MongoDB not configured in .env file"
    echo "Please add MONGODB_URI to your .env file"
    exit 1
fi

echo "✅ MongoDB configured"
echo ""

# Menu
echo "Choose migration option:"
echo "1) DRY RUN - Preview migration (no data written)"
echo "2) Migrate specific collection"
echo "3) FULL MIGRATION - Migrate all data"
echo "4) Test connection only"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "🔍 Running DRY RUN migration..."
        node migrate-firestore-to-mongodb.js --dry-run
        ;;
    2)
        echo ""
        read -p "Enter collection name (users, content, products, etc.): " collection
        echo "🔍 Running DRY RUN for $collection..."
        node migrate-firestore-to-mongodb.js --collection=$collection --dry-run
        
        echo ""
        read -p "Proceed with actual migration? (yes/no): " confirm
        if [ "$confirm" == "yes" ]; then
            node migrate-firestore-to-mongodb.js --collection=$collection
        fi
        ;;
    3)
        echo ""
        echo "⚠️  WARNING: This will migrate ALL data from Firestore to MongoDB"
        echo "⚠️  Make sure you have backed up your Firestore data!"
        echo ""
        read -p "Type 'MIGRATE' to confirm: " confirm
        if [ "$confirm" == "MIGRATE" ]; then
            echo ""
            echo "🚀 Starting full migration..."
            node migrate-firestore-to-mongodb.js --verbose
        else
            echo "❌ Migration cancelled"
        fi
        ;;
    4)
        echo ""
        echo "🧪 Testing database connections..."
        node -e "require('dotenv').config(); const {connectMongoDB} = require('./src/utils/mongodb'); connectMongoDB().then(() => { console.log('✅ MongoDB: Connected'); process.exit(0); }).catch(err => { console.error('❌ MongoDB: Failed'); process.exit(1); });"
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

