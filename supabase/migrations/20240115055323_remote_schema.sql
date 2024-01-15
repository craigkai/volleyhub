alter table "public"."events" drop constraint "events_owner_fkey";

alter table "public"."matches" drop constraint "matches_event_id_fkey";

alter table "public"."events" add constraint "events_owner_fkey" FOREIGN KEY (owner) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_owner_fkey";

alter table "public"."matches" add constraint "matches_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_event_id_fkey";


