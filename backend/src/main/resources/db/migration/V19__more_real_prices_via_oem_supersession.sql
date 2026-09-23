-- Continuation of V18, at the user's request to keep digging on the ~36
-- products that didn't get a real price the first pass. Root cause for
-- most of them: this app's oem_part_no was sourced from the 2016 PDF
-- catalogue (FU150MF-Q/MFX-Q, 1st edition), but Suzuki PH's live site
-- reflects later running changes - the same PDF catalogue explicitly
-- documents this exact pattern ("12345-56781 (Parts No.): indicates the
-- parts number was changed... interchangeable"). Confirmed by fetching
-- each product's actual figure page directly and matching by description +
-- assembly context (not by guessing) - e.g. Front Wheel Bearing's PDF
-- number 08113-63017-000 doesn't exist on the site at all, but the site's
-- FRONT WHEEL figure lists exactly one bearing, desc "BEARING", at
-- 08113-6301B-000 (the same bearing, just re-suffixed) for a real price.
--
-- Both unit_price AND oem_part_no are updated here - now that the current,
-- live, orderable Suzuki PH part number is known, it replaces the stale
-- 2016 one rather than sitting alongside it as dead data.
--
-- 1 of the 22 rows (id 251) is a lower-confidence match: the site's rear
-- master cylinder figure lists only one generic ".O-RING" at
-- 69686-34200-000, a bigger jump than the single-character supersessions
-- seen elsewhere - included because it's the only O-ring on that exact
-- figure page, but worth a second look if ever in doubt.
--
-- Still NOT priced after this pass (left as placeholders, see
-- RELATED DOCUMENTS/Raider150FI_RealPrices_SuzukiPH.tsv and
-- ChardWorkz_Raider150FI_EnginesBodyParts_Summary.md for the running list):
-- some exist on the site but show a genuinely blank Price field there too
-- (Oil Filter Element, Rear Brake Hose, Cam Chain Tensioner Bolt,
-- Transmission Bearing 62020, Magneto Lead Clamp (B), Turn Signal Bulb,
-- the RK 428KLO Drive Chain assembly, Gear Shift Shaft Bearing); some
-- couldn't be found under any number on their figure page at all
-- (Transmission Bearing 62040-B/60027 - no equivalent single bearing
-- listed); and Front Disc Brake Pad Set has no discrete "pad set" line
-- on the site's front caliper figure at all (only a "PAD SHIM SET", a
-- different part - a shim isn't the friction pad).

UPDATE product AS p SET
    unit_price = v.real_price,
    oem_part_no = v.new_oem_part_no,
    updated_at = now()
FROM (VALUES
    (15,  1258.00, '59480-12K30-000'),  -- Front Brake Hose
    (157,  311.00, '11141-12K01-000'),  -- Cylinder Head Gasket (Genuine OEM)
    (162,  374.00, '11360-12K10-000'),  -- Engine Sprocket Cover
    (170,   79.00, '12931-25G20-000'),  -- Valve Spring Retainer
    (175,  177.00, '12782-12K01-000'),  -- Cam Chain Guide No.2
    (184,  432.00, '15201-09JA0-000'),  -- O-Ring, Fuel Pump (Mounting)
    (185,  145.00, '17431-12K10-000'),  -- O-Ring - Water Pump Case
    (187,  209.00, '08113-0608A-000'),  -- Water Pump Bearing
    (194,  296.00, '27511-25G20-000'),  -- Engine (Front) Sprocket (14T)
    (221,  703.00, '56500-23K00-000'),  -- Rear View Mirror RH
    (222,  703.00, '56600-23K00-000'),  -- Rear View Mirror LH
    (223,   60.00, '58620-12K01-000'),  -- Clutch Cable Guide
    (225,  231.00, '57110-12K01-000'),  -- Throttle Grip
    (226,  285.00, '57421-21D30-000'),  -- Front Brake Lever
    (227,  197.00, '57211-40J01-000'),  -- Handlebar Grip LH
    (228,  307.00, '57621-23FB0-000'),  -- Clutch Lever
    (232,  248.00, '08113-6301B-000'),  -- Front Wheel Bearing
    (233,   65.00, '09285-25008-000'),  -- Front Wheel Oil Seal 25x40x6mm
    (236,  878.00, '59300-13820-000'),  -- Front Caliper Piston Seal Set
    (241,  524.00, '08143-6201B-000'),  -- Rear Wheel Bearing (Inner)
    (244,  409.00, '08113-6203B-000'),  -- Rear Wheel Bearing (Outer)
    (251,   59.00, '69686-34200-000')   -- O-Ring - Rear Master Cylinder (lower confidence)
) AS v(product_id, real_price, new_oem_part_no)
WHERE p.id = v.product_id;
