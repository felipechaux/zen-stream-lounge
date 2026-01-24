import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envConfig = config({ path: join(__dirname, '.env.local') });

// If .env.local didn't load (maybe because of parsing issues or different format), try manual parsing
if (process.env.NEXT_PUBLIC_SUPABASE_URL === undefined) {
    const envContent = fs.readFileSync(join(__dirname, '.env.local'), 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2];
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log('🔍 Checking "profiles" table...');

    // 1. Try to select from profiles
    // We use .select('*', { count: 'exact', head: true }) to just check existence/permission without fetching data if possible,
    // but header-only might not return error if table doesn't exist in some cases.
    // Best is just select 1.
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting from profiles table:');
        console.error(JSON.stringify(error, null, 2));

        if (error.code === '42P01') { // PostgreSQL error code for undefined table
            console.error('\n🚨 CONCLUSION: The "profiles" table does NOT exist.');
            console.error('   Please run the SQL script provided in "supabase/schema.sql" in your Supabase Dashboard.');
        } else {
            console.error('\n🚨 CONCLUSION: There is an error accessing the "profiles" table.');
            console.error(`   Code: ${error.code}, Message: ${error.message}, Hint: ${error.hint}`);
        }
    } else {
        console.log('✅ Success! "profiles" table exists and is accessible.');
        console.log(`   Rows found: ${data.length}`);
        if (data.length === 0) {
            console.log('   (Table is empty or RLS prevents viewing rows as anon)');
        }
    }
}

checkProfiles();
