-- Carrier comparison: cost, speed, volume
SELECT 
    Shipping_carriers,
    Transportation_modes,
    COUNT(*) AS Shipments,
    ROUND(AVG(Shipping_costs), 2) AS Avg_Shipping_Cost,
    ROUND(AVG(Shipping_times), 1) AS Avg_Shipping_Days,
    ROUND(AVG(Costs), 2) AS Avg_Total_Cost
FROM supply_chain
GROUP BY Shipping_carriers, Transportation_modes
ORDER BY Avg_Shipping_Cost ASC;

-- Route efficiency
SELECT 
    Routes,
    Transportation_modes,
    COUNT(*) AS Usage_Count,
    ROUND(AVG(Shipping_costs), 2) AS Avg_Cost,
    ROUND(AVG(Shipping_times), 1) AS Avg_Days
FROM supply_chain
GROUP BY Routes, Transportation_modes
ORDER BY Avg_Cost ASC;
