alter table "public"."matches" add column "sibling_id" bigint;

alter table "public"."matches" add constraint "public_matches_id_fkey" FOREIGN KEY (id) REFERENCES matches(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."matches" validate constraint "public_matches_id_fkey";


