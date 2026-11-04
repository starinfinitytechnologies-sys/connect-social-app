-- Connect Local: marketplace core tables.
-- Public profile data is separated from private contact and billing data so that
-- row level security can expose only what each audience is allowed to see.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null default '',
  display_name text,
  avatar_url text,
  city text,
  state text,
  area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 80
  )
);

create index profiles_role_idx on public.profiles (role);

create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  phone_verified boolean not null default false,
  country_code text not null default 'IN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id text primary key,
  name text not null,
  description text,
  icon text,
  color text,
  soft_color text,
  regulated boolean not null default false,
  disclaimer text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subcategories (
  id text primary key,
  category_id text not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subcategories_category_idx on public.subcategories (category_id);

create table public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  category_id text not null references public.categories (id),
  business_name text,
  headline text,
  profession text not null,
  bio text,
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  languages text[] not null default '{}',
  service_radius_km numeric(6, 2) not null default 10 check (service_radius_km > 0),
  availability_status public.availability_status not null default 'available_this_week',
  working_hours jsonb not null default '{}'::jsonb,
  next_slot text,
  verification_status public.verification_status not null default 'unverified',
  identity_verified boolean not null default false,
  qualification_verified boolean not null default false,
  rating_average numeric(3, 2) not null default 0 check (rating_average between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  completed_enquiries integer not null default 0 check (completed_enquiries >= 0),
  response_rate numeric(5, 2) not null default 0 check (response_rate between 0 and 100),
  response_time text,
  is_sponsored boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_profiles_headline_length check (
    headline is null or char_length(headline) <= 160
  ),
  constraint professional_profiles_bio_length check (
    bio is null or char_length(bio) <= 4000
  )
);

create index professional_profiles_category_idx
  on public.professional_profiles (category_id);
create index professional_profiles_active_idx
  on public.professional_profiles (is_active);
create index professional_profiles_rating_idx
  on public.professional_profiles (rating_average desc);
create index professional_profiles_languages_idx
  on public.professional_profiles using gin (languages);

create table public.professional_subcategories (
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  subcategory_id text not null references public.subcategories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (professional_id, subcategory_id)
);

create index professional_subcategories_subcategory_idx
  on public.professional_subcategories (subcategory_id);

create table public.professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  name text not null,
  description text,
  price_inr integer not null default 0 check (price_inr >= 0),
  price_type text not null default 'from'
    check (price_type in ('from', 'fixed', 'visit', 'monthly')),
  duration text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_services_name_length check (char_length(name) <= 160)
);

create index professional_services_professional_idx
  on public.professional_services (professional_id);

create table public.professional_service_areas (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  label text not null,
  city text,
  state text,
  pincode text,
  latitude_approx numeric(9, 6),
  longitude_approx numeric(9, 6),
  radius_km numeric(6, 2) not null default 10 check (radius_km > 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index professional_service_areas_professional_idx
  on public.professional_service_areas (professional_id);
create index professional_service_areas_city_idx
  on public.professional_service_areas (city);

create table public.professional_contact_channels (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  channel text not null check (
    channel in (
      'phone',
      'email',
      'whatsapp',
      'instagram',
      'linkedin',
      'facebook',
      'website'
    )
  ),
  value text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, channel)
);

create index professional_contact_channels_professional_idx
  on public.professional_contact_channels (professional_id);

create table public.professional_education (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  degree text not null,
  institute text not null,
  year integer,
  is_verified boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index professional_education_professional_idx
  on public.professional_education (professional_id);

create table public.professional_certifications (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  title text not null,
  issuer text not null,
  year integer,
  document_url text,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index professional_certifications_professional_idx
  on public.professional_certifications (professional_id);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  category_label text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index portfolio_items_professional_idx
  on public.portfolio_items (professional_id);

create table public.saved_profiles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, professional_id)
);

create index saved_profiles_professional_idx
  on public.saved_profiles (professional_id);

create table public.blocked_users (
  user_id uuid not null references public.profiles (id) on delete cascade,
  blocked_user_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_user_id),
  constraint blocked_users_no_self check (user_id <> blocked_user_id)
);

create index blocked_users_blocked_idx on public.blocked_users (blocked_user_id);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status public.connection_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint connections_no_self check (requester_id <> recipient_id),
  constraint connections_message_length check (
    message is null or char_length(message) <= 500
  )
);

create unique index connections_unique_active_pair_idx
  on public.connections (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  )
  where status in ('pending', 'accepted');

create index connections_requester_idx on public.connections (requester_id);
create index connections_recipient_idx on public.connections (recipient_id);
create index connections_status_idx on public.connections (status);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  service_id uuid references public.professional_services (id) on delete set null,
  message text not null,
  status public.enquiry_status not null default 'recorded',
  responded_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enquiries_message_length check (
    char_length(message) between 10 and 2000
  )
);

create index enquiries_customer_idx on public.enquiries (customer_id, created_at desc);
create index enquiries_professional_idx
  on public.enquiries (professional_id, created_at desc);
create index enquiries_status_idx on public.enquiries (status);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.connections (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create index conversations_last_message_idx
  on public.conversations (last_message_at desc nulls last);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  message_type public.message_type not null default 'text',
  body text,
  attachment_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_body_required check (
    message_type <> 'text' or (body is not null and char_length(body) between 1 and 4000)
  )
);

create index messages_conversation_idx
  on public.messages (conversation_id, created_at);
create index messages_sender_idx on public.messages (sender_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.enquiries (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  verified_interaction boolean not null default true,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_body_length check (
    body is null or char_length(body) <= 2000
  )
);

create index reviews_professional_idx
  on public.reviews (professional_id, created_at desc);
create index reviews_customer_idx on public.reviews (customer_id);
create index reviews_status_idx on public.reviews (status);

create table public.review_responses (
  review_id uuid primary key references public.reviews (id) on delete cascade,
  professional_id uuid not null references public.professional_profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_responses_body_length check (
    char_length(body) between 1 and 2000
  )
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (
    target_type in ('profile', 'enquiry', 'message', 'review')
  ),
  target_id uuid not null,
  reason text not null,
  details text,
  status public.moderation_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reports_reason_length check (char_length(reason) between 3 and 120),
  constraint reports_details_length check (
    details is null or char_length(details) <= 2000
  )
);

create index reports_reporter_idx on public.reports (reporter_id);
create index reports_status_idx on public.reports (status, created_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
