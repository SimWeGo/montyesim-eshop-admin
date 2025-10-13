CREATE OR REPLACE FUNCTION validate_bundle_codes()
RETURNS TRIGGER AS $$
DECLARE
    code TEXT;
    exists_count INT;
BEGIN
    -- Only validate if bundle_code is NOT NULL and NOT empty
    IF NEW.bundle_code IS NULL OR trim(NEW.bundle_code) = '' THEN
        RETURN NEW;
    END IF;

    -- Split bundle_code string into array
    FOREACH code IN ARRAY string_to_array(NEW.bundle_code, ',')
    LOOP
        SELECT COUNT(*) INTO exists_count
        FROM bundle
        WHERE data->>'bundle_code' = trim(code);

        IF exists_count = 0 THEN
            RAISE EXCEPTION 'Invalid bundle code: %', code;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_bundle_codes_promo_trigger
BEFORE INSERT OR UPDATE ON promotion
FOR EACH ROW
EXECUTE FUNCTION validate_bundle_codes();
