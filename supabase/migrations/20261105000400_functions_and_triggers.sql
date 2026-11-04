-- Connect Local: shared functions and guard triggers.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_platform_context()
returns boolean
language sql
stable
as $$
  select auth.role() = 'service_role'
    or session_user in ('postgres', 'supabase_admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_professional_owner(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.professional_profiles
    where id = p_professional_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_connection_participant(p_connection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections
    where id = p_connection_id
      and (requester_id = auth.uid() or recipient_id = auth.uid())
  );
$$;

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    join public.connections n on n.id = c.connection_id
    where c.id = p_conversation_id
      and (n.requester_id = auth.uid() or n.recipient_id = auth.uid())
  );
$$;

create or replace function public.is_blocked_between(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_users
    where (user_id = p_user_a and blocked_user_id = p_user_b)
       or (user_id = p_user_b and blocked_user_id = p_user_a)
  );
$$;

create or replace function public.can_review_enquiry(p_enquiry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enquiries
    where id = p_enquiry_id
      and customer_id = auth.uid()
      and status in ('responded', 'closed')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_name text;
begin
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  requested_role := case
    when lower(coalesce(new.raw_user_meta_data ->> 'role', 'customer')) = 'professional'
      then 'professional'::public.user_role
    else 'customer'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, display_name)
  values (
    new.id,
    requested_role,
    coalesce(requested_name, split_part(coalesce(new.email, ''), '@', 1)),
    requested_name
  )
  on conflict (id) do nothing;

  insert into public.profile_private (user_id, phone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or public.is_platform_context() then
    return new;
  end if;

  if new.id <> old.id then
    raise exception 'Profile ids cannot be changed';
  end if;

  if new.role <> old.role then
    raise exception 'Profile role changes require platform approval';
  end if;

  return new;
end;
$$;

create or replace function public.guard_professional_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or public.is_platform_context() then
    return new;
  end if;

  if new.id <> old.id or new.user_id <> old.user_id then
    raise exception 'Professional ownership cannot be changed';
  end if;

  if new.verification_status <> old.verification_status
     or new.identity_verified <> old.identity_verified
     or new.qualification_verified <> old.qualification_verified
     or new.rating_average <> old.rating_average
     or new.review_count <> old.review_count
     or new.completed_enquiries <> old.completed_enquiries
     or new.response_rate <> old.response_rate
     or new.is_sponsored <> old.is_sponsored then
    raise exception 'Platform-managed professional fields cannot be changed';
  end if;

  return new;
end;
$$;

create or replace function public.guard_education_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or public.is_platform_context() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.is_verified then
    raise exception 'Education verification is managed by the platform';
  end if;

  if tg_op = 'UPDATE' and new.is_verified <> old.is_verified then
    raise exception 'Education verification is managed by the platform';
  end if;

  return new;
end;
$$;

create or replace function public.guard_certification_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or public.is_platform_context() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.verification_status <> 'unverified' then
    raise exception 'Certification verification is managed by the platform';
  end if;

  if tg_op = 'UPDATE' and new.verification_status <> old.verification_status then
    raise exception 'Certification verification is managed by the platform';
  end if;

  return new;
end;
$$;

create or replace function public.guard_connection_identity()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id
     or new.recipient_id <> old.recipient_id then
    raise exception 'Connection participants cannot be changed';
  end if;

  return new;
end;
$$;

create or replace function public.guard_connection_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = new.status
     or public.is_admin()
     or public.is_platform_context() then
    return new;
  end if;

  if old.status = 'pending' then
    if new.status = 'accepted' and auth.uid() = old.recipient_id then
      return new;
    end if;

    if new.status = 'declined' and auth.uid() = old.recipient_id then
      return new;
    end if;

    if new.status = 'cancelled'
       and auth.uid() in (old.requester_id, old.recipient_id) then
      return new;
    end if;
  end if;

  if old.status = 'accepted'
     and new.status = 'cancelled'
     and auth.uid() in (old.requester_id, old.recipient_id) then
    return new;
  end if;

  raise exception 'Invalid connection status transition';
end;
$$;

create or replace function public.create_conversation_for_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted'
     and (old.status is distinct from 'accepted') then
    insert into public.conversations (connection_id)
    values (new.id)
    on conflict (connection_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.guard_enquiry_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  if new.customer_id <> old.customer_id
     or new.professional_id <> old.professional_id
     or new.service_id is distinct from old.service_id
     or new.message <> old.message then
    raise exception 'Enquiry details cannot be changed after sending';
  end if;

  if public.is_admin()
     or public.is_platform_context()
     or old.status = new.status then
    return new;
  end if;

  if auth.uid() = old.customer_id
     and new.status = 'cancelled'
     and old.status in ('recorded', 'delivered') then
    return new;
  end if;

  select user_id into owner_id
  from public.professional_profiles
  where id = old.professional_id;

  if auth.uid() = owner_id
     and new.status in ('delivered', 'responded', 'closed')
     and old.status not in ('cancelled', 'closed') then
    return new;
  end if;

  raise exception 'Invalid enquiry status transition';
end;
$$;

create or replace function public.guard_message_fields()
returns trigger
language plpgsql
as $$
begin
  if new.conversation_id <> old.conversation_id
     or new.sender_id <> old.sender_id
     or new.message_type <> old.message_type
     or new.body is distinct from old.body
     or new.attachment_url is distinct from old.attachment_url then
    raise exception 'Sent messages are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.guard_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or public.is_platform_context() then
    return new;
  end if;

  if new.enquiry_id <> old.enquiry_id
     or new.customer_id <> old.customer_id
     or new.professional_id <> old.professional_id then
    raise exception 'Review participants cannot be changed';
  end if;

  if new.status <> old.status then
    raise exception 'Review moderation status is managed by the platform';
  end if;

  if old.status <> 'pending'
     and (new.rating <> old.rating or new.body is distinct from old.body) then
    raise exception 'Published reviews cannot be edited';
  end if;

  return new;
end;
$$;

create or replace function public.guard_review_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  review_owner uuid;
begin
  select professional_id into review_owner
  from public.reviews
  where id = new.review_id;

  if review_owner is null or review_owner <> new.professional_id then
    raise exception 'Review response must belong to the reviewed professional';
  end if;

  return new;
end;
$$;

create or replace function public.sync_professional_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if tg_op = 'DELETE' then
    target_id := old.professional_id;
  else
    target_id := new.professional_id;
  end if;

  update public.professional_profiles p
  set
    rating_average = coalesce(
      (
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.professional_id = target_id
          and r.status = 'published'
      ),
      0
    ),
    review_count = (
      select count(*)::integer
      from public.reviews r
      where r.professional_id = target_id
        and r.status = 'published'
    ),
    updated_at = now()
  where p.id = target_id;

  return null;
end;
$$;

create trigger profiles_privilege_guard
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profile_private_set_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger subcategories_set_updated_at
  before update on public.subcategories
  for each row execute function public.set_updated_at();

create trigger professional_profiles_privilege_guard
  before update on public.professional_profiles
  for each row execute function public.guard_professional_privileges();

create trigger professional_profiles_set_updated_at
  before update on public.professional_profiles
  for each row execute function public.set_updated_at();

create trigger professional_services_set_updated_at
  before update on public.professional_services
  for each row execute function public.set_updated_at();

create trigger professional_service_areas_set_updated_at
  before update on public.professional_service_areas
  for each row execute function public.set_updated_at();

create trigger professional_contact_channels_set_updated_at
  before update on public.professional_contact_channels
  for each row execute function public.set_updated_at();

create trigger professional_certifications_set_updated_at
  before update on public.professional_certifications
  for each row execute function public.set_updated_at();

create trigger professional_education_verification_guard
  before insert or update on public.professional_education
  for each row execute function public.guard_education_verification();

create trigger professional_certifications_verification_guard
  before insert or update on public.professional_certifications
  for each row execute function public.guard_certification_verification();

create trigger portfolio_items_set_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

create trigger connections_identity_guard
  before update on public.connections
  for each row execute function public.guard_connection_identity();

create trigger connections_status_guard
  before update on public.connections
  for each row execute function public.guard_connection_status();

create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

create trigger connections_create_conversation
  after update of status on public.connections
  for each row execute function public.create_conversation_for_connection();

create trigger enquiries_fields_guard
  before update on public.enquiries
  for each row execute function public.guard_enquiry_fields();

create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

create trigger messages_fields_guard
  before update on public.messages
  for each row execute function public.guard_message_fields();

create trigger reviews_fields_guard
  before update on public.reviews
  for each row execute function public.guard_review_fields();

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create trigger reviews_sync_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_professional_rating();

create trigger review_responses_guard
  before insert or update on public.review_responses
  for each row execute function public.guard_review_response();

create trigger review_responses_set_updated_at
  before update on public.review_responses
  for each row execute function public.set_updated_at();

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create trigger credit_packs_set_updated_at
  before update on public.credit_packs
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();
