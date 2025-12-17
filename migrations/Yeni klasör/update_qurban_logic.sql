-- Add campaign_type column to qurban_campaigns
ALTER TABLE qurban_campaigns 
ADD COLUMN IF NOT EXISTS campaign_type TEXT CHECK (campaign_type IN ('small_cattle', 'large_cattle'));

-- Function to calculate campaign stats
CREATE OR REPLACE FUNCTION calculate_campaign_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_campaign_id UUID;
    total_amount DECIMAL(15, 2);
    total_shares INTEGER;
    camp_type TEXT;
    animal_count INTEGER;
BEGIN
    -- Determine the campaign ID based on the operation
    IF (TG_OP = 'DELETE') THEN
        target_campaign_id := OLD.campaign_id;
    ELSE
        target_campaign_id := NEW.campaign_id;
    END IF;

    -- Get campaign type
    SELECT campaign_type INTO camp_type FROM qurban_campaigns WHERE id = target_campaign_id;

    -- Calculate total collected amount (only paid donations)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_amount
    FROM qurban_donations
    WHERE campaign_id = target_campaign_id AND payment_status = 'paid';

    -- Calculate total animals based on campaign type
    IF camp_type = 'small_cattle' THEN
        -- For small cattle (sheep/goat), each donation counts as 1 animal (assuming 1 share per donation for simplicity, or sum shares if applicable)
        -- Usually sheep/goat is 1 share = 1 animal.
        SELECT COALESCE(COUNT(*), 0)
        INTO animal_count
        FROM qurban_donations
        WHERE campaign_id = target_campaign_id AND payment_status = 'paid';
    ELSIF camp_type = 'large_cattle' THEN
        -- For large cattle (cow/camel), 7 shares = 1 animal.
        SELECT COALESCE(SUM(share_count), 0)
        INTO total_shares
        FROM qurban_donations
        WHERE campaign_id = target_campaign_id AND payment_status = 'paid';
        
        animal_count := FLOOR(total_shares / 7);
    ELSE
        -- Fallback if type is not set (treat as 0 or handle as needed)
        animal_count := 0;
    END IF;

    -- Update the campaign
    UPDATE qurban_campaigns
    SET 
        collected_amount = total_amount,
        completed_animals = animal_count,
        status = CASE 
            WHEN total_amount >= target_amount THEN 'completed'
            WHEN status = 'completed' AND total_amount < target_amount THEN 'active' -- Revert if refund happens
            ELSE status
        END
    WHERE id = target_campaign_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON qurban_donations;

-- Create trigger
CREATE TRIGGER update_campaign_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON qurban_donations
FOR EACH ROW
EXECUTE FUNCTION calculate_campaign_stats();
