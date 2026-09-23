-- Replaces AI-estimated placeholder prices with REAL retail prices scraped
-- from Suzuki Motorcycles Philippines' own official genuine-parts price
-- lookup (mc.suzuki.com.ph/figure-part/... - the same FIG numbering as
-- RELATED DOCUMENTS/Suzuki-Raider-150-FI Engines and body parts.pdf), at
-- the user's request after they linked one example figure page and asked
-- to check/get the real prices for the whole catalogue.
--
-- Matched by product id (not name) - the safest join key, since id is
-- unambiguous and this session has already hit one name-collision bug
-- this same week (DEC-072). 61 of the site's figure pages were fetched;
-- 73 of the 109 OEM-part-numbered products in this catalog had a clean,
-- non-empty price on one of those pages and are updated here.
--
-- The remaining ~36 are deliberately NOT touched in this migration:
-- some part numbers from the 2016 PDF catalogue don't appear at all on the
-- fetched pages (the site may have since superseded/renumbered them - the
-- catalogue itself documents this exact kind of supersession), and a
-- handful exist on the site but with no price listed at all (e.g.
-- 16510-45H10-000 Oil Filter, 69480-12K00-000 Rear Brake Hose - both show
-- an empty Price field on their own figure page). Full match/no-match
-- detail is in RELATED DOCUMENTS/Raider150FI_RealPrices_SuzukiPH.tsv.
-- These placeholder prices stay flagged as estimates until a real number
-- is found some other way.

UPDATE product AS p SET
    unit_price = v.real_price,
    updated_at = now()
FROM (VALUES
    (8, 292.00),
    (10, 82.00),
    (18, 427.00),
    (21, 227.00),
    (22, 227.00),
    (23, 395.00),
    (24, 459.00),
    (155, 269.00),
    (156, 56.00),
    (158, 36.00),
    (159, 54.00),
    (160, 70.00),
    (161, 24.00),
    (163, 662.00),
    (164, 686.00),
    (165, 200.00),
    (166, 282.00),
    (167, 340.00),
    (168, 279.00),
    (169, 414.00),
    (171, 50.00),
    (172, 92.00),
    (173, 961.00),
    (174, 138.00),
    (176, 460.00),
    (178, 141.00),
    (179, 435.00),
    (181, 52.00),
    (182, 382.00),
    (183, 79.00),
    (186, 655.00),
    (188, 336.00),
    (189, 185.00),
    (190, 91.00),
    (193, 28.00),
    (195, 68.00),
    (198, 71.00),
    (199, 60.00),
    (200, 75.00),
    (201, 71.00),
    (202, 23.00),
    (203, 225.00),
    (204, 36.00),
    (206, 352.00),
    (207, 71.00),
    (208, 152.00),
    (212, 44.00),
    (213, 871.00),
    (214, 567.00),
    (215, 549.00),
    (216, 871.00),
    (217, 504.00),
    (218, 532.00),
    (219, 105.00),
    (220, 105.00),
    (224, 67.00),
    (229, 56.00),
    (231, 129.00),
    (234, 3172.00),
    (235, 4035.00),
    (237, 52.00),
    (238, 131.00),
    (239, 277.00),
    (240, 1259.00),
    (242, 117.00),
    (243, 775.00),
    (245, 151.00),
    (246, 810.00),
    (247, 264.00),
    (248, 232.00),
    (249, 3808.00),
    (250, 661.00),
    (252, 59.00)
) AS v(product_id, real_price)
WHERE p.id = v.product_id;
