# Supabase MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Supabase databases.

## Features

- **supabase_query**: Execute SELECT queries on your Supabase database
- **supabase_insert**: Insert new records into tables
- **supabase_update**: Update existing records
- **supabase_delete**: Delete records from tables
- **supabase_schema**: Get table schema information

## Setup ✅ CONFIGURED

1. **Dependencies installed:** ✅
   ```bash
   cd mcp-supabase
   npm install
   ```

2. **Environment configured:** ✅
   Your Supabase credentials are configured in `.env`:
   ```
   SUPABASE_URL=https://hpprixmloolaoxgradol.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Server built:** ✅
   ```bash
   npm run build
   ```

## Usage with VS Code

To use this MCP server with VS Code, you need to configure it in your VS Code settings.

### Option 1: Using Claude Desktop (Recommended)

Add this to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["path/to/your/mcp-supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key_here"
      }
    }
  }
}
```

### Option 2: Direct VS Code Integration

1. Install the MCP extension for VS Code (if available)
2. Configure the server in your workspace settings:

```json
{
  "mcp.servers": {
    "supabase": {
      "command": "node",
      "args": ["./mcp-supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key_here"
      }
    }
  }
}
```

## Tool Examples

### Query Data
```json
{
  "name": "supabase_query",
  "arguments": {
    "table": "users",
    "select": "id, email, created_at",
    "filters": {
      "status": "active"
    },
    "limit": 10,
    "orderBy": {
      "column": "created_at",
      "ascending": false
    }
  }
}
```

### Insert Data
```json
{
  "name": "supabase_insert",
  "arguments": {
    "table": "users",
    "data": {
      "email": "user@example.com",
      "name": "John Doe",
      "status": "active"
    }
  }
}
```

### Update Data
```json
{
  "name": "supabase_update",
  "arguments": {
    "table": "users",
    "data": {
      "status": "inactive"
    },
    "filters": {
      "id": "123"
    }
  }
}
```

### Delete Data
```json
{
  "name": "supabase_delete",
  "arguments": {
    "table": "users",
    "filters": {
      "id": "123"
    }
  }
}
```

### Get Schema
```json
{
  "name": "supabase_schema",
  "arguments": {
    "table": "users"
  }
}
```

## Development

- `npm run dev`: Build and watch for changes
- `npm run build`: Build the TypeScript code
- `npm start`: Run the built server

## Security Notes

- Use environment variables for credentials, never commit them to version control
- Consider using Supabase RLS (Row Level Security) policies for additional security
- The anon key should have appropriate permissions in your Supabase project

## Troubleshooting

1. **Module not found errors**: Make sure you've run `npm install` and `npm run build`
2. **Connection errors**: Verify your SUPABASE_URL and SUPABASE_ANON_KEY are correct
3. **Permission errors**: Check your Supabase RLS policies and anon key permissions
