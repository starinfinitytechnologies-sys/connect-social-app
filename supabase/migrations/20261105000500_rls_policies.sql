-- Connect Local: row level security.
-- Policies assume the client uses the publishable/anon key with a user JWT.
-- Server-side jobs must use the service role, which bypasses RLS.

create or replace function public.is_blocked_with_professional(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.professional_profiles p
    join public.blocked_users b
      on (
        (b.user_id = auth.uid() and b.blocked_user_id = p.user_id)
        or (b.user_id = p.user_id and b.blocked_user_id = auth.uid())
      )
    where p.id = p_professional_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_subcategories enable row level security;
alter table public.professional_services enable row level security;
alter table public.professional_service_areas enable row level security;
alter table public.professional_contact_channels enable row level security;
alter table public.professional_education enable row level security;
alter table public.professional_certifications enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.saved_profiles enable row level security;
alter table public.blocked_users enable row level security;
alter table public.connections enable row level security;
alter table public.enquiries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.plans enable row level security;
alter table public.credit_packs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.platform_settings enable row level security;

-- Profiles -----------------------------------------------------------------

create policy profiles_select_authenticated
  on public.profiles for select to authenticated
  using (true);

create policy profiles_insert_self
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update_self_or_admin
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_delete_admin
  on public.profiles for delete to authenticated
  using (public.is_admin());

create policy profile_private_select_owner_or_admin
  on public.profile_private for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy profile_private_insert_owner
  on public.profile_private for insert to authenticated
  with check (user_id = auth.uid());

create policy profile_private_update_owner_or_admin
  on public.profile_private for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy profile_private_delete_owner_or_admin
  on public.profile_private for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Reference data -----------------------------------------------------------

create policy categories_select_active
  on public.categories for select to anon, authenticated
  using (is_active or public.is_admin());

create policy categories_admin_insert
  on public.categories for insert to authenticated
  with check (public.is_admin());

create policy categories_admin_update
  on public.categories for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy categories_admin_delete
  on public.categories for delete to authenticated
  using (public.is_admin());

create policy subcategories_select_active
  on public.subcategories for select to anon, authenticated
  using (is_active or public.is_admin());

create policy subcategories_admin_insert
  on public.subcategories for insert to authenticated
  with check (public.is_admin());

create policy subcategories_admin_update
  on public.subcategories for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy subcategories_admin_delete
  on public.subcategories for delete to authenticated
  using (public.is_admin());

-- Professional profiles ----------------------------------------------------

create policy professional_profiles_select
  on public.professional_profiles for select to authenticated
  using (is_active or user_id = auth.uid() or public.is_admin());

create policy professional_profiles_insert_owner
  on public.professional_profiles for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy professional_profiles_update_owner
  on public.professional_profiles for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy professional_profiles_delete_owner
  on public.professional_profiles for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy professional_subcategories_select
  on public.professional_subcategories for select to authenticated
  using (true);

create policy professional_subcategories_owner_insert
  on public.professional_subcategories for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_subcategories_owner_delete
  on public.professional_subcategories for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_services_select
  on public.professional_services for select to authenticated
  using (
    is_active
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  );

create policy professional_services_owner_insert
  on public.professional_services for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_services_owner_update
  on public.professional_services for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_services_owner_delete
  on public.professional_services for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_service_areas_select
  on public.professional_service_areas for select to authenticated
  using (true);

create policy professional_service_areas_owner_insert
  on public.professional_service_areas for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_service_areas_owner_update
  on public.professional_service_areas for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_service_areas_owner_delete
  on public.professional_service_areas for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_contacts_select
  on public.professional_contact_channels for select to authenticated
  using (
    is_public
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  );

create policy professional_contacts_owner_insert
  on public.professional_contact_channels for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_contacts_owner_update
  on public.professional_contact_channels for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_contacts_owner_delete
  on public.professional_contact_channels for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_education_select
  on public.professional_education for select to authenticated
  using (true);

create policy professional_education_owner_insert
  on public.professional_education for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_education_owner_update
  on public.professional_education for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_education_owner_delete
  on public.professional_education for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_certifications_select
  on public.professional_certifications for select to authenticated
  using (true);

create policy professional_certifications_owner_insert
  on public.professional_certifications for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_certifications_owner_update
  on public.professional_certifications for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy professional_certifications_owner_delete
  on public.professional_certifications for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy portfolio_items_select
  on public.portfolio_items for select to authenticated
  using (
    is_visible
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  );

create policy portfolio_items_owner_insert
  on public.portfolio_items for insert to authenticated
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy portfolio_items_owner_update
  on public.portfolio_items for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy portfolio_items_owner_delete
  on public.portfolio_items for delete to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

-- Saved and blocked --------------------------------------------------------

create policy saved_profiles_select_owner
  on public.saved_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy saved_profiles_insert_owner
  on public.saved_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy saved_profiles_delete_owner
  on public.saved_profiles for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy blocked_users_select_owner
  on public.blocked_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy blocked_users_insert_owner
  on public.blocked_users for insert to authenticated
  with check (user_id = auth.uid());

create policy blocked_users_delete_owner
  on public.blocked_users for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Connections --------------------------------------------------------------

create policy connections_select_participant
  on public.connections for select to authenticated
  using (
    requester_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_admin()
  );

create policy connections_insert_requester
  on public.connections for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> recipient_id
    and not public.is_blocked_between(requester_id, recipient_id)
    and exists (
      select 1
      from public.professional_profiles p
      where p.user_id = recipient_id
        and p.is_active
    )
  );

