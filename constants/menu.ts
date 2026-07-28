export const MENU_CATEGORIES = [
  { id: 'biryani',            label: 'Biryani',              emoji: '🍛' },
  { id: 'veg-appetizers',     label: 'Vegetarian Appetizers', emoji: '🥗' },
  { id: 'non-veg-appetizers', label: 'Non-Veg Appetizers',   emoji: '🍗' },
  { id: 'veg-curries',        label: 'Vegetarian Curries',   emoji: '🥘' },
  { id: 'non-veg-curries',    label: 'Non-Veg Curries',      emoji: '🍲' },
  { id: 'sizzlers',           label: 'Sizzlers',             emoji: '🔥' },
  { id: 'chef-specials',      label: "Chef's Specials",      emoji: '👨‍🍳' },
  { id: 'weekend-specials',   label: 'Weekend Specials',     emoji: '🌟' },
  { id: 'shawarma',           label: 'Shawarma',             emoji: '🌯' },
  { id: 'breads',             label: 'Breads & Naan',        emoji: '🫓' },
  { id: 'soups-salads',       label: 'Soups & Salads',       emoji: '🥣' },
  { id: 'chinese',            label: 'Indo-Chinese',         emoji: '🍜' },
  { id: 'desserts',           label: 'Desserts',             emoji: '🍮' },
  { id: 'drinks',             label: 'Beverages',            emoji: '🥤' },
] as const

export type MenuCategoryId = typeof MENU_CATEGORIES[number]['id']

export const SPICE_LABELS = {
  1: 'Mild',
  2: 'Medium',
  3: 'Hot',
} as const

export const ALLERGENS = [
  'gluten', 'dairy', 'eggs', 'nuts', 'peanuts', 'soy', 'shellfish', 'sesame',
] as const

/** Shown below dish descriptions — photo is illustrative, not exact plating. */
export const DISH_PHOTO_DISCLAIMER =
  'The product image is for illustrative purposes only. The actual product may differ in appearance.'
