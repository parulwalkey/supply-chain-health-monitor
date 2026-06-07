
-- Defect rate, lead time deviation, inspection pass rate per supplier
SELECT 
    Supplier_name,
    COUNT(*) AS Total_SKUs,
    ROUND(AVG(Defect_rates), 2) AS Avg_Defect_Rate_Pct,
    AVG(Lead_Time_Deviation) AS Avg_Lead_Time_Deviation,
    SUM(Inspection_Pass_Flag) AS Inspections_Passed,
    ROUND(SUM(Inspection_Pass_Flag) * 100.0 / COUNT(*), 1) AS Pass_Rate_Pct,
    SUM(CASE WHEN Lead_Time_Flag = 'Above Avg' THEN 1 ELSE 0 END) AS Delayed_Shipments
FROM supply_chain
GROUP BY Supplier_name
ORDER BY Avg_Defect_Rate_Pct DESC;

-- Defect risk breakdown per supplier
SELECT 
    Supplier_name,
    Defect_Risk_Category,
    COUNT(*) AS SKU_Count
FROM supply_chain
GROUP BY Supplier_name, Defect_Risk_Category
ORDER BY Supplier_name;
