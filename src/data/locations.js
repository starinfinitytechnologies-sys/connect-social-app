export const DEFAULT_LOCATION = {
  id: 'dum-dum',
  label: 'Dum Dum',
  area: 'Dum Dum',
  city: 'Kolkata',
  state: 'West Bengal',
  latitude: 22.6227,
  longitude: 88.4227,
  source: 'default',
};

export const LOCATIONS = [
  DEFAULT_LOCATION,
  {
    id: 'salt-lake',
    label: 'Salt Lake',
    area: 'Bidhannagar',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5867,
    longitude: 88.4171,
    source: 'manual',
  },
  {
    id: 'new-town',
    label: 'New Town',
    area: 'Rajarhat',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.58,
    longitude: 88.46,
    source: 'manual',
  },
  {
    id: 'park-street',
    label: 'Park Street',
    area: 'Park Street',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5535,
    longitude: 88.352,
    source: 'manual',
  },
  {
    id: 'howrah',
    label: 'Howrah',
    area: 'Howrah',
    city: 'Howrah',
    state: 'West Bengal',
    latitude: 22.5958,
    longitude: 88.2636,
    source: 'manual',
  },
  {
    id: 'behala',
    label: 'Behala',
    area: 'Behala',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.4989,
    longitude: 88.3151,
    source: 'manual',
  },
  {
    id: 'garia',
    label: 'Garia',
    area: 'Garia',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.4667,
    longitude: 88.3833,
    source: 'manual',
  },
  {
    id: 'barasat',
    label: 'Barasat',
    area: 'Barasat',
    city: 'North 24 Parganas',
    state: 'West Bengal',
    latitude: 22.7221,
    longitude: 88.4807,
    source: 'manual',
  },
];

export function formatLocationLabel(location) {
  if (!location) return 'Select a location';

  if (location.area && location.city && location.area !== location.city) {
    return `${location.area}, ${location.city}`;
  }

  return location.label || location.city || 'Select a location';
}

export function findLocationById(locationId) {
  return LOCATIONS.find((location) => location.id === locationId) || null;
}
