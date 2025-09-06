{{ config(materialized='view') }}

with orders_normalized as (
  select
    id as order_key,
    order_id,
    user_id,
    workspace_id,
    customer_email,
    customer_name,
    status,
    currency,
    subtotal,
    tax_amount,
    shipping_amount,
    total_price,
    payment_status,
    fulfillment_status,
    source_platform,
    order_date,
    created_at,
    updated_at
  from {{ ref('orders') }}
),

shopify_orders_normalized as (
  select
    id as order_key,
    order_id,
    user_id,
    workspace_id,
    null as customer_email,
    null as customer_name,
    'completed' as status,
    currency,
    revenue as subtotal,
    0 as tax_amount,
    shipping_cost as shipping_amount,
    total_price,
    'paid' as payment_status,
    'fulfilled' as fulfillment_status,
    'shopify' as source_platform,
    date_created as order_date,
    date_created as created_at,
    synced_at as updated_at
  from {{ ref('shopify_orders') }}
),

unioned_orders as (
  select * from orders_normalized
  union all
  select * from shopify_orders_normalized
)

select
  order_key,
  order_id,
  user_id,
  coalesce(workspace_id, 'default_workspace') as workspace_id,
  customer_email,
  customer_name,
  status,
  currency,
  subtotal,
  tax_amount,
  shipping_amount,
  total_price,
  payment_status,
  fulfillment_status,
  source_platform,
  order_date,
  date(order_date) as order_date_key,
  extract(year from order_date) as order_year,
  extract(month from order_date) as order_month,
  extract(day from order_date) as order_day,
  extract(dow from order_date) as order_day_of_week,
  created_at,
  updated_at
from unioned_orders
where order_date is not null
  and total_price >= 0