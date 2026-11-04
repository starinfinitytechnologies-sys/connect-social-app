-- Connect Local: reference data used by the app and admin panel.
-- These values are intentionally server-side so the client cannot invent prices.

insert into public.categories (
  id, name, description, icon, color, soft_color, regulated, disclaimer, sort_order
)
values
  (
    'legal',
    'Legal Services',
    'Advocates, lawyers and notaries',
    'scale-outline',
    '#5B4BFF',
    '#EEECFF',
    true,
    'Professionals listed here are independent practitioners. Platform verification confirms identity or documents only; it is not a government licence or a professional endorsement. Always confirm enrolment with the relevant Bar Council.',
    10
  ),
  (
    'real-estate',
    'Real Estate',
    'Agents, dealers and property experts',
    'home-outline',
    '#0D9488',
    '#E6FAF6',
    false,
    null,
    20
  ),
  (
    'education',
    'Education',
    'Tutors, coaches and counsellors',
    'school-outline',
    '#2563EB',
    '#EAF2FF',
    false,
    null,
    30
  ),
  (
    'healthcare',
    'Healthcare',
    'Doctors, dentists and wellness experts',
    'medkit-outline',
    '#DB2777',
    '#FDEEF6',
    true,
    'Healthcare professionals are independent practitioners. Verification on this platform does not replace a medical registration check. Please confirm registration with the relevant State Medical Council before treatment.',
    40
  ),
  (
    'home-services',
    'Home Services',
    'Tradespeople and interior experts',
    'construct-outline',
    '#D97706',
    '#FEF5E7',
    false,
    null,
    50
  ),
  (
    'technology',
    'Technology',
    'Developers, designers and IT experts',
    'code-slash-outline',
    '#4F46E5',
    '#EEF2FF',
    false,
    null,
    60
  ),
  (
    'finance',
    'Finance',
    'Accounts, tax and financial advice',
    'cash-outline',
    '#059669',
    '#E9F9F2',
    true,
    'Financial professionals are independent practitioners. Platform verification is not a licence or regulatory endorsement. Confirm registration with the relevant institute or regulator before acting on advice.',
    70
  ),
  (
    'tourism',
    'Tourism',
    'Guides, agents and travel experts',
    'airplane-outline',
    '#0891B2',
    '#E7F8FC',
    false,
    null,
    80
  ),
  (
    'business',
    'Business Services',
    'Consultants, creatives and planners',
    'briefcase-outline',
    '#C026D3',
    '#FBEAFE',
    false,
    null,
    90
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  soft_color = excluded.soft_color,
  regulated = excluded.regulated,
  disclaimer = excluded.disclaimer,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.subcategories (id, category_id, name, sort_order)
values
  ('advocate', 'legal', 'Advocate', 10),
  ('lawyer', 'legal', 'Lawyer', 20),
  ('legal-consultant', 'legal', 'Legal Consultant', 30),
  ('notary', 'legal', 'Notary', 40),
  ('real-estate-agent', 'real-estate', 'Real Estate Agent', 10),
  ('property-dealer', 'real-estate', 'Property Dealer', 20),
  ('property-consultant', 'real-estate', 'Property Consultant', 30),
  ('architect', 'real-estate', 'Architect', 40),
  ('private-tutor', 'education', 'Private Tutor', 10),
  ('coaching-teacher', 'education', 'Coaching Teacher', 20),
  ('career-counsellor', 'education', 'Career Counsellor', 30),
  ('educational-consultant', 'education', 'Educational Consultant', 40),
  ('doctor', 'healthcare', 'Doctor', 10),
  ('dentist', 'healthcare', 'Dentist', 20),
  ('physiotherapist', 'healthcare', 'Physiotherapist', 30),
  ('nutritionist', 'healthcare', 'Nutritionist', 40),
  ('electrician', 'home-services', 'Electrician', 10),
  ('plumber', 'home-services', 'Plumber', 20),
  ('carpenter', 'home-services', 'Carpenter', 30),
  ('painter', 'home-services', 'Painter', 40),
  ('interior-designer', 'home-services', 'Interior Designer', 50),
  ('software-developer', 'technology', 'Software Developer', 10),
  ('web-developer', 'technology', 'Web Developer', 20),
  ('it-consultant', 'technology', 'IT Consultant', 30),
  ('graphic-designer', 'technology', 'Graphic Designer', 40),
  ('chartered-accountant', 'finance', 'Chartered Accountant', 10),
  ('tax-consultant', 'finance', 'Tax Consultant', 20),
  ('financial-consultant', 'finance', 'Financial Consultant', 30),
  ('local-tour-guide', 'tourism', 'Local Tour Guide', 10),
  ('travel-agent', 'tourism', 'Travel Agent', 20),
  ('hotel-consultant', 'tourism', 'Hotel Consultant', 30),
  ('marketing-consultant', 'business', 'Marketing Consultant', 10),
  ('business-consultant', 'business', 'Business Consultant', 20),
  ('photographer', 'business', 'Photographer', 30),
  ('event-planner', 'business', 'Event Planner', 40)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.plans (
  id, name, tagline, monthly_price_inr, annual_price_inr, limits, features, sort_order
)
values
  (
    'free',
    'Free',
    'Build your professional profile and get discovered.',
    0,
    0,
    '{"monthlyEnquiries": 3, "monthlyConnectionRequests": 5, "portfolioImages": 3, "analytics": "basic"}'::jsonb,
    array[
      'Professional profile and discovery listing',
      '5 connection requests each month',
      'Basic messaging',
      'Standard search placement'
    ],
    10
  ),
  (
    'pro',
    'Pro',
    'For professionals actively growing their local pipeline.',
    499,
    4990,
    '{"monthlyEnquiries": 40, "monthlyConnectionRequests": 60, "portfolioImages": 20, "analytics": "advanced"}'::jsonb,
    array[
      '40 enquiries and 60 connection requests monthly',
      'Better local discovery visibility',
      'Portfolio uploads and profile customisation',
      'Analytics dashboard',
      'Priority support'
    ],
    20
  ),
  (
    'premium',
    'Premium',
    'Maximum visibility and business tools for busy practices.',
    999,
    9990,
    '{"monthlyEnquiries": 150, "monthlyConnectionRequests": 200, "portfolioImages": 50, "analytics": "advanced"}'::jsonb,
    array[
      '150 enquiries and 200 connection requests monthly',
      'Enhanced local discovery visibility',
      'Profile promotion credits',
      'Lead management tools',
      'Featured profile opportunities'
    ],
    30
  )
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  monthly_price_inr = excluded.monthly_price_inr,
  annual_price_inr = excluded.annual_price_inr,
  limits = excluded.limits,
  features = excluded.features,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.credit_packs (
  id, credits, price_inr, label, description, sort_order
)
values
  ('credits-5', 5, 149, '5 credits', 'Enough for five additional enquiries.', 10),
  ('credits-15', 15, 399, '15 credits', 'Best for a busy enquiry week.', 20),
  ('credits-40', 40, 899, '40 credits', 'For teams managing frequent leads.', 30)
on conflict (id) do update set
  credits = excluded.credits,
  price_inr = excluded.price_inr,
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.platform_settings (key, value, description)
values
  (
    'payments_enabled',
    'false'::jsonb,
    'Must remain false until the Razorpay server-side verification flow is deployed.'
  ),
  (
    'currency',
    '"INR"'::jsonb,
    'All catalogue prices are stored in Indian rupees.'
  ),
  (
    'country',
    '"IN"'::jsonb,
    'Primary marketplace country.'
  ),
  (
    'support_email',
    '"support@example.com"'::jsonb,
    'Replace with the monitored support address before launch.'
  )
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description;
