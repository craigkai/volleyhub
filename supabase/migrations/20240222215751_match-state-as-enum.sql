create type "public"."MatchState" as enum ('COMPLETE', 'INCOMPLETE');

create type "public"."StageType" as enum ('ROUND_ROBIN', 'SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION');

drop policy "Enable Edit Based On Owner" on "public"."events";

drop policy "Enable edit for event owner only" on "public"."matches";

drop policy "Enable edit for event owner" on "public"."teams";

drop policy "Enable read access for all users" on "public"."teams";

alter table "public"."matches" drop constraint "public_matches_child_id_fkey";

alter table "public"."matches" drop constraint "public_matches_id_fkey";

alter table "public"."matches" drop constraint "matches_event_id_fkey";

alter table "public"."matches" drop constraint "matches_ref_fkey";

alter table "public"."matches" drop constraint "matches_team1_fkey";

alter table "public"."matches" drop constraint "matches_team2_fkey";

alter table "public"."matches" alter column "state" set default 'INCOMPLETE'::"MatchState";

alter table "public"."matches" alter column "state" set not null;

alter table "public"."matches" alter column "state" set data type "MatchState" using "state"::"MatchState";

alter table "public"."matches" add constraint "matches_child_id_fkey" FOREIGN KEY (child_id) REFERENCES matches(id) not valid;

alter table "public"."matches" validate constraint "matches_child_id_fkey";

alter table "public"."matches" add constraint "matches_id_fkey" FOREIGN KEY (id) REFERENCES matches(id) not valid;

alter table "public"."matches" validate constraint "matches_id_fkey";

alter table "public"."matches" add constraint "matches_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) not valid;

alter table "public"."matches" validate constraint "matches_event_id_fkey";

alter table "public"."matches" add constraint "matches_ref_fkey" FOREIGN KEY (ref) REFERENCES teams(id) not valid;

alter table "public"."matches" validate constraint "matches_ref_fkey";

alter table "public"."matches" add constraint "matches_team1_fkey" FOREIGN KEY (team1) REFERENCES teams(id) not valid;

alter table "public"."matches" validate constraint "matches_team1_fkey";

alter table "public"."matches" add constraint "matches_team2_fkey" FOREIGN KEY (team2) REFERENCES teams(id) not valid;

alter table "public"."matches" validate constraint "matches_team2_fkey";

create policy "Enable delete for users based on user_id"
on "public"."events"
as permissive
for delete
to authenticated
using ((auth.uid() = owner));


create policy "Enable insert for authenticated users only"
on "public"."events"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable update for users based on event owner id"
on "public"."events"
as permissive
for all
to authenticated
using ((auth.uid() = owner))
with check ((auth.uid() = owner));


create policy "Enable delete for matches where auth'd user is owner of event"
on "public"."matches"
as permissive
for delete
to authenticated
using ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = matches.event_id))));


create policy "Enable insert for authenticated users only"
on "public"."matches"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable update for users based on email"
on "public"."matches"
as permissive
for update
to authenticated
using ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = matches.event_id))))
with check ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = matches.event_id))));


create policy "Enable delete for users based on event owner"
on "public"."teams"
as permissive
for delete
to authenticated
using ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = teams.event_id))));


create policy "Enable insert for authenticated users only where event owner"
on "public"."teams"
as permissive
for insert
to authenticated
with check ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = teams.event_id))));


create policy "Enable read access for all users for active teams"
on "public"."teams"
as permissive
for select
to public
using ((state = 'active'::text));


create policy "Enable update for users based on email"
on "public"."teams"
as permissive
for update
to authenticated
using ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = teams.event_id))))
with check ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = teams.event_id))));



