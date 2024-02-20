alter table "public"."matches" add column "state" text default 'incomplete'::text;

alter table "public"."matches" alter column "team1" drop not null;

alter table "public"."matches" alter column "team2" drop not null;


