#!/bin/bash

echo "🚀 Setting up Supabase MCP Server..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Supabase credentials:"
    echo "   - SUPABASE_URL=https://your-project.supabase.co"
    echo "   - SUPABASE_ANON_KEY=your_anon_key_here"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the server
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure your .env file with Supabase credentials"
    echo "2. Test the server: npm start"
    echo "3. The server is now ready to be used with VS Code MCP extensions"
    echo ""
    echo "📖 See README.md for integration instructions"
else
    echo "❌ Build failed. Please check the errors above."
fi
