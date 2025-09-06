{{ config(materialized='table') }}

with products_base as (
  select
    id as product_id,
    name as product_name,
    sku,
    price,
    cost as cost_per_unit,
    stock_quantity,
    category,
    description,
    image_url,
    coalesce(workspace_id, 'default_workspace') as workspace_id,
    'internal' as source_system,
    created_at,
    updated_at
  from {{ ref('products') }}
),

shopify_products_base as (
  select
    product_id,
    name as product_name,
    sku,
    price,
    cost_per_item as cost_per_unit,
    stock_quantity,
    null as category,
    null as description,
    null as image_url,
    coalesce(workspace_id, 'default_workspace') as workspace_id,
    'shopify' as source_system,
    last_updated as created_at,
    synced_at as updated_at
  from {{ ref('shopify_products') }}
),

unioned_products as (
  select * from products_base
  union all
  select * from shopify_products_base
),

products_with_metrics as (
  select
    *,
    -- Calculate profit margin
    case 
      when price > 0 then ((price - cost_per_unit) / price) * 100
      else 0
    end as profit_margin_percent,
    
    -- Calculate markup
    case 
      when cost_per_unit > 0 then ((price - cost_per_unit) / cost_per_unit) * 100
      else 0
    end as markup_percent,
    
    -- Stock status
    case 
      when stock_quantity = 0 then 'out_of_stock'
      when stock_quantity <= 5 then 'low_stock'
      when stock_quantity <= 20 then 'medium_stock'
      else 'high_stock'
    end as stock_status,
    
    -- Price tier
    case 
      when price < 25 then 'budget'
      when price < 100 then 'mid_range'
      when price < 500 then 'premium'
      else 'luxury'
    end as price_tier
  from unioned_products
)

select
  {{ dbt_utils.generate_surrogate_key(['product_id', 'source_system', 'workspace_id']) }} as product_key,
  product_id,
  product_name,
  sku,
  workspace_id,
  source_system,
  
  -- Product attributes
  category,
  description,
  image_url,
  
  -- Pricing
  price,
  cost_per_unit,
  profit_margin_percent,
  markup_percent,
  price_tier,
  
  -- Inventory
  stock_quantity,
  stock_status,
  
  -- Flags
  case when stock_quantity = 0 then true else false end as is_out_of_stock,
  case when stock_quantity <= 5 then true else false end as is_low_stock,
  case when profit_margin_percent < 20 then true else false end as is_low_margin,
  case when price > 0 and cost_per_unit > 0 then true else false end as has_complete_pricing,
  
  -- Timestamps
  created_at,
  updated_at,
  current_timestamp as dbt_updated_at
from products_with_metrics
where product_id is not null
  and product