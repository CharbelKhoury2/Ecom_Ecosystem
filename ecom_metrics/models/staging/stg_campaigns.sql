{{ config(materialized='view') }}

with campaigns_base as (
  select
    id as campaign_key,
    campaign_id,
    name as campaign_name,
    status,
    daily_budget,
    total_spend,
    impressions,
    clicks,
    conversions,
    revenue,
    roas,
    ctr,
    cpc,
    coalesce(workspace_id, 'default_workspace') as workspace_id,
    coalesce(date, date(created_at)) as campaign_date,
    created_at,
    updated_at
  from {{ ref('meta_campaigns') }}
)

select
  campaign_key,
  campaign_id,
  campaign_name,
  status,
  workspace_id,
  campaign_date,
  campaign_date as date_key,
  extract(year from campaign_date) as campaign_year,
  extract(month from campaign_date) as campaign_month,
  extract(day from campaign_date) as campaign_day,
  extract(dow from campaign_date) as campaign_day_of_week,
  
  -- Budget and spend metrics
  daily_budget,
  total_spend,
  
  -- Performance metrics
  impressions,
  clicks,
  conversions,
  revenue as campaign_revenue,
  
  -- Calculated metrics
  case 
    when total_spend > 0 then revenue / total_spend 
    else 0 
  end as calculated_roas,
  
  case 
    when impressions > 0 then (clicks::decimal / impressions::decimal) * 100 
    else 0 
  end as calculated_ctr,
  
  case 
    when clicks > 0 then total_spend / clicks 
    else 0 
  end as calculated_cpc,
  
  case 
    when clicks > 0 then conversions::decimal / clicks::decimal * 100 
    else 0 
  end as conversion_rate,
  
  -- Original metrics for comparison
  roas as reported_roas,
  ctr as reported_ctr,
  cpc as reported_cpc,
  
  created_at,
  updated_at
from campaigns_base
where campaign_date is not null
  and status in ('active', 'paused', 'completed')