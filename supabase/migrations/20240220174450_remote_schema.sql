alter table "public"."matches" drop constraint "public_matches_parent_id_fkey";

alter table "public"."matches" drop column "parent_id";

alter table "public"."matches" drop column "sibling_id";

alter table "public"."matches" add column "child_id" bigint;


