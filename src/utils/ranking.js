import { clamp } from './geo';
import { getSubcategoryById } from '../data/categories';

export const DEFAULT_FILTERS = {
  maxDistanceKm: 25,
  minRating: 0,
  verifiedOnly: false,
  availableOnly: false,
  onlineOnly: false,
  maxPrice: null,
};

export const DISTANCE_OPTIONS = [1, 3, 5, 10, 25, 50];
export const RATING_OPTIONS = [0, 4, 4.5, 4.8];
export const PRICE_OPTIONS = [
  { id: 'any', label: 'Any price', maxPrice: null },
  { id: 'under-1000', label: 'Under ₹1,000', maxPrice: 1000 },
  { id: 'under-2500', label: 'Under ₹2,500', maxPrice: 2500 },
  { id: 'under-5000', label: 'Under ₹5,000', maxPrice: 5000 },
  { id: 'under-10000', label: 'Under ₹10,000', maxPrice: 10000 },
];

export const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended', icon: 'sparkles-outline' },
  { id: 'nearest', label: 'Nearest', icon: 'navigate-outline' },
  { id: 'rating', label: 'Top rated', icon: 'star-outline' },
  { id: 'newest', label: 'Newest', icon: 'time-outline' },
  { id: 'price', label: 'Price', icon: 'pricetag-outline' },
];

const WEIGHTS = {
  distance: 0.25,
  category: 0.17,
  rating: 0.13,
  verification: 0.09,
  completeness: 0.07,
  response: 0.07,
  demand: 0.08,
  activity: 0.06,
  availability: 0.05,
  newBoost: 0.02,
  sponsored: 0.01,
};

const NEW_PROFESSIONAL_BOOST = 0.035;

function searchableText(professional) {
  const subcategoryNames = (professional.subcategoryIds || [])
    .map((subcategoryId) => getSubcategoryById(subcategoryId)?.name || '')
    .join(' ');
  const serviceText = (professional.services || [])
    .map((item) => `${item.name} ${item.description}`)
    .join(' ');

  return [
    professional.name,
    professional.profession,
    professional.headline,
    professional.bio,
    professional.category,
    professional.area,
    professional.city,
    professional.locationLabel,
    (professional.languages || []).join(' '),
    subcategoryNames,
    serviceText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesQuery(professional, query) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const haystack = searchableText(professional);
  return tokens.every((token) => haystack.includes(token));
}

export function matchesCategory(professional, categoryId, subcategoryId) {
  if (categoryId && professional.categoryId !== categoryId) return false;

  if (subcategoryId) {
    const selected = getSubcategoryById(subcategoryId);
    if (!selected || !(professional.subcategoryIds || []).includes(subcategoryId)) {
      return false;
    }
  }

  return true;
}

export function matchesFilters(professional, filters) {
  const distance = professional.distanceKm || 0;

  if (typeof filters.maxDistanceKm === 'number' && distance > filters.maxDistanceKm) {
    return false;
  }

  if (professional.rating < (filters.minRating || 0)) return false;
  if (filters.verifiedOnly && !professional.verified) return false;

  if (filters.onlineOnly && !professional.online) return false;

  if (
    filters.availableOnly &&
    !professional.online &&
    professional.availabilityStatus !== 'available_today'
  ) {
    return false;
  }

  if (filters.maxPrice && professional.pricingFrom > filters.maxPrice) return false;

  return true;
}

export function filterProfessionals({
  professionals,
  query = '',
  categoryId = null,
  subcategoryId = null,
  filters = DEFAULT_FILTERS,
  blockedIds = [],
}) {
  return professionals.filter((professional) => {
    if (blockedIds.includes(professional.id)) return false;
    if (!matchesCategory(professional, categoryId, subcategoryId)) return false;
    if (!matchesFilters(professional, filters)) return false;
    if (!matchesQuery(professional, query)) return false;
    return true;
  });
}

function buildDemandContext(professionals) {
  const groups = {};

  professionals.forEach((professional) => {
    if (!groups[professional.categoryId]) groups[professional.categoryId] = [];
    groups[professional.categoryId].push(professional.requestCount || 0);
  });

  const max = {};
  const threshold = {};

  Object.entries(groups).forEach(([categoryId, values]) => {
    max[categoryId] = Math.max(...values, 1);
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.85);
    threshold[categoryId] = sorted[Math.min(index, sorted.length - 1)] || 0;
  });

  return { max, threshold };
}

