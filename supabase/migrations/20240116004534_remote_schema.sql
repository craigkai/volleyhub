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



