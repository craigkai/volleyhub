alter table "public"."matches" drop column "status";

create policy "Enable insert for authenticated users only"
on "public"."teams"
as permissive
for insert
to authenticated
with check (true);



