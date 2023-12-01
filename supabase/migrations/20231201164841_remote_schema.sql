alter table "public"."events" drop column "teams";

alter table "public"."teams" drop column "division";

alter table "public"."teams" add column "event_id" bigint;

alter table "public"."teams" add constraint "teams_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."teams" validate constraint "teams_event_id_fkey";


