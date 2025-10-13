create or replace function export_user_data(p_user_id uuid)
returns json as $$
declare
  v_devices json;
  v_referrals json;
  v_wallet json;
begin
  -- Devices
  select json_agg(d) into v_devices
  from (
    select * from device where user_id = p_user_id order by created_at desc
  ) d;

  -- Referrals
  select get_referral_transactions_with_count(p_user_id, 1000000, 0)->'data'
  into v_referrals;

  -- Wallet Transactions
  select get_wallet_transactions_with_count(p_user_id, 1000000, 0)->'data'
  into v_wallet;

  -- Final JSON output
  return json_build_object(
    'devices', coalesce(v_devices, '[]'::json),
    'referrals', coalesce(v_referrals, '[]'::json),
    'wallet_transactions', coalesce(v_wallet, '[]'::json)
  );
end;
$$ language plpgsql;
