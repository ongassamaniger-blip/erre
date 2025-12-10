
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    try {
        console.log('Fetching raw payrolls (pending)...');
        const { data: payrolls, error } = await supabase
            .from('payrolls')
            .select('*')
            .neq('status', 'paid')
            .limit(5);

        if (error) {
            console.error('Error fetching payrolls:', error);
        } else {
            console.log('Raw Payrolls:', JSON.stringify(payrolls, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

verify();
