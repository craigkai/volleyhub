drop policy "Enable delete for users based on user_id" on "public"."events";

drop policy "Enable delete for users based on event owner" on "public"."teams";

create policy "Enable delete for users based on user_id"
on "public"."events"
as permissive
for delete
to authenticated
using ((auth.uid() = owner));


create policy "Enable delete for users based on event owner"
on "public"."teams"
as permissive
for delete
to authenticated
using ((auth.uid() IN ( SELECT events.owner
   FROM events
  WHERE (events.id = teams.event_id))));



