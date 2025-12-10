-- Backfill transactions table
UPDATE transactions 
SET 
  amount_in_try = amount, 
  exchange_rate = 1 
WHERE amount_in_try IS NULL;

-- Backfill qurban_donations table
UPDATE qurban_donations 
SET 
  amount_in_try = amount, 
  exchange_rate = 1 
WHERE amount_in_try IS NULL;
