/*
 * Development plan catalogue. In production these values must come from the
 * SubscriptionPlans table through the admin API, never from frontend constants.
 */

export const PLAN_CATALOGUE = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Build your professional profile and get discovered.',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      monthlyEnquiries: 3,
      monthlyConnectionRequests: 5,
      portfolioImages: 3,
      analytics: 'basic',
    },
    features: [
      'Professional profile and discovery listing',
      '5 connection requests each month',
      'Basic messaging',
      'Standard search placement',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For professionals actively growing their local pipeline.',
    monthlyPrice: 499,
    annualPrice: 4990,
    highlight: true,
    limits: {
      monthlyEnquiries: 40,
      monthlyConnectionRequests: 60,
      portfolioImages: 20,
      analytics: 'advanced',
    },
    features: [
      '40 enquiries and 60 connection requests monthly',
      'Better local discovery visibility',
      'Portfolio uploads and profile customisation',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Maximum visibility and business tools for busy practices.',
    monthlyPrice: 999,
    annualPrice: 9990,
    limits: {
      monthlyEnquiries: 150,
      monthlyConnectionRequests: 200,
      portfolioImages: 50,
      analytics: 'advanced',
    },
    features: [
      '150 enquiries and 200 connection requests monthly',
      'Enhanced local discovery visibility',
      'Profile promotion credits',
      'Lead management tools',
      'Featured profile opportunities',
    ],
  },
];

export const CREDIT_PACKS = [
  {
    id: 'credits-5',
    credits: 5,
    price: 149,
    label: '5 credits',
    description: 'Enough for five additional enquiries.',
  },
  {
    id: 'credits-15',
    credits: 15,
    price: 399,
    label: '15 credits',
    description: 'Best for a busy enquiry week.',
  },
  {
    id: 'credits-40',
    credits: 40,
    price: 899,
    label: '40 credits',
    description: 'For teams managing frequent leads.',
  },
];

export const PAYMENTS_ENABLED = false;

export function getPlanById(planId) {
  return PLAN_CATALOGUE.find((plan) => plan.id === planId) || PLAN_CATALOGUE[0];
}

export function formatInr(amount) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
}
