CREATE OR REPLACE FUNCTION get_referral_transactions_with_count(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_from_email TEXT DEFAULT NULL,
  p_referral_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_total INT;
  v_data JSON;
BEGIN
  -- Count total records (only successful orders)
  SELECT COUNT(*) INTO v_total
  FROM user_order o
  INNER JOIN promotion_usage pu 
    ON o.id = pu.order_id
  WHERE (p_user_id IS NULL OR o.user_id = p_user_id)
    AND o.referral_code IS NOT NULL
    AND o.order_status = 'success'
    AND (p_search IS NULL OR o.referral_code ILIKE '%' || p_search || '%')
    AND (p_from_email IS NULL OR pu.referred_to ILIKE '%' || p_from_email || '%')
    AND (p_referral_date IS NULL OR o.created_at::date = p_referral_date);

  -- Get paginated data (only successful orders)
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
      u.email AS user_email   -- only email for pu.user_id
    FROM
      user_order o
      INNER JOIN promotion_usage pu 
        ON o.id = pu.order_id
      INNER JOIN users_copy u 
        ON u.id = pu.user_id
    WHERE
      (p_user_id IS NULL OR o.user_id = p_user_id)
      AND o.referral_code IS NOT NULL
      AND o.order_status = 'success'
      AND (p_search IS NULL OR o.referral_code ILIKE '%' || p_search || '%')
      AND (p_from_email IS NULL OR pu.referred_to ILIKE '%' || p_from_email || '%')
      AND (p_referral_date IS NULL OR o.created_at::date = p_referral_date)
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  -- Return final JSON
  RETURN json_build_object(
    'total', v_total,
    'count', COALESCE(json_array_length(v_data), 0),
    'data', COALESCE(v_data, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql;