create policy connections_update_participant
  on public.connections for update to authenticated
  using (
    requester_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_admin()
  )
  with check (
    requester_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_admin()
  );

create policy connections_delete_participant
  on public.connections for delete to authenticated
  using (
    requester_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_admin()
  );

-- Enquiries ----------------------------------------------------------------

create policy enquiries_select_participant
  on public.enquiries for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  );

create policy enquiries_insert_customer
  on public.enquiries for insert to authenticated
  with check (
    customer_id = auth.uid()
    and not public.is_blocked_with_professional(professional_id)
    and exists (
      select 1
      from public.professional_profiles p
      where p.id = enquiries.professional_id
        and p.is_active
    )
    and (
      service_id is null
      or exists (
        select 1
        from public.professional_services s
        where s.id = enquiries.service_id
          and s.professional_id = enquiries.professional_id
          and s.is_active
      )
    )
  );

create policy enquiries_update_participant
  on public.enquiries for update to authenticated
  using (
    customer_id = auth.uid()
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  );

create policy enquiries_delete_admin
  on public.enquiries for delete to authenticated
  using (public.is_admin());

-- Conversations and messages ----------------------------------------------

create policy conversations_select_participant
  on public.conversations for select to authenticated
  using (
    public.is_conversation_participant(id) or public.is_admin()
  );

create policy conversations_insert_participant
  on public.conversations for insert to authenticated
  with check (
    public.is_connection_participant(connection_id) or public.is_admin()
  );

create policy conversations_delete_admin
  on public.conversations for delete to authenticated
  using (public.is_admin());

create policy messages_select_participant
  on public.messages for select to authenticated
  using (
    public.is_conversation_participant(conversation_id) or public.is_admin()
  );

create policy messages_insert_participant
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

create policy messages_update_participant
  on public.messages for update to authenticated
  using (
    public.is_conversation_participant(conversation_id) or public.is_admin()
  )
  with check (
    public.is_conversation_participant(conversation_id) or public.is_admin()
  );

create policy messages_delete_admin
  on public.messages for delete to authenticated
  using (public.is_admin());

-- Reviews and reports ------------------------------------------------------

create policy reviews_select_published_or_participant
  on public.reviews for select to authenticated
  using (
    status = 'published'
    or customer_id = auth.uid()
    or public.is_professional_owner(professional_id)
    or public.is_admin()
  );

create policy reviews_insert_customer
  on public.reviews for insert to authenticated
  with check (
    customer_id = auth.uid()
    and public.can_review_enquiry(enquiry_id)
    and professional_id = (
      select e.professional_id
      from public.enquiries e
      where e.id = enquiry_id
    )
  );

