-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_promotion_rule_name()
RETURNS TRIGGER AS $$
DECLARE
  action_name TEXT;
  event_name TEXT;
BEGIN
  SELECT name INTO action_name FROM promotion_rule_action WHERE id = NEW.promotion_rule_action_id;
  SELECT name INTO event_name FROM promotion_rule_event WHERE id = NEW.promotion_rule_event_id;

  NEW.name := action_name || '-' || event_name || '-' || NEW.max_usage::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on promotion_rule table
DROP TRIGGER IF EXISTS trg_update_promotion_rule_name ON promotion_rule;

CREATE TRIGGER trg_update_promotion_rule_name
BEFORE INSERT OR UPDATE ON promotion_rule
FOR EACH ROW
EXECUTE FUNCTION update_promotion_rule_name();