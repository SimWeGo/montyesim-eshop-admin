alter table promotion_rule
add column id_text text generated always as (id::text) stored;