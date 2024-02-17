revoke delete on table "public"."brackets" from "anon";

revoke insert on table "public"."brackets" from "anon";

revoke references on table "public"."brackets" from "anon";

revoke select on table "public"."brackets" from "anon";

revoke trigger on table "public"."brackets" from "anon";

revoke truncate on table "public"."brackets" from "anon";

revoke update on table "public"."brackets" from "anon";

revoke delete on table "public"."brackets" from "authenticated";

revoke insert on table "public"."brackets" from "authenticated";

revoke references on table "public"."brackets" from "authenticated";

revoke select on table "public"."brackets" from "authenticated";

revoke trigger on table "public"."brackets" from "authenticated";

revoke truncate on table "public"."brackets" from "authenticated";

revoke update on table "public"."brackets" from "authenticated";

revoke delete on table "public"."brackets" from "service_role";

revoke insert on table "public"."brackets" from "service_role";

revoke references on table "public"."brackets" from "service_role";

revoke select on table "public"."brackets" from "service_role";

revoke trigger on table "public"."brackets" from "service_role";

revoke truncate on table "public"."brackets" from "service_role";

revoke update on table "public"."brackets" from "service_role";

alter table "public"."brackets" drop constraint "public_brackets_team1_fkey";

alter table "public"."brackets" drop constraint "public_brackets_team2_fkey";

alter table "public"."brackets" drop constraint "brackets_pkey";

drop index if exists "public"."brackets_pkey";

drop table "public"."brackets";

alter table "public"."matches" add column "parent_id" bigint;

alter table "public"."matches" add constraint "public_matches_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES matches(id) ON DELETE SET NULL not valid;

alter table "public"."matches" validate constraint "public_matches_parent_id_fkey";


