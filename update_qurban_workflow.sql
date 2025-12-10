-- Add delivery_address column to qurban_donations
ALTER TABLE qurban_donations 
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Update calculate_campaign_stats function to handle auto-completion
CREATE OR REPLACE FUNCTION calculate_campaign_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_campaign_id UUID;
    total_amount DECIMAL(15, 2);
    total_shares INTEGER;
    camp_type TEXT;
    animal_count INTEGER;
    target_amt DECIMAL(15, 2);
    target_anim INTEGER;
    new_status TEXT;
BEGIN
    -- Determine the campaign ID based on the operation
    IF (TG_OP = 'DELETE') THEN
        target_campaign_id := OLD.campaign_id;
    ELSE
        target_campaign_id := NEW.campaign_id;
    END IF;

    -- Get campaign details
    SELECT campaign_type, target_amount, target_animals, status 
    INTO camp_type, target_amt, target_anim, new_status
    FROM qurban_campaigns 
    WHERE id = target_campaign_id;

    -- Calculate total collected amount (only paid donations)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_amount
    FROM qurban_donations
    WHERE campaign_id = target_campaign_id AND payment_status = 'paid';

    -- Calculate total animals based on campaign type
    IF camp_type = 'small_cattle' THEN
        -- For small cattle (sheep/goat), each donation counts as 1 animal
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
        -- Fallback if type is not set
        animal_count := 0;
    END IF;

    -- Check for completion (only if currently active)
    IF new_status = 'active' THEN
        IF (target_amt > 0 AND total_amount >= target_amt) OR (target_anim > 0 AND animal_count >= target_anim) THEN
            new_status := 'completed';
        END IF;
    END IF;

    -- Update the campaign
    UPDATE qurban_campaigns
    SET 
        collected_amount = total_amount,
        completed_animals = animal_count,
        status = new_status
    WHERE id = target_campaign_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
