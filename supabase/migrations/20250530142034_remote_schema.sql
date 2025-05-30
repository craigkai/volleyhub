create table "public"."users" (
    "id" uuid not null,
    "name" text,
    "is_admin" boolean not null default false,
    "approved" boolean not null default false,
    "approved_at" timestamp without time zone,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Admin can read all"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = '55ae0904-16ac-4875-9cb8-6cfad1e50084'::uuid));


create policy "Admin can update non-admin users"
on "public"."users"
as permissive
for update
to public
using (((auth.uid() = '55ae0904-16ac-4875-9cb8-6cfad1e50084'::uuid) AND (NOT is_admin)));


create policy "User can read own data"
on "public"."users"
as permissive
for select
to public
using ((id = auth.uid()));



