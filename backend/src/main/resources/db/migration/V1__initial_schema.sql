CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE brand (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(80) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product (
    id               BIGSERIAL PRIMARY KEY,
    sku              VARCHAR(40)  NOT NULL UNIQUE,
    brand_id         BIGINT       NOT NULL REFERENCES brand(id),
    name             VARCHAR(150) NOT NULL,
    concentration    VARCHAR(20)  NOT NULL,   -- EDP | EDT | PARFUM | EDC | BODY_MIST
    size_ml          INT          NOT NULL,
    presentation     VARCHAR(20)  NOT NULL DEFAULT 'BOTTLE', -- BOTTLE | DECANT | SAMPLE
    gender           VARCHAR(20),             -- MASCULINE | FEMININE | UNISEX
    fragrance_family VARCHAR(40),
    cost_price       NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
    sale_price       NUMERIC(12,2) NOT NULL CHECK (sale_price >= 0),
    current_stock    INT           NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock        INT           NOT NULL DEFAULT 1,
    active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (brand_id, name, concentration, size_ml, presentation)
);

CREATE TABLE sale (
    id             BIGSERIAL PRIMARY KEY,
    sold_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    subtotal       NUMERIC(12,2) NOT NULL,
    discount       NUMERIC(12,2) NOT NULL DEFAULT 0,
    total          NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(20)   NOT NULL,  -- CASH | TRANSFER | CARD | MP
    status         VARCHAR(20)   NOT NULL DEFAULT 'COMPLETED', -- COMPLETED | CANCELLED
    notes          TEXT,
    created_by     BIGINT        NOT NULL REFERENCES app_user(id),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE sale_item (
    id         BIGSERIAL PRIMARY KEY,
    sale_id    BIGINT NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES product(id),
    quantity   INT           NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,   -- snapshot: no se lee de product
    unit_cost  NUMERIC(12,2) NOT NULL,   -- snapshot: permite calcular margen real
    subtotal   NUMERIC(12,2) NOT NULL
);

CREATE TABLE stock_movement (
    id            BIGSERIAL PRIMARY KEY,
    product_id    BIGINT      NOT NULL REFERENCES product(id),
    movement_type VARCHAR(20) NOT NULL,  -- PURCHASE | SALE | ADJUSTMENT | RETURN | LOSS
    quantity      INT         NOT NULL,  -- positivo entra, negativo sale
    stock_after   INT         NOT NULL,  -- foto del stock tras el movimiento
    unit_cost     NUMERIC(12,2),
    reference_id  BIGINT,                -- id de la sale que lo originó, si aplica
    reason        VARCHAR(200),
    created_by    BIGINT      NOT NULL REFERENCES app_user(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_brand    ON product(brand_id);
CREATE INDEX idx_product_active   ON product(active) WHERE active = TRUE;
CREATE INDEX idx_sale_sold_at     ON sale(sold_at DESC);
CREATE INDEX idx_sale_item_sale   ON sale_item(sale_id);
CREATE INDEX idx_movement_product ON stock_movement(product_id, created_at DESC);
