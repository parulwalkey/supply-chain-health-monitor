-- Defect risk by product type and supplier
SELECT 
    Product_type,
    Supplier_name,
    Defect_Risk_Category,
    ROUND(AVG(Defect_rates), 3) AS Avg_Defect_Pct,
    COUNT(*) AS SKU_Count,
    SUM(Inspection_Pass_Flag) AS Passed,
    SUM(CASE WHEN Inspection_results = 'Fail' THEN 1 ELSE 0 END) AS Failed,
    SUM(CASE WHEN Inspection_results = 'Pending' THEN 1 ELSE 0 END) AS Pending
FROM supply_chain
GROUP BY Product_type, Supplier_name, Defect_Risk_Category
ORDER BY Avg_Defect_Pct DESC;

-- High risk SKUs — needs immediate attention
SELECT 
    SKU,
    Product_type,
    Supplier_name,
    Defect_Risk_Category,
    ROUND(Defect_rates, 3) AS Defect_Pct,
    Inspection_results,
    Lead_Time_Flag
FROM supply_chain
WHERE Defect_Risk_Category = 'High Risk'
ORDER BY Defect_rates DESC;