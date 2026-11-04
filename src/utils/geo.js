const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function distanceInKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((value) => typeof value !== 'number')) {
    return 0;
  }

  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((EARTH_RADIUS_KM * c).toFixed(1));
}

export function formatDistance(km) {
  if (typeof km !== 'number' || Number.isNaN(km)) return 'Distance unavailable';
  if (km < 1) return `${Math.max(50, Math.round(km * 1000))} m away`;
  return `${km.toFixed(1)} km away`;
}

export function formatPrice(amount, { suffix = '' } = {}) {
  if (typeof amount !== 'number') return '';

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
    return suffix ? `${formatted}${suffix}` : formatted;
  } catch {
    return `₹${amount.toLocaleString('en-IN')}${suffix}`;
  }
}

export function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}
