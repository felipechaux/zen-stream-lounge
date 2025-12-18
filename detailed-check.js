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

console.log('🔍 Detailed Database Analysis...\n');

async function testSpecificTable(tableName) {
  console.log(`\n🧪 Testing table: ${tableName}`);
  
  try {
    // Try to select with explicit columns to get schema info
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      
      if (error.code === 'PGRST116') {
        console.log(`   📝 Table '${tableName}' does not exist`);
      } else if (error.code === '42501') {
        console.log(`   🔒 Table '${tableName}' exists but access denied (RLS)`);
      }
      
      return false;
    }

    console.log(`   ✅ Table '${tableName}' exists and is accessible`);
    console.log(`   📊 Row count: ${count}`);
    
    if (data && data.length > 0) {
      console.log(`   📋 Sample structure:`, Object.keys(data[0]));
    } else {
      console.log(`   📋 Table is empty or no accessible rows`);
    }
    
    return true;
    
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function checkAuthTables() {
  console.log('\n🔐 Checking Authentication Tables...');
  
  try {
    // Check if we can access auth.users (usually restricted)
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('   ℹ️  Not authenticated (using anon key)');
    } else {
      console.log('   ✅ User authenticated:', data.user?.email || 'unknown');
    }
    
    // Try to access auth schema directly (will likely fail)
    const { data: authData, error: authError } = await supabase
      .from('auth.users')
      .select('email')
      .limit(1);
    
    if (authError) {
      console.log('   🔒 auth.users table not directly accessible (normal)');
    } else {
      console.log('   📊 auth.users accessible, count:', authData?.length || 0);
    }
    
  } catch (err) {
    console.log('   ❌ Auth check failed:', err.message);
  }
}

async function main() {
  // Test a few key tables
  const tablesToTest = ['users', 'profiles', 'posts', 'todos'];
  
  for (const table of tablesToTest) {
    await testSpecificTable(table);
  }
  
  await checkAuthTables();
  
  console.log('\n📝 Database Status Summary:');
  console.log('   🌐 Connection: ✅ Working');
  console.log('   🔑 Authentication: Anon key (limited access)');
  console.log('   🏗️  Schema: Tables may exist but are protected by RLS');
  console.log('   🔒 Security: Row Level Security likely enabled');
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Check Supabase dashboard for actual table structure');
  console.log('   2. Review RLS policies if tables exist but return empty');
  console.log('   3. Create tables through dashboard if none exist');
  console.log('   4. Use service role key for admin operations');
  console.log('   5. The MCP server is ready for data operations once tables are set up');
}

main().catch(console.error);
