{{ config(materialized='table') }}

with sales_data as (
  select
    workspace_id,
    date_key,
    order_date as date,
    net_revenue as revenue,
    total_cogs as cogs,
    gross_profit,
    total_orders,
    unique_customers,
    avg_order_value
  from {{ ref('fct_sales_daily') }}
),

ad_spend_data as (
  select
    workspace_id,
    date_key,
    campaign_date as date,
    total_ad_spend as ad_spend,
    total_impressions,
    total_clicks,
    total_conversions,
    total_campaign_revenue,
    overall_roas as campaign_roas
  from {{ ref('fct_ad_spend_daily') }}
),

-- Create a complete date spine for each workspace
date_spine as (
  select distinct
    workspace_id,
    date_key,
    date
  from (
    select workspace_id, date_key, order_date as date from sales_data
    union
    select workspace_id, date_key, campaign_date as date from ad_spend_data
  ) all_dates
),

-- Combine sales and ad spend data
combined_metrics as (
  select
    ds.workspace_id,
    ds.date_key,
    ds.date,
    
    -- Revenue metrics
    coalesce(s.revenue, 0) as revenue,
    coalesce(s.total_orders, 0) as total_orders,
    coalesce(s.unique_customers, 0) as unique_customers,
    coalesce(s.avg_order_value, 0) as avg_order_value,
    
    -- Cost metrics
    coalesce(s.cogs, 0) as cogs,
    coalesce(a.ad_spend, 0) as ad_spend,
    
    -- Campaign metrics
    coalesce(a.total_impressions, 0) as impressions,
    coalesce(a.total_clicks, 0) as clicks,
    coalesce(a.total_conversions, 0) as conversions,
    coalesce(a.total_campaign_revenue, 0) as campaign_attributed_revenue,
    coalesce(a.campaign_roas, 0) as campaign_roas
    
  from date_spine ds
  left join sales_data s on ds.workspace_id = s.workspace_id and ds.date_key = s.date_key
  left join ad_spend_data a on ds.workspace_id = a.workspace_id and ds.date_key = a.date_key
),

-- Calculate True P&L metrics
true_pnl_metrics as (
  select
    {{ dbt_utils.generate_surrogate_key(['workspace_id', 'date_key']) }} as true_pnl_key,
    workspace_id,
    date_key,
    date,
    
    -- Date dimensions
    extract(year from date) as year,
    extract(month from date) as month,
    extract(day from date) as day,
    extract(dow from date) as day_of_week,
    extract(week from date) as week_of_year,
    extract(quarter from date) as quarter,
    
    -- Core metrics
    revenue,
    ad_spend,
    cogs,
    
    -- Calculated P&L metrics
    revenue - ad_spend - cogs as gross_profit,
    revenue - ad_spend as contribution_margin,
    revenue - cogs as gross_margin_before_ads,
    
    -- Percentage metrics
    case 
      when revenue > 0 then (revenue - ad_spend - cogs) / revenue * 100
      else 0 
    end as gross_profit_margin_percent,
    
    case 
      when revenue > 0 then ad_spend / revenue * 100
      else 0 
    end as ad_spend_percent_of_revenue,
    
    case 
      when revenue > 0 then cogs / revenue * 100
      else 0 
    end as cogs_percent_of_revenue,
    
    case 
      when revenue > 0 then (revenue - cogs) / revenue * 100
      else 0 
    end as gross_margin_percent,
    
    -- ROAS calculations
    case 
      when ad_spend > 0 then revenue / ad_spend
      else null 
    end as true_roas,
    
    case 
      when ad_spend > 0 then (revenue - cogs) / ad_spend
      else null 
    end as gross_margin_roas,
    
    case 
      when ad_spend > 0 then (revenue - ad_spend - cogs) / ad_spend
      else null 
    end as profit_roas,
    
    -- Efficiency metrics
    case 
      when total_orders > 0 then ad_spend / total_orders
      else 0 
    end as ad_spend_per_order,
    
    case 
      when unique_customers > 0 then ad_spend / unique_customers
      else 0 
    end as customer_acquisition_cost,
    
    case 
      when unique_customers > 0 then revenue / unique_customers
      else 0 
    end as revenue_per_customer,
    
    case 
      when unique_customers > 0 then (revenue - ad_spend - cogs) / unique_customers
      else 0 
    end as profit_per_customer,
    
    -- Campaign performance
    impressions,
    clicks,
    conversions,
    campaign_attributed_revenue,
    campaign_roas,
    
    case 
      when impressions > 0 then clicks::decimal / impressions::decimal * 100
      else 0 
    end as click_through_rate,
    
    case 
      when clicks > 0 then conversions::decimal / clicks::decimal * 100
      else 0 
    end as conversion_rate,
    
    case 
      when conversions > 0 then ad_spend / conversions
      else 0 
    end as cost_per_conversion,
    
    -- Order metrics
    total_orders,
    unique_customers,
    avg_order_value,
    
    -- Performance flags
    case when true_roas >= 3.0 then true else false end as is_profitable_roas,
    case when gross_profit > 0 then true else false end as is_profitable,
    case when ad_spend_percent_of_revenue <= 30 then true else false end as is_efficient_ad_spend,
    case when gross_margin_percent >= 50 then true else false end as is_healthy_margin,
    
    -- Timestamps
    current_timestamp as dbt_updated_at
    
  from combined_metrics
),

-- Add rolling averages and trends
final as (
  select
    *,
    
    -- 7-day rolling averages
    avg(revenue) over (
      partition by workspace_id 
      order by date_key 
      rows between 6 preceding and current row
    ) as revenue_7d_avg,
    
    avg(ad_spend) over (
      partition by workspace_id 
      order by date_key 
      rows between 6 preceding and current row
    ) as ad_spend_7d_avg,
    
    avg(gross_profit) over (
      partition by workspace_id 
      order by date_key 
      rows between 6 preceding and current row
    ) as gross_profit_7d_avg,
    
    avg(true_roas) over (
      partition by workspace_id 
      order by date_key 
      rows between 6 preceding and current row
    ) as true_roas_7d_avg,
    
    -- 30-day rolling averages
    avg(revenue) over (
      partition by workspace_id 
      order by date_key 
      rows between 29 preceding and current row
    ) as revenue_30d_avg,
    
    avg(gross_profit) over (
      partition by workspace_id 
      order by date_key 
      rows between 29 preceding and current row
    ) as gross_profit_30d_avg,
    
    -- Month-to-date totals
    sum(revenue) over (
      partition by workspace_id, year, month 
      order by date_key 
      rows unbounded preceding
    ) as revenue_mtd,
    
    sum(ad_spend) over (
      partition by workspace_id, year, month 
      order by date_key 
      rows unbounded preceding
    ) as ad_spend_mtd,
    
    sum(gross_profit) over (
      partition by workspace_id, year, month 
      order by date_key 
      rows unbounded preceding
    ) as gross_profit_mtd
    
  from true_pnl_metrics
)

select * from final
where date >= '2024-01-01'  -- Filter to relevant date range
order by workspace_id, date_key desc