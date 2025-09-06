# E-commerce Metrics dbt Project

This dbt project implements a comprehensive data transformation pipeline for e-commerce analytics, providing True P&L calculations, ROAS analysis, and business intelligence metrics.

## 🏗️ Project Structure

```
ecom_metrics/
├── models/
│   ├── staging/          # Staging models for data cleaning and normalization
│   │   ├── stg_orders.sql
│   │   ├── stg_campaigns.sql
│   │   ├── dim_products.sql
│   │   └── schema.yml
│   └── marts/            # Business logic and final metrics
│       ├── fct_sales_daily.sql
│       ├── fct_ad_spend_daily.sql
│       ├── mtr_true_pnl.sql
│       └── schema.yml
├── seeds/                # Sample data for testing
│   ├── seed_orders.csv
│   ├── seed_order_items.csv
│   └── seed_meta_campaigns.csv
├── tests/                # Custom data tests
├── macros/               # Reusable SQL macros
├── dbt_project.yml       # Project configuration
├── profiles.yml          # Database connection settings
└── packages.yml          # dbt package dependencies
```

## 📊 Data Model Lineage

### Source Tables
- `orders` - Normalized order transactions
- `order_items` - Line items with product details and COGS
- `meta_campaigns` - Meta advertising campaign performance
- `products` - Product catalog with pricing
- `shopify_orders` - Legacy Shopify order data
- `shopify_products` - Legacy Shopify product data

### Staging Models
1. **`stg_orders`** - Combines and normalizes order data from multiple sources
2. **`stg_campaigns`** - Cleans and enriches Meta campaign data
3. **`dim_products`** - Product dimension with calculated metrics

### Fact Tables
1. **`fct_sales_daily`** - Daily sales aggregations by workspace
2. **`fct_ad_spend_daily`** - Daily advertising spend and performance

### Metrics Tables
1. **`mtr_true_pnl`** - **Core True P&L metrics combining sales and ad spend**

## 🎯 Key Metrics Calculated

### True P&L Metrics
- **Revenue** - Total sales revenue
- **Ad Spend** - Total advertising costs
- **COGS** - Cost of goods sold
- **Gross Profit** - Revenue - Ad Spend - COGS
- **True ROAS** - Revenue / Ad Spend
- **Gross Margin ROAS** - (Revenue - COGS) / Ad Spend
- **Profit ROAS** - (Revenue - Ad Spend - COGS) / Ad Spend

### Performance Metrics
- Customer Acquisition Cost (CAC)
- Revenue per Customer
- Profit per Customer
- Conversion Rates
- Click-through Rates
- Average Order Value

### Rolling Averages
- 7-day rolling averages for key metrics
- 30-day rolling averages
- Month-to-date totals

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- dbt-postgres
- Access to Supabase Postgres database

### Installation

1. **Install dbt**
   ```bash
   pip install dbt-postgres==1.9.1
   pip install dbt-core==1.10.11
   ```

2. **Install project dependencies**
   ```bash
   cd ecom_metrics
   dbt deps
   ```

3. **Configure database connection**
   
   Update `profiles.yml` with your Supabase credentials:
   ```yaml
   ecom_metrics:
     target: dev
     outputs:
       dev:
         type: postgres
         host: db.your-project.supabase.co
         user: postgres
         password: "{{ env_var('SUPABASE_DB_PASSWORD') }}"
         port: 5432
         dbname: postgres
         schema: public
         threads: 4
         sslmode: require
   ```

4. **Set environment variable**
   ```bash
   export SUPABASE_DB_PASSWORD="your_supabase_password"
   ```

### Running the Project

1. **Test database connection**
   ```bash
   dbt debug
   ```

2. **Load seed data (for testing)**
   ```bash
   dbt seed
   ```

3. **Run all models**
   ```bash
   dbt run
   ```

4. **Run tests**
   ```bash
   dbt test
   ```

5. **Generate documentation**
   ```bash
   dbt docs generate
   dbt docs serve
   ```

### Running Specific Models

```bash
# Run only staging models
dbt run --select staging

# Run only the True P&L model
dbt run --select mtr_true_pnl

# Run models and downstream dependencies
dbt run --select stg_orders+

# Run tests for specific model
dbt test --select mtr_true_pnl
```

## 🧪 Testing Strategy

### Data Quality Tests
- **Uniqueness** - Ensure primary keys are unique
- **Not Null** - Critical fields cannot be null
- **Accepted Values** - Enum fields have valid values
- **Range Checks** - Numeric fields within expected ranges
- **Freshness** - Source data is recent
- **Custom Tests** - Business logic validation

### Example Test Results Validation

Using the seed data, expected True P&L calculations:

**Day 1 (2024-01-15):**
- Revenue: $360.00 (125.00 + 235.00)
- Ad Spend: $115.00 (45.00 + 70.00)
- COGS: $120.00 (40.00 + 80.00)
- Gross Profit: $125.00 (360 - 115 - 120)
- True ROAS: 3.13 (360 / 115)

**Day 2 (2024-01-16):**
- Revenue: $525.00 (180.00 + 345.00)
- Ad Spend: $150.00 (55.00 + 95.00)
- COGS: $160.00 (60.00 + 100.00)
- Gross Profit: $215.00 (525 - 150 - 160)
- True ROAS: 3.50 (525 / 150)

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows for:

- **Pull Request Checks**
  - dbt model compilation
  - Test execution
  - Data quality validation
  - Performance checks

- **Production Deployment**
  - Automated deployment on main branch
  - Production test execution
  - Documentation generation

## 📈 API Integration

The dbt models are consumed by the `/api/metrics/true_pnl` endpoint:

```javascript
// Example API call
GET /api/metrics/true_pnl?workspace_id=test_workspace&date_from=2024-01-01&date_to=2024-01-31

// Response includes:
{
  "success": true,
  "data": [...],
  "summary": {
    "total_revenue": 1000.00,
    "total_ad_spend": 300.00,
    "total_gross_profit": 400.00,
    "avg_roas": 3.33
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Errors**
   ```bash
   # Check database connectivity
   dbt debug
   
   # Verify environment variables
   echo $SUPABASE_DB_PASSWORD
   ```

2. **Model Compilation Errors**
   ```bash
   # Check for syntax errors
   dbt parse
   
   # Compile specific model
   dbt compile --select mtr_true_pnl
   ```

3. **Test Failures**
   ```bash
   # Run tests with detailed output
   dbt test --store-failures
   
   # Check failed test results
   SELECT * FROM test_failures.unique_stg_orders_order_key;
   ```

4. **Performance Issues**
   ```bash
   # Run with performance logging
   dbt run --log-level debug
   
   # Check query performance
   dbt run --select mtr_true_pnl --log-level info
   ```

### Data Validation

```sql
-- Validate True P&L calculations
SELECT 
  date,
  revenue,
  ad_spend,
  cogs,
  gross_profit,
  revenue - ad_spend - cogs as calculated_profit,
  ABS(gross_profit - (revenue - ad_spend - cogs)) as profit_diff
FROM mtr_true_pnl
WHERE workspace_id = 'test_workspace'
ORDER BY date;
```

## 📚 Additional Resources

- [dbt Documentation](https://docs.getdbt.com/)
- [dbt-utils Package](https://github.com/dbt-labs/dbt-utils)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Create feature branch from `develop`
2. Make changes to dbt models
3. Add appropriate tests
4. Run `dbt test` locally
5. Submit pull request
6. CI pipeline will validate changes

## 📄 License

This project is part of the E-commerce Copilot OS and follows the same licensing terms.