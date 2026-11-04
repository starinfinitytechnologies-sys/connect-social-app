import { CATEGORIES, CATEGORY_META, CATEGORY_NAMES } from './categories';
import { DEFAULT_RELATIONSHIPS, PROFESSIONALS } from './professionals';

export { CATEGORIES, CATEGORY_META, CATEGORY_NAMES, PROFESSIONALS };

export const INITIAL_CREDITS = 3;

export const CURRENT_USER = {
  id: 'me',
  name: 'Aarav Sharma',
  firstName: 'Aarav',
  initials: 'AS',
  profession: 'Product Designer',
  avatarColor: '#4F3BF0',
  avatarSoft: '#EEECFF',
  email: 'aarav.sharma@example.com',
  phone: '9000000000',
  city: 'Kolkata',
  area: 'Dum Dum',
  memberSince: '2024',
  emailVerified: true,
  phoneVerified: true,
  role: 'customer',
  hasProfessionalProfile: false,
};

export function createInitialRelationships() {
  return JSON.parse(JSON.stringify(DEFAULT_RELATIONSHIPS));
}
