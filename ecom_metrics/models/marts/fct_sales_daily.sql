{{ config(materialized='table') }}

with daily_orders as (
  select
    workspace_id,
    order_date_key as date_key,
    order_date,
    
    -- Order counts
    count(*) as total_orders,
    count(case when status = 'completed' then 1 end) as completed_orders,
    count(case when status = 'cancelled' then 1 end) as cancelled_orders,
    count(case when status = 'refunded' then 1 end) as refunded_orders,
    
    -- Revenue metrics
    sum(total_price) as gross_revenue,
    sum(case when status not in ('cancelled', 'refunded') then total_price else 0 end) as net_revenue,
    sum(subtotal) as subtotal_amount,
    sum(tax_amount) as tax_amount,
    sum(shipping_amount) as shipping_amount,
    
    -- Average order value
    avg(total_price) as avg_order_value,
    avg(case when status not in ('cancelled', 'refunded') then total_price end) as avg_net_order_value,
    
    -- Customer metrics
    count(distinct customer_email) as unique_customers,
    
    -- Platform breakdown
    count(case when source_platform = 'shopify' then 1 end) as shopify_orders,
    count(case when source_platform = 'manual' then 1 end) as manual_orders,
    sum(case when source_platform = 'shopify' then total_price else 0 end) as shopify_revenue,
    sum(case when source_platform = 'manual' then total_price else 0 end) as manual_revenue
    
  from {{ ref('stg_orders') }}
  group by workspace_id, order_date_key, order_date
),

order_items_daily as (
  select
    o.workspace_id,
    o.order_date_key as date_key,
    
    -- Product metrics
    count(oi.id) as total_line_items,
    sum(oi.quantity) as total_quantity_sold,
    count(distinct oi.product_id) as unique_products_sold,
    count(distinct oi.sku) as unique_skus_sold,
    
    -- Cost metrics (COGS)
    sum(oi.total_cost) as total_cogs,
    sum(oi.cost_per_unit * oi.quantity) as calculated_cogs,
    avg(oi.cost_per_unit) as avg_cost_per_unit,
    
    -- Product revenue
    sum(oi.total_price) as product_revenue,
    avg(oi.unit_price) as avg_unit_price
    
  from {{ ref('stg_orders') }} o
  join {{ ref('order_items') }} oi on o.order_key = oi.order_id
  group by o.workspace_id, o.order_date_key
),

final as (
  select
    {{ dbt_utils.generate_surrogate_key(['do.workspace_id', 'do.date_key']) }} as sales_daily_key,
    do.workspace_id,
    do.date_key,
    do.order_date,
    
    -- Date dimensions
    extract(year from do.order_date) as year,
    extract(month from do.order_date) as month,
    extract(day from do.order_date) as day,
    extract(dow from do.order_date) as day_of_week,
    extract(week from do.order_date) as week_of_year,
    extract(quarter from do.order_date) as quarter,
    
    -- Order metrics
    do.total_orders,
    do.completed_orders,
    do.cancelled_orders,
    do.refunded_orders,
    
    -- Revenue metrics
    do.gross_revenue,
    do.net_revenue,
    do.subtotal_amount,
    do.tax_amount,
    do.shipping_amount,
    
    -- Average metrics
    do.avg_order_value,
    do.avg_net_order_value,
    
    -- Customer metrics
    do.unique_customers,
    case when do.unique_customers > 0 then do.net_revenue / do.unique_customers else 0 end as revenue_per_customer,
    
    -- Platform metrics
    do.shopify_orders,
    do.manual_orders,
    do.shopify_revenue,
    do.manual_revenue,
    
    -- Product metrics
    coalesce(oid.total_line_items, 0) as total_line_items,
    coalesce(oid.total_quantity_sold, 0) as total_quantity_sold,
    coalesce(oid.unique_products_sold, 0) as unique_products_sold,
    coalesce(oid.unique_skus_sold, 0) as unique_skus_sold,
    
    -- Cost and profit metrics
    coalesce(oid.total_cogs, 0) as total_cogs,
    coalesce(oid.calculated_cogs, 0) as calculated_cogs,
    coalesce(oid.avg_cost_per_unit, 0) as avg_cost_per_unit,
    coalesce(oid.product_revenue, 0) as product_revenue,
    coalesce(oid.avg_unit_price, 0) as avg_unit_price,
    
    -- Calculated profit metrics
    do.net_revenue - coalesce(oid.total_cogs, 0) as gross_profit,
    case 
      when do.net_revenue > 0 then (do.net_revenue - coalesce(oid.total_cogs, 0)) / do.net_revenue * 100
      else 0 
    end as gross_margin_percent,
    
    -- Conversion metrics
    case when do.total_orders > 0 then do.completed_orders::decimal / do.total_orders::decimal * 100 else 0 end as completion_rate,
    case when do.total_orders > 0 then do.cancelled_orders::decimal / do.total_orders::decimal * 100 else 0 end as cancellation_rate,
    
    -- Timestamps
    current_timestamp as dbt_updated_at
    
  from daily_orders do
  left join order_items_daily oid on do.workspace_id = oid.workspace_id and do.date_key = oid.date_key
)

select * from final
order by workspace_id, date_key desc