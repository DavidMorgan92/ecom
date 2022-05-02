CREATE TABLE "product" (
	"id" SERIAL PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"price_pennies" bigint NOT NULL,
	"stock_count" int NOT NULL
);

CREATE TABLE "account" (
	"id" SERIAL PRIMARY KEY,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text UNIQUE NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean NOT NULL DEFAULT false
);

CREATE TABLE "address" (
	"id" SERIAL PRIMARY KEY,
	"account_id" int,
	"house_name_number" text NOT NULL,
	"street_name" text NOT NULL,
	"town_city_name" text NOT NULL,
	"post_code" text NOT NULL
);

CREATE TABLE "order" (
	"id" SERIAL PRIMARY KEY,
	"account_id" int,
	"address_id" int,
	"created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "orders_products" (
	"order_id" int,
	"product_id" int,
	"count" int NOT NULL DEFAULT 1,
	PRIMARY KEY ("order_id", "product_id")
);

CREATE TABLE "carts_products" (
	"account_id" int,
	"product_id" int,
	"count" int NOT NULL DEFAULT 1,
	PRIMARY KEY ("account_id", "product_id")
);

ALTER TABLE "address" ADD FOREIGN KEY ("account_id") REFERENCES "account" ("id");

ALTER TABLE "order" ADD FOREIGN KEY ("account_id") REFERENCES "account" ("id");

ALTER TABLE "order" ADD FOREIGN KEY ("address_id") REFERENCES "address" ("id");

ALTER TABLE "orders_products" ADD FOREIGN KEY ("order_id") REFERENCES "order" ("id");

ALTER TABLE "orders_products" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id");

ALTER TABLE "carts_products" ADD FOREIGN KEY ("account_id") REFERENCES "account" ("id");

ALTER TABLE "carts_products" ADD FOREIGN KEY ("product_id") REFERENCES "product" ("id");


COMMENT ON COLUMN "product"."price_pennies" IS 'Check >= 0.';

COMMENT ON COLUMN "product"."stock_count" IS 'Check >= 0.';

COMMENT ON COLUMN "orders_products"."count" IS 'Number of product items ordered. Check > 0.';

COMMENT ON COLUMN "carts_products"."count" IS 'Number of product items ordered. Check > 0.';


ALTER TABLE product ADD CONSTRAINT price_pennies_gt_eq_0 CHECK (price_pennies >= 0);

ALTER TABLE product ADD CONSTRAINT stock_gt_eq_0 CHECK (stock_count >= 0);

ALTER TABLE orders_products ADD CONSTRAINT count_gt_0 CHECK (count > 0);

ALTER TABLE carts_products ADD CONSTRAINT count_gt_0 CHECK (count > 0);
