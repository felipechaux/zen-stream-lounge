import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from mcp-supabase/.env
config({ path: join(__dirname, 'mcp-supabase', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking for existing tables...\n');

// Common table names to check for
const commonTables = [
  'users', 'profiles', 'posts', 'comments', 'products', 'orders', 
  'categories', 'tags', 'articles', 'items', 'content', 'media',
  'auth.users', 'public.users', 'todos', 'tasks', 'messages'
];

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, count: data?.length || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function main() {
  console.log('Checking common table names...\n');

  const existingTables = [];
  
  for (const tableName of commonTables) {
    const result = await checkTable(tableName);
    
    if (result.exists) {
      existingTables.push({ name: tableName, count: result.count });
      console.log(`✅ Found table: ${tableName}`);
    } else {
      console.log(`❌ No table: ${tableName}`);
    }
  }

  if (existingTables.length > 0) {
    console.log('\n📋 Summary of existing tables:');
    existingTables.forEach(table => {
      console.log(`   • ${table.name}: ${table.count} rows`);
    });
  } else {
    console.log('\n📋 No common tables found');
    console.log('   This appears to be a fresh Supabase database');
    console.log('   You may need to create tables or enable RLS policies');
  }

  // Test creating a simple table to verify write permissions
  console.log('\n🧪 Testing table creation...');
  
  try {
    const { error } = await supabase.rpc('create_test_table', {});
    if (error) {
      console.log('ℹ️  Cannot create tables with anon key (expected)');
      console.log('   Use the Supabase dashboard or service role key for DDL operations');
    }
  } catch (err) {
    console.log('ℹ️  RPC functions not available or limited permissions');
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Visit your Supabase dashboard to create tables');
  console.log('   2. Set up Row Level Security (RLS) policies');
  console.log('   3. Use the MCP server for data operations');
  console.log('   4. Consider creating a service role key for admin operations');
}

main().catch(console.error);
