alter table "public"."matches" drop constraint "matches_child_id_fkey";

alter table "public"."matches" drop constraint "matches_event_id_fkey";

alter table "public"."matches" drop constraint "matches_id_fkey";

alter table "public"."matches" drop constraint "matches_ref_fkey";

alter table "public"."matches" drop constraint "matches_team1_fkey";

alter table "public"."matches" drop constraint "matches_team2_fkey";

alter table "public"."matches" add constraint "public_matches_child_id_fkey" FOREIGN KEY (child_id) REFERENCES matches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "public_matches_child_id_fkey";

alter table "public"."matches" add constraint "public_matches_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "public_matches_event_id_fkey";

alter table "public"."matches" add constraint "public_matches_id_fkey" FOREIGN KEY (id) REFERENCES matches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "public_matches_id_fkey";

alter table "public"."matches" add constraint "public_matches_ref_fkey" FOREIGN KEY (ref) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "public_matches_ref_fkey";

alter table "public"."matches" add constraint "public_matches_team1_fkey" FOREIGN KEY (team1) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "public_matches_team1_fkey";

alter table "public"."matches" add constraint "public_matches_team2_fkey" FOREIGN KEY (team2) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "public_matches_team2_fkey";


