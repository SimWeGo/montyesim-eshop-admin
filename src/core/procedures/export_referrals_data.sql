CREATE OR REPLACE FUNCTION export_referrals_data(
  p_user_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := NULLIF(p_user_id::text, '')::uuid;
  v_total INT;
  v_data JSON;
BEGIN
  -- Count total records (only successful orders)
  SELECT COUNT(*) INTO v_total
  FROM user_order o
  INNER JOIN promotion_usage pu 
    ON o.id = pu.order_id
  WHERE (v_user_id IS NULL OR o.user_id = v_user_id)
    AND o.referral_code IS NOT NULL
    AND o.order_status = 'success'
    AND (p_search IS NULL OR o.referral_code ILIKE '%' || p_search || '%');

  -- Get ALL data (only successful orders)
  SELECT json_agg(t) INTO v_data
  FROM (
    SELECT
      o.id,
      o.created_at,
      o.user_id,
      o.referral_code,
      o.payment_time,
      o.currency,
      o.modified_amount,
      o.order_status,
      pu.status,
      pu.amount AS amount,
      pu.referred_to,
      u.email AS user_email   -- only email of pu.user_id
    FROM
      user_order o
      INNER JOIN promotion_usage pu 
        ON o.id = pu.order_id
      INNER JOIN users_copy u 
        ON u.id = pu.user_id
    WHERE
      (v_user_id IS NULL OR o.user_id = v_user_id)
      AND o.referral_code IS NOT NULL
      AND o.order_status = 'success'
      AND (p_search IS NULL OR o.referral_code ILIKE '%' || p_search || '%')
    ORDER BY o.created_at DESC
  ) t;

  RETURN json_build_object(
    'total', v_total,
    'count', COALESCE(json_array_length(v_data), 0),
    'referrals', COALESCE(v_data, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql;
