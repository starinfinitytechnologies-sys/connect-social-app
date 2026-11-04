export const CATEGORIES = [
  {
    id: 'legal',
    name: 'Legal Services',
    icon: 'scale-outline',
    color: '#5B4BFF',
    soft: '#EEECFF',
    description: 'Advocates, lawyers and notaries',
    regulated: true,
    disclaimer:
      'Professionals listed here are independent practitioners. Platform verification confirms identity or documents only; it is not a government licence or a professional endorsement. Always confirm enrolment with the relevant Bar Council.',
    subcategories: [
      { id: 'advocate', name: 'Advocate' },
      { id: 'lawyer', name: 'Lawyer' },
      { id: 'legal-consultant', name: 'Legal Consultant' },
      { id: 'notary', name: 'Notary' },
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: 'home-outline',
    color: '#0D9488',
    soft: '#E6FAF6',
    description: 'Agents, dealers and property experts',
    regulated: false,
    subcategories: [
      { id: 'real-estate-agent', name: 'Real Estate Agent' },
      { id: 'property-dealer', name: 'Property Dealer' },
      { id: 'property-consultant', name: 'Property Consultant' },
      { id: 'architect', name: 'Architect' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'school-outline',
    color: '#2563EB',
    soft: '#EAF2FF',
    description: 'Tutors, coaches and counsellors',
    regulated: false,
    subcategories: [
      { id: 'private-tutor', name: 'Private Tutor' },
      { id: 'coaching-teacher', name: 'Coaching Teacher' },
      { id: 'career-counsellor', name: 'Career Counsellor' },
      { id: 'educational-consultant', name: 'Educational Consultant' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'medkit-outline',
    color: '#DB2777',
    soft: '#FDEEF6',
    description: 'Doctors, dentists and wellness experts',
    regulated: true,
    disclaimer:
      'Healthcare professionals are independent practitioners. Verification on this platform does not replace a medical registration check. Please confirm registration with the relevant State Medical Council before treatment.',
    subcategories: [
      { id: 'doctor', name: 'Doctor' },
      { id: 'dentist', name: 'Dentist' },
      { id: 'physiotherapist', name: 'Physiotherapist' },
      { id: 'nutritionist', name: 'Nutritionist' },
    ],
  },
  {
    id: 'home-services',
    name: 'Home Services',
    icon: 'construct-outline',
    color: '#D97706',
    soft: '#FEF5E7',
    description: 'Tradespeople and interior experts',
    regulated: false,
    subcategories: [
      { id: 'electrician', name: 'Electrician' },
      { id: 'plumber', name: 'Plumber' },
      { id: 'carpenter', name: 'Carpenter' },
      { id: 'painter', name: 'Painter' },
      { id: 'interior-designer', name: 'Interior Designer' },
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: 'code-slash-outline',
    color: '#4F46E5',
    soft: '#EEF2FF',
    description: 'Developers, designers and IT experts',
    regulated: false,
    subcategories: [
      { id: 'software-developer', name: 'Software Developer' },
      { id: 'web-developer', name: 'Web Developer' },
      { id: 'it-consultant', name: 'IT Consultant' },
      { id: 'graphic-designer', name: 'Graphic Designer' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: 'cash-outline',
    color: '#059669',
    soft: '#E9F9F2',
    description: 'Accounts, tax and financial advice',
    regulated: true,
    disclaimer:
      'Financial professionals are independent practitioners. Platform verification is not a licence or regulatory endorsement. Confirm registration with the relevant institute or regulator before acting on advice.',
    subcategories: [
      { id: 'chartered-accountant', name: 'Chartered Accountant' },
      { id: 'tax-consultant', name: 'Tax Consultant' },
      { id: 'financial-consultant', name: 'Financial Consultant' },
    ],
  },
  {
    id: 'tourism',
    name: 'Tourism',
    icon: 'airplane-outline',
    color: '#0891B2',
    soft: '#E7F8FC',
    description: 'Guides, agents and travel experts',
    regulated: false,
    subcategories: [
      { id: 'local-tour-guide', name: 'Local Tour Guide' },
      { id: 'travel-agent', name: 'Travel Agent' },
      { id: 'hotel-consultant', name: 'Hotel Consultant' },
    ],
  },
  {
    id: 'business',
    name: 'Business Services',
    icon: 'briefcase-outline',
    color: '#C026D3',
    soft: '#FBEAFE',
    description: 'Consultants, creatives and planners',
    regulated: false,
    subcategories: [
      { id: 'marketing-consultant', name: 'Marketing Consultant' },
      { id: 'business-consultant', name: 'Business Consultant' },
      { id: 'photographer', name: 'Photographer' },
      { id: 'event-planner', name: 'Event Planner' },
    ],
  },
];

export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name);

export const CATEGORY_META = CATEGORIES.reduce((accumulator, category) => {
  accumulator[category.name] = {
    color: category.color,
    soft: category.soft,
    icon: category.icon,
  };
  return accumulator;
}, {});

export const ALL_SUBCATEGORIES = CATEGORIES.flatMap((category) =>
  category.subcategories.map((subcategory) => ({
    ...subcategory,
    categoryId: category.id,
    categoryName: category.name,
    color: category.color,
    soft: category.soft,
  }))
);

export function getCategoryById(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function getCategoryByName(categoryName) {
  return CATEGORIES.find((category) => category.name === categoryName) || null;
}

export function getSubcategoryById(subcategoryId) {
  return (
    ALL_SUBCATEGORIES.find((subcategory) => subcategory.id === subcategoryId) || null
  );
}

export function getSubcategoriesForCategory(categoryId) {
  const category = getCategoryById(categoryId);
  return category ? category.subcategories : [];
}
