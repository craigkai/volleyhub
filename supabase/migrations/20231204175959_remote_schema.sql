alter table "public"."matches" add column "court" bigint not null default '0'::bigint;

alter table "public"."matches" add column "round" bigint not null default '0'::bigint;


