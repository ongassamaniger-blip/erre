
import { transactionService } from './src/services/finance/transactionService';
import { supabase } from './src/lib/supabase';

async function verify() {
    try {
        console.log('Fetching upcoming payments...');
        const payments = await transactionService.getUpcomingPayments();
        console.log('Upcoming Payments:', JSON.stringify(payments, null, 2));

        console.log('Fetching raw payrolls...');
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
