alter table "public"."events" add column "refs" text default '''''provided''''::text'::text;

alter table "public"."matches" add column "ref" text;