function scoreProfessional(
  professional,
  { categoryId, subcategoryId, filters, demandContext }
) {
  const distance = professional.distanceKm || 0;
  const radius = filters.maxDistanceKm || 25;
  const distanceScore = 1 - clamp(distance / Math.max(radius, 1), 0, 1);

  let categoryScore = 0.65;
  if (categoryId) {
    categoryScore = professional.categoryId === categoryId ? 1 : 0;
    if (subcategoryId && (professional.subcategoryIds || []).includes(subcategoryId)) {
      categoryScore = 1;
    }
  }

  const ratingScore = clamp((professional.rating - 3.4) / 1.6, 0, 1);
  const verificationScore =
    professional.verificationLevel === 'qualification'
      ? 1
      : professional.verificationLevel === 'identity'
        ? 0.72
        : professional.verified
          ? 0.55
          : 0;
  const completenessScore = clamp((professional.profileCompleteness || 0) / 100);
  const responseScore = clamp(professional.responseRate || 0);
  const maxRequests = Math.max(demandContext.max[professional.categoryId] || 1, 1);
  const demandScore = Math.log1p(professional.requestCount || 0) / Math.log1p(maxRequests);
  const demandThreshold = demandContext.threshold[professional.categoryId] || 0;
  const activityScore = clamp(1 - (professional.lastActiveHours || 720) / 168);
  const availabilityScore =
    professional.availabilityStatus === 'online'
      ? 1
      : professional.availabilityStatus === 'available_today'
        ? 0.78
        : 0.45;
  const newScore = professional.isNew ? 1 : 0;
  const sponsoredScore = professional.sponsored ? 1 : 0;

  const score =
    WEIGHTS.distance * distanceScore +
    WEIGHTS.category * categoryScore +
    WEIGHTS.rating * ratingScore +
    WEIGHTS.verification * verificationScore +
    WEIGHTS.completeness * completenessScore +
    WEIGHTS.response * responseScore +
    WEIGHTS.demand * demandScore +
    WEIGHTS.activity * activityScore +
    WEIGHTS.availability * availabilityScore +
    WEIGHTS.newBoost * newScore +
    NEW_PROFESSIONAL_BOOST * newScore +
    WEIGHTS.sponsored * sponsoredScore;

  const tags = [];
  if (professional.sponsored) {
    tags.push({ id: 'sponsored', label: 'Sponsored', tone: 'gold' });
  }
  if (professional.isNew) {
    tags.push({ id: 'new', label: 'New professional', tone: 'info' });
  }
  if (professional.trending) {
    tags.push({ id: 'trending', label: 'Trending', tone: 'premium' });
  }
  if (professional.rating >= 4.7 && professional.reviewCount >= 20) {
    tags.push({ id: 'top-rated', label: 'Top rated', tone: 'success' });
  }
  if (
    !professional.sponsored &&
    demandThreshold > 0 &&
    (professional.requestCount || 0) >= demandThreshold &&
    (professional.requestCount || 0) >= 25
  ) {
    tags.push({ id: 'most-requested', label: 'Most requested', tone: 'primary' });
  }
  if ((professional.lastActiveHours || 999) <= 3) {
    tags.push({ id: 'recently-active', label: 'Recently active', tone: 'success' });
  }

  return {
    score: Number(score.toFixed(4)),
    distanceScore,
    categoryScore,
    rankTags: tags.slice(0, 3),
  };
}

function parseMemberSince(professional) {
  const parsed = Number(String(professional.memberSince).replace(/[^\d]/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function rankProfessionals({
  professionals,
  categoryId = null,
  subcategoryId = null,
  filters = DEFAULT_FILTERS,
  sort = 'recommended',
}) {
  const demandContext = buildDemandContext(professionals);
  const scored = professionals.map((professional) => {
    const result = scoreProfessional(professional, {
      categoryId,
      subcategoryId,
      filters,
      demandContext,
    });

    return {
      ...professional,
      matchScore: result.score,
      distanceScore: result.distanceScore,
      rankTags: result.rankTags,
    };
  });

  if (sort === 'nearest') {
    return scored.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  if (sort === 'rating') {
    return scored.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  }

  if (sort === 'newest') {
    return scored.sort((a, b) => parseMemberSince(b) - parseMemberSince(a));
  }

  if (sort === 'price') {
    return scored.sort((a, b) => a.pricingFrom - b.pricingFrom || b.rating - a.rating);
  }

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

export function getTrendingNearby(professionals, limit = 6) {
  return professionals
    .filter((professional) => professional.trending || professional.requestCount >= 80)
    .sort(
      (a, b) =>
        Number(b.trending) - Number(a.trending) ||
        b.requestCount - a.requestCount ||
        b.rating - a.rating
    )
    .slice(0, limit);
}

export function getTopRatedNearby(professionals, limit = 6) {
  return [...professionals]
    .filter((professional) => professional.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function countActiveFilters(filters) {
  let count = 0;
  if (filters.maxDistanceKm !== DEFAULT_FILTERS.maxDistanceKm) count += 1;
  if (filters.minRating > 0) count += 1;
  if (filters.verifiedOnly) count += 1;
  if (filters.availableOnly) count += 1;
  if (filters.onlineOnly) count += 1;
  if (filters.maxPrice) count += 1;
  return count;
}