create policy reviews_update_author_or_admin
  on public.reviews for update to authenticated
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or public.is_admin());

create policy reviews_delete_admin
  on public.reviews for delete to authenticated
  using (public.is_admin());

create policy review_responses_select
  on public.review_responses for select to authenticated
  using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_responses.review_id
        and (
          r.status = 'published'
          or r.customer_id = auth.uid()
          or r.professional_id = review_responses.professional_id
          or public.is_admin()
        )
    )
  );

create policy review_responses_insert_owner
  on public.review_responses for insert to authenticated
  with check (
    public.is_professional_owner(professional_id)
    and exists (
      select 1
      from public.reviews r
      where r.id = review_responses.review_id
        and r.professional_id = review_responses.professional_id
    )
  );

create policy review_responses_update_owner
  on public.review_responses for update to authenticated
  using (
    public.is_professional_owner(professional_id) or public.is_admin()
  )
  with check (
    public.is_professional_owner(professional_id) or public.is_admin()
  );

create policy review_responses_delete_admin
  on public.review_responses for delete to authenticated
  using (public.is_admin());

create policy reports_insert_reporter
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy reports_select_reporter_or_admin
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy reports_update_admin
  on public.reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy reports_delete_admin
  on public.reports for delete to authenticated
  using (public.is_admin());

create policy audit_logs_admin_only
  on public.audit_logs for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Billing ------------------------------------------------------------------

create policy plans_select_active
  on public.plans for select to anon, authenticated
  using (is_active or public.is_admin());

create policy plans_admin_write
  on public.plans for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy credit_packs_select_active
  on public.credit_packs for select to anon, authenticated
  using (is_active or public.is_admin());

create policy credit_packs_admin_write
  on public.credit_packs for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy platform_settings_select
  on public.platform_settings for select to anon, authenticated
  using (true);

create policy platform_settings_admin_write
  on public.platform_settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy subscriptions_select_owner
  on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy subscriptions_admin_write
  on public.subscriptions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy credit_ledger_select_owner
  on public.credit_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy credit_ledger_admin_write
  on public.credit_ledger for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy payments_select_owner
  on public.payments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy payments_admin_write
  on public.payments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy payment_events_admin_only
  on public.payment_events for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- API grants ---------------------------------------------------------------
-- RLS still applies. The publishable key only gets explicit reference reads.

grant select on public.categories to anon;
grant select on public.subcategories to anon;
grant select on public.plans to anon;
grant select on public.credit_packs to anon;
grant select on public.platform_settings to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- Column grants keep platform-managed fields out of the client API even when a
-- future policy accidentally allows a broader row update. Admin moderation uses
-- the service role from a trusted server or Edge Function.
revoke insert, update on public.profiles from authenticated;
grant insert (
  id, full_name, display_name, avatar_url, city, state, area
) on public.profiles to authenticated;
grant update (
  full_name, display_name, avatar_url, city, state, area
) on public.profiles to authenticated;

revoke insert, update on public.professional_profiles from authenticated;
grant insert (
  user_id, category_id, business_name, headline, profession, bio,
  experience_years, languages, service_radius_km, availability_status,
  working_hours, next_slot, is_active
) on public.professional_profiles to authenticated;
grant update (
  category_id, business_name, headline, profession, bio, experience_years,
  languages, service_radius_km, availability_status, working_hours,
  next_slot, is_active
) on public.professional_profiles to authenticated;

revoke insert, update on public.professional_education from authenticated;
grant insert (
  professional_id, degree, institute, year, sort_order
) on public.professional_education to authenticated;
grant update (
  degree, institute, year, sort_order
) on public.professional_education to authenticated;

revoke insert, update on public.professional_certifications from authenticated;
grant insert (
  professional_id, title, issuer, year, document_url
) on public.professional_certifications to authenticated;
grant update (
  title, issuer, year, document_url
) on public.professional_certifications to authenticated;

grant execute on all functions in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
