-- Stock vs Order Quantity per SKU
SELECT 
    SKU,
    Product_type,
    Stock_levels,
    Order_quantities,
    (Stock_levels - Order_quantities) AS Stock_Gap,
    CASE 
        WHEN Stock_levels < Order_quantities THEN 'Understocked'
        WHEN Stock_levels > Order_quantities * 2 THEN 'Overstocked'
        ELSE 'Healthy'
    END AS Stock_Status
FROM supply_chain
ORDER BY Stock_Gap ASC;

-- Average stock health by product type
SELECT 
    Product_type,
    AVG(Stock_levels) AS Avg_Stock,
    AVG(Order_quantities) AS Avg_Order_Qty,
    SUM(CASE WHEN Stock_levels < Order_quantities THEN 1 ELSE 0 END) AS Understocked_Count
FROM supply_chain
GROUP BY Product_type;
