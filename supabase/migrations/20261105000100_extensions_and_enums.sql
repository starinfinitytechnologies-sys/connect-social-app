-- Connect Local: extensions and shared enum types.
-- Apply with `npx supabase db push` against a linked project, or run in the
-- Supabase SQL editor in filename order.

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('customer', 'professional', 'admin');
create type public.verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'rejected'
);
create type public.availability_status as enum (
  'available_now',
  'available_today',
  'available_this_week',
  'busy',
  'away'
);
create type public.connection_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled'
);
create type public.enquiry_status as enum (
  'recorded',
  'delivered',
  'responded',
  'closed',
  'cancelled'
);
create type public.message_type as enum ('text', 'image', 'file', 'system');
create type public.review_status as enum ('pending', 'published', 'rejected');
create type public.moderation_status as enum (
  'pending',
  'reviewed',
  'actioned',
  'dismissed'
);
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);
create type public.payment_status as enum (
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded'
);
create type public.payment_provider as enum ('razorpay');
