-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text not null,
  role         text not null check (role in ('clinician', 'admin', 'supervisor')),
  phone        text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'clinician')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Patients (PHI — restrict access)
create table public.patients (
  id               uuid primary key default uuid_generate_v4(),
  full_name        text not null,
  date_of_birth    date not null,
  address          text not null,
  latitude         double precision not null,
  longitude        double precision not null,
  phone            text not null,
  clinical_notes   text,
  insurance_id     text,
  imported_from    text,   -- source system reference
  created_at       timestamptz not null default now()
);

-- Appointments
create table public.appointments (
  id                         uuid primary key default uuid_generate_v4(),
  patient_id                 uuid not null references public.patients(id),
  clinician_id               uuid not null references public.profiles(id),
  scheduled_at               timestamptz not null,
  estimated_duration_minutes int not null default 60,
  status                     text not null default 'scheduled'
                               check (status in ('scheduled','en_route','on_site','completed','cancelled')),
  check_in_at                timestamptz,
  check_out_at               timestamptz,
  address                    text not null,
  latitude                   double precision not null,
  longitude                  double precision not null,
  notes                      text,
  imported_from              text,
  created_at                 timestamptz not null default now()
);

create index appointments_clinician_scheduled on public.appointments(clinician_id, scheduled_at);
create index appointments_scheduled_at on public.appointments(scheduled_at);

-- Real-time clinician locations (one row per clinician, upserted)
create table public.clinician_locations (
  clinician_id   uuid primary key references public.profiles(id) on delete cascade,
  latitude       double precision not null,
  longitude      double precision not null,
  heading        double precision,
  speed          double precision,
  status         text not null default 'offline'
                   check (status in ('available','en_route','on_site','offline')),
  updated_at     timestamptz not null default now()
);

-- Check-ins (immutable audit log of arrivals/departures)
create table public.check_ins (
  id                    uuid primary key default uuid_generate_v4(),
  appointment_id        uuid not null references public.appointments(id),
  clinician_id          uuid not null references public.profiles(id),
  checked_in_at         timestamptz not null default now(),
  checked_out_at        timestamptz,
  check_in_latitude     double precision not null,
  check_in_longitude    double precision not null,
  check_out_latitude    double precision,
  check_out_longitude   double precision
);

-- Audit log (HIPAA: track all PHI access)
create table public.audit_log (
  id          bigserial primary key,
  user_id     uuid references auth.users(id),
  action      text not null,
  table_name  text not null,
  record_id   text,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.patients          enable row level security;
alter table public.appointments      enable row level security;
alter table public.clinician_locations enable row level security;
alter table public.check_ins         enable row level security;
alter table public.audit_log         enable row level security;

-- Helper: get current user's role
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles: everyone can read their own; admins/supervisors see all
create policy "profiles_read_own"    on public.profiles for select using (id = auth.uid());
create policy "profiles_read_all"    on public.profiles for select
  using (public.current_user_role() in ('admin','supervisor'));

-- Patients: clinicians see patients on their appointments; admins/supervisors see all
create policy "patients_clinician"   on public.patients for select
  using (
    exists (
      select 1 from public.appointments a
      where a.patient_id = id and a.clinician_id = auth.uid()
    )
  );
create policy "patients_admin"       on public.patients for all
  using (public.current_user_role() in ('admin','supervisor'));

-- Appointments: clinicians see own; admins/supervisors see all
create policy "appts_clinician"      on public.appointments for select
  using (clinician_id = auth.uid());
create policy "appts_clinician_upd"  on public.appointments for update
  using (clinician_id = auth.uid());
create policy "appts_admin"          on public.appointments for all
  using (public.current_user_role() in ('admin','supervisor'));

-- Clinician locations: clinicians upsert own; admins/supervisors see all
create policy "loc_clinician_upsert" on public.clinician_locations for all
  using (clinician_id = auth.uid());
create policy "loc_admin_read"       on public.clinician_locations for select
  using (public.current_user_role() in ('admin','supervisor'));

-- Check-ins: clinicians insert/see own; admins/supervisors see all
create policy "checkin_clinician"    on public.check_ins for all
  using (clinician_id = auth.uid());
create policy "checkin_admin"        on public.check_ins for select
  using (public.current_user_role() in ('admin','supervisor'));

-- Audit log: admins/supervisors only
create policy "audit_admin"          on public.audit_log for select
  using (public.current_user_role() in ('admin','supervisor'));

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on clinician_locations so admin map updates live
alter publication supabase_realtime add table public.clinician_locations;
alter publication supabase_realtime add table public.appointments;
