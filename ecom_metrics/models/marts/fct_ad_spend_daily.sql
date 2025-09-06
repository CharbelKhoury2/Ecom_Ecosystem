{{ config(materialized='table') }}

with daily_campaigns as (
  select
    workspace_id,
    date_key,
    campaign_date,
    
    -- Campaign counts
    count(*) as total_campaigns,
    count(case when status = 'active' then 1 end) as active_campaigns,
    count(case when status = 'paused' then 1 end) as paused_campaigns,
    count(case when status = 'completed' then 1 end) as completed_campaigns,
    
    -- Spend metrics
    sum(total_spend) as total_ad_spend,
    sum(daily_budget) as total_daily_budget,
    avg(daily_budget) as avg_daily_budget,
    
    -- Performance metrics
    sum(impressions) as total_impressions,
    sum(clicks) as total_clicks,
    sum(conversions) as total_conversions,
    sum(campaign_revenue) as total_campaign_revenue,
    
    -- Calculated averages
    avg(calculated_roas) as avg_roas,
    avg(calculated_ctr) as avg_ctr,
    avg(calculated_cpc) as avg_cpc,
    avg(conversion_rate) as avg_conversion_rate,
    
    -- Weighted averages (by spend)
    case 
      when sum(total_spend) > 0 then 
        sum(calculated_roas * total_spend) / sum(total_spend)
      else 0 
    end as spend_weighted_roas,
    
    case 
      when sum(total_spend) > 0 then 
        sum(calculated_ctr * total_spend) / sum(total_spend)
      else 0 
    end as spend_weighted_ctr,
    
    -- Budget utilization
    case 
      when sum(daily_budget) > 0 then 
        sum(total_spend) / sum(daily_budget) * 100
      else 0 
    end as budget_utilization_percent
    
  from {{ ref('stg_campaigns') }}
  group by workspace_id, date_key, campaign_date
),

final as (
  select
    {{ dbt_utils.generate_surrogate_key(['workspace_id', 'date_key']) }} as ad_spend_daily_key,
    workspace_id,
    date_key,
    campaign_date,
    
    -- Date dimensions
    extract(year from campaign_date) as year,
    extract(month from campaign_date) as month,
    extract(day from campaign_date) as day,
    extract(dow from campaign_date) as day_of_week,
    extract(week from campaign_date) as week_of_year,
    extract(quarter from campaign_date) as quarter,
    
    -- Campaign metrics
    total_campaigns,
    active_campaigns,
    paused_campaigns,
    completed_campaigns,
    
    -- Spend metrics
    total_ad_spend,
    total_daily_budget,
    avg_daily_budget,
    budget_utilization_percent,
    
    -- Performance metrics
    total_impressions,
    total_clicks,
    total_conversions,
    total_campaign_revenue,
    
    -- Calculated performance metrics
    case 
      when total_ad_spend > 0 then total_campaign_revenue / total_ad_spend
      else 0 
    end as overall_roas,
    
    case 
      when total_impressions > 0 then total_clicks::decimal / total_impressions::decimal * 100
      else 0 
    end as overall_ctr,
    
    case 
      when total_clicks > 0 then total_ad_spend / total_clicks
      else 0 
    end as overall_cpc,
    
    case 
      when total_clicks > 0 then total_conversions::decimal / total_clicks::decimal * 100
      else 0 
    end as overall_conversion_rate,
    
    case 
      when total_conversions > 0 then total_ad_spend / total_conversions
      else 0 
    end as cost_per_conversion,
    
    case 
      when total_conversions > 0 then total_campaign_revenue / total_conversions
      else 0 
    end as revenue_per_conversion,
    
    -- Average metrics
    avg_roas,
    avg_ctr,
    avg_cpc,
    avg_conversion_rate,
    
    -- Weighted averages
    spend_weighted_roas,
    spend_weighted_ctr,
    
    -- Efficiency metrics
    case 
      when total_impressions > 0 then total_ad_spend / total_impressions * 1000
      else 0 
    end as cpm, -- Cost per mille (thousand impressions)
    
    case 
      when total_campaign_revenue > 0 then (total_campaign_revenue - total_ad_spend) / total_campaign_revenue * 100
      else 0 
    end as profit_margin_percent,
    
    total_campaign_revenue - total_ad_spend as net_profit,
    
    -- Performance flags
    case when overall_roas >= 3.0 then true else false end as is_high_roas,
    case when overall_ctr >= 2.0 then true else false end as is_high_ctr,
    case when overall_conversion_rate >= 5.0 then true else false end as is_high_conversion_rate,
    case when budget_utilization_percent >= 90 then true else false end as is_high_budget_utilization,
    case when budget_utilization_percent <= 50 then true else false end as is_low_budget_utilization,
    
    -- Timestamps
    current_timestamp as dbt_updated_at
    
  from daily_campaigns
)

select * from final
order by workspace_id, date_key desc