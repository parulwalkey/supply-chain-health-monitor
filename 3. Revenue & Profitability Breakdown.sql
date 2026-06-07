-- Revenue by product type and location
SELECT 
    Product_type,
    Location,
    COUNT(*) AS SKU_Count,
    ROUND(SUM(Revenue_generated), 2) AS Total_Revenue,
    ROUND(AVG(Profit_Margin_Pct), 2) AS Avg_Profit_Margin,
    ROUND(AVG(Price), 2) AS Avg_Price
FROM supply_chain
GROUP BY Product_type, Location
ORDER BY Total_Revenue DESC;

-- Revenue tier distribution
SELECT 
    Revenue_Tier,
    Product_type,
    COUNT(*) AS SKU_Count,
    ROUND(SUM(Revenue_generated), 2) AS Total_Revenue,
    ROUND(AVG(Profit_Margin_Pct), 2) AS Avg_Margin
FROM supply_chain
GROUP BY Revenue_Tier, Product_type
ORDER BY Revenue_Tier, Total_Revenue DESC;