-- ChardWorkz core schema — Phase 1 (Core Sales & Inventory).
-- Source of truth: docs/project-initiation-draft.md (v0.4) §2 Reference Schema Sketch,
-- resolved against the business owner's 2026-09-15 answers to §5 Q1-Q12.
--
-- Deliberately NOT built here (resolved out of scope for this phase):
--   customer, order, order_line   -- Q1: staff-only, no storefront this phase
--   job, job_status_event, technician -- Q2: powder-coating module skipped this phase
-- Both remain documented in the roadmap for a later milestone, not deleted.

CREATE TABLE branch (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT now()
);

-- Named `account`, not `user` - `user` is a reserved word in PostgreSQL.
CREATE TABLE account (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id     BIGINT       NOT NULL REFERENCES branch (id),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')),
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT now()
);

CREATE TABLE product (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku         VARCHAR(50),  -- reserved from Phase 0, unused until barcode scanning (deferred, see Out-of-Scope table)
    barcode     VARCHAR(50),  -- reserved from Phase 0, unused until barcode scanning (deferred)
    name        VARCHAR(150)  NOT NULL,
    description TEXT,
    brand_tag   VARCHAR(100), -- THESIS1's tag/brand search requirement
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    is_active   BOOLEAN       NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE   NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_name ON product (name);
CREATE INDEX idx_product_brand_tag ON product (brand_tag);

-- Deliberately separate from `product`: quantity is per-branch, product
-- identity is not. THESIS1 kept quantity on the product row, which made
-- multi-branch (main + Masinag) unrepresentable - see Q5, resolved
-- 2026-09-15: one shared backend/DB, branch_id-scoped.
CREATE TABLE stock_level (
    id                BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id        BIGINT      NOT NULL REFERENCES product (id),
    branch_id         BIGINT      NOT NULL REFERENCES branch (id),
    quantity          INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_threshold INTEGER     NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (product_id, branch_id)
);

CREATE TABLE supplier (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    contact_info VARCHAR(255),
    created_at   TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT now()
);

CREATE TABLE stock_in (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id  BIGINT      NOT NULL REFERENCES supplier (id),
    branch_id    BIGINT      NOT NULL REFERENCES branch (id),
    received_by  BIGINT      NOT NULL REFERENCES account (id),
    reference_no VARCHAR(50),
    received_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE stock_in_line (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_in_id BIGINT        NOT NULL REFERENCES stock_in (id) ON DELETE CASCADE,
    product_id  BIGINT        NOT NULL REFERENCES product (id),
    quantity    INTEGER       NOT NULL CHECK (quantity > 0),
    unit_cost   NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0)
);

-- `id` is a client-generated UUID, not server-assigned: the Angular Register
-- screen generates it at the moment of sale so an offline-queued sale can
-- sync idempotently on reconnect (Q12, resolved 2026-09-15 - local queue +
-- sync-on-reconnect, breaking from the document's stated paper-fallback
-- default). Re-inserting the same id on a retried sync is a no-op via
-- `INSERT ... ON CONFLICT (id) DO NOTHING`, not a duplicate sale.
--
-- No `voided`/`status` column: Q8 (resolved 2026-09-15) is void-before-
-- finalize only - a discarded in-progress cart never reaches this table at
-- all, so there is nothing here to mark voided. Post-finalization sale
-- reversal was explicitly flagged as a later-phase consideration
-- (backlog.md "Deferred, not rejected"), not built now - add a status
-- column and reversal logic then, not preemptively.
CREATE TABLE sale (
    id                UUID PRIMARY KEY,
    branch_id         BIGINT        NOT NULL REFERENCES branch (id),
    employee_id       BIGINT        NOT NULL REFERENCES account (id),
    payment_method    VARCHAR(20)   NOT NULL CHECK (payment_method IN ('CASH', 'GCASH', 'EWALLET_OTHER')),
    payment_reference VARCHAR(100),
    subtotal          NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    total             NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    sold_at           TIMESTAMP WITH TIME ZONE   NOT NULL, -- when the sale actually happened at the register (client clock) - may predate synced_at
    synced_at         TIMESTAMP WITH TIME ZONE   NOT NULL DEFAULT now() -- when this row was written server-side
);
CREATE INDEX idx_sale_branch_sold_at ON sale (branch_id, sold_at);
CREATE INDEX idx_sale_employee ON sale (employee_id);

CREATE TABLE sale_line (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id    UUID          NOT NULL REFERENCES sale (id) ON DELETE CASCADE,
    product_id BIGINT        NOT NULL REFERENCES product (id),
    quantity   INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX idx_sale_line_sale ON sale_line (sale_id);
CREATE INDEX idx_sale_line_product ON sale_line (product_id);

-- Unconditional from Phase 0 as of 2026-09-15 (Q7 resolved: yes).
CREATE TABLE audit_event (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    BIGINT      NOT NULL REFERENCES account (id),
    entity_name VARCHAR(50) NOT NULL,
    entity_id   VARCHAR(50) NOT NULL, -- text, not a FK: one audit log spans entities with different PK types (bigint vs. sale's uuid)
    field_name  VARCHAR(100) NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_event_entity ON audit_event (entity_name, entity_id);
