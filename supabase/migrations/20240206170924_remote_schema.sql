alter table "public"."matches" add column "type" text not null default 'pool'::text;

alter table "public"."matches" alter column "ref" set data type bigint using "ref"::bigint;

alter table "public"."matches" add constraint "matches_ref_fkey" FOREIGN KEY (ref) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_ref_fkey";


