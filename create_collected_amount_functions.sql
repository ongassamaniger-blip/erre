-- Function to increment collected amount
CREATE OR REPLACE FUNCTION increment_campaign_collected(campaign_id UUID, amount_to_add NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE qurban_campaigns
  SET collected_amount = COALESCE(collected_amount, 0) + amount_to_add
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement collected amount
CREATE OR REPLACE FUNCTION decrement_campaign_collected(campaign_id UUID, amount_to_subtract NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE qurban_campaigns
  SET collected_amount = GREATEST(0, COALESCE(collected_amount, 0) - amount_to_subtract)
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
