create or replace function get_wallet_transactions_with_count(
  p_user_id uuid default null,
  p_limit int default 10,
  p_offset int default 0
)
returns json as $$
declare
  v_total int;
  v_data json;
begin
  -- Count total
  select count(*) into v_total
  from user_wallet_transaction as uwt
  inner join user_wallet as uw on uw.id = uwt.wallet_id
  where p_user_id is null or uw.user_id = p_user_id;

  -- Fetch paginated data
  select json_agg(t) into v_data
  from (
    select 
      uwt.id,
      uwt.wallet_id,
      uwt.amount,
      uwt.status,
      uw.currency,
      uwt.source,
      uwt.created_at
    from user_wallet_transaction as uwt
    inner join user_wallet as uw on uw.id = uwt.wallet_id
    where p_user_id is null or uw.user_id = p_user_id
    order by uwt.created_at desc
    limit p_limit offset p_offset
  ) t;

  return json_build_object(
    'total', v_total,
    'count', coalesce(json_array_length(v_data), 0),
    'data', coalesce(v_data, '[]'::json)
  );
end;
$$ language plpgsql;