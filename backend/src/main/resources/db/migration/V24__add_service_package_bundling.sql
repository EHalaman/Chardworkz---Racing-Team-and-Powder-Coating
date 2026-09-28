-- Service-package bundling engine (Register can sell a package like "PCC SET"
-- as a set of default components a cashier can include/exclude per customer).
--
-- The two packages seeded below are DELIBERATE DUMMY/PLACEHOLDER DATA, not a
-- real business mapping - the business owner explicitly confirmed (2026-09-28)
-- that the real component makeup of PCC SET is "the client's assignment to
-- give", i.e. not yet known, and asked to build the engine now with dummy
-- data to be corrected later. Every component below is still a REAL row from
-- the live product table (verified via psql, not guessed) so the seed is at
-- least structurally valid - only the "does PCC SET really contain these
-- specific parts" business claim is a placeholder, same convention as V4/V22's
-- AI-estimated prices. Do not treat this package breakdown as real until the
-- owner corrects it via the Products/Packages admin UI.
--
-- Deliberately does not touch or duplicate the existing standalone 'PCC SET'
-- SERVICES product (₱13,000 flat, from V22) - these packages are named
-- distinctly ("... PACKAGE (CARB)"/"(FI)") so a cashier can't confuse a
-- flat-price PCC SET line sale with this new bundle-selection flow.

CREATE TABLE service_package (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One row per default component. is_required = true means the Register
-- customization drawer can never let the cashier uncheck it (the labor line);
-- false means it's excludable when the customer supplies their own part.
CREATE TABLE package_item (
    id               BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id       BIGINT  NOT NULL REFERENCES service_package (id) ON DELETE CASCADE,
    product_id       BIGINT  NOT NULL REFERENCES product (id),
    is_required      BOOLEAN NOT NULL DEFAULT false,
    default_quantity INTEGER NOT NULL DEFAULT 1 CHECK (default_quantity > 0),
    UNIQUE (package_id, product_id)
);

-- Free-text note on the sale header - used here to record what a cashier
-- excluded from a package ("Customer provided own CDI (-₱5,500.00)"), but
-- generic enough for any other counter note later.
ALTER TABLE sale ADD COLUMN remarks TEXT;

-- Nullable: only set when a line came from a package selection, so the
-- printable receipt's Customer tab can group package-originated lines under
-- the package name instead of listing each component like a normal sale. A
-- line added as a plain individual product keeps this NULL.
ALTER TABLE sale_line ADD COLUMN package_id BIGINT REFERENCES service_package (id);

INSERT INTO service_package (name, description) VALUES
    ('PCC SET PACKAGE (CARB)', 'DUMMY/PLACEHOLDER bundle seeded 2026-09-28 - real component makeup not yet confirmed by the business owner. Built from real product rows for engine testing only; correct once the owner provides the real breakdown.'),
    ('PCC SET PACKAGE (FI)', 'DUMMY/PLACEHOLDER bundle seeded 2026-09-28 - real component makeup not yet confirmed by the business owner. Built from real product rows for engine testing only; correct once the owner provides the real breakdown.');

INSERT INTO package_item (package_id, product_id, is_required, default_quantity)
SELECT sp.id, p.id, item.required, 1
FROM (VALUES
    ('PCC SET PACKAGE (CARB)', 'PortHicom', true),
    ('PCC SET PACKAGE (CARB)', 'Koso Evo 30mm', false),
    ('PCC SET PACKAGE (CARB)', 'Jettings', false),
    ('PCC SET PACKAGE (FI)', 'PortHicom', true),
    ('PCC SET PACKAGE (FI)', 'Pitsbike Racing ECU', false),
    ('PCC SET PACKAGE (FI)', 'Pitsbike 34mm TB', false),
    ('PCC SET PACKAGE (FI)', 'Velocity Throttle Body FI', false)
) AS item(package_name, product_name, required)
JOIN service_package sp ON sp.name = item.package_name
JOIN product p ON p.name = item.product_name;
