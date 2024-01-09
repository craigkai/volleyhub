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



