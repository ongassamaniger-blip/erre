-- Add currency conversion columns to transactions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'exchange_rate') THEN
        ALTER TABLE transactions ADD COLUMN exchange_rate NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount_in_try') THEN
        ALTER TABLE transactions ADD COLUMN amount_in_try NUMERIC;
    END IF;
END $$;

-- Add currency conversion columns to qurban_donations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qurban_donations' AND column_name = 'exchange_rate') THEN
        ALTER TABLE qurban_donations ADD COLUMN exchange_rate NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qurban_donations' AND column_name = 'amount_in_try') THEN
        ALTER TABLE qurban_donations ADD COLUMN amount_in_try NUMERIC;
    END IF;
END $$;
