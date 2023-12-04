drop policy "Enable insert for authenticated users only" on "public"."teams";

create policy "Enable delete for users based on user_id"
on "public"."events"
as permissive
for delete
to public
using ((auth.uid() = owner));


create policy "Enable delete for users based on event owner"
on "public"."teams"
as permissive
for delete
to public
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



