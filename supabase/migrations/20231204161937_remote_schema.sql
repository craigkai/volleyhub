drop policy "Enable update for users based on email" on "public"."events";

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



