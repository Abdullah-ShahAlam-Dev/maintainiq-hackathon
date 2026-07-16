// Single source of truth for categories used across the whole app —
// Asset creation, Issue reporting, and every category filter dropdown
// (Overview, Public Asset Registry, Issue Management) import from here
// instead of deriving the list from whatever's already in the DB.
// This is what stops "Electronics", "Electronics45", "Electroinics SA"
// all becoming separate categories just because someone typed it differently.
export const ASSET_CATEGORIES = [
  'Camera',
  'Optics',
  'Electrical Power',
  'Electronics',
  'Equipment',
  'Video Surveillance',
   'Fire Safety'   
];

// Sentinel value for the "Other" option — never store this literal string,
// it just triggers the custom text input in the UI.
export const OTHER_CATEGORY = 'Other';