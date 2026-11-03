/** Buffet display sections — order matches the in-restaurant buffet board. */
export const BUFFET_SECTIONS = [
  {
    id: 'veg-vegan-starters',
    title: 'Veg & Vegan Starters',
    items: [
      { menuItemId: 'veg-samosa', displayName: 'Samosa (Vegan)', vegan: true },
      { menuItemId: 'onion-palak-pakora', displayName: 'Onion & Palak Pakora (Vegan)', vegan: true },
      { menuItemId: 'french-fries', displayName: 'French Fries' },
    ],
  },
  {
    id: 'vegetarian-entrees',
    title: 'Vegetarian Entrées',
    items: [
      { menuItemId: 'white-rice', displayName: 'White Rice' },
      { menuItemId: 'saag-palak-paneer', displayName: 'Palak Paneer' },
    ],
  },
  {
    id: 'vegan-entrees',
    title: 'Vegan Entrées',
    items: [
      { menuItemId: 'tarka-dal', displayName: 'Dal Tadka' },
      { menuItemId: 'bhindi-masala', displayName: 'Bhindi Masala' },
    ],
  },
  {
    id: 'chicken-options',
    title: 'Chicken Options',
    items: [
      { menuItemId: 'butter-chicken', displayName: 'Butter Chicken' },
      { menuItemId: 'chicken-nuggets', displayName: 'Chicken Nuggets' },
      { menuItemId: 'chicken-fried-rice', displayName: 'Chicken Fried Rice' },
      { menuItemId: 'chicken-tandoori', displayName: 'Chicken Tandoori' },
      { menuItemId: 'lagan-dum-chicken', displayName: 'Lagan Dum Chicken' },
      { menuItemId: 'haryali-chicken', displayName: 'Haryali Chicken' },
      { menuItemId: 'chicken-karahi', displayName: 'Chicken Kadai' },
    ],
  },
  {
    id: 'mutton-specialties',
    title: 'Mutton Specialties',
    items: [
      { menuItemId: 'zafrani-mutton-dum-biryani', displayName: 'Zafrani Mutton Dum Biryani' },
      { menuItemId: 'sufiyani-mutton-dum-biryani', displayName: 'Sufiyani Mutton Dum Biryani' },
      { menuItemId: 'mutton-haleem', displayName: 'Mutton Haleem' },
      { menuItemId: 'mutton-marag', displayName: 'Shahi Mutton Marag' },
      { menuItemId: 'hyderabadi-mutton-masala', displayName: 'Hyderabadi Mutton Masala' },
    ],
  },
  {
    id: 'todays-specials',
    title: "Today's Specials",
    items: [
      { menuItemId: 'fish-fry', displayName: 'Fish Fry' },
      { menuItemId: 'chicken-alfredo-pasta', displayName: 'Chicken Alfredo Pasta' },
      { menuItemId: 'chicken-achari', displayName: 'Achari Chicken' },
      { menuItemId: 'chicken-puff', displayName: 'Chicken Puff' },
      { menuItemId: 'chicken-cheese-rolls', displayName: 'Chicken Cheese Rolls' },
      { menuItemId: 'chicken-noodles-fry', displayName: 'Chicken Noodles Fry' },
      { menuItemId: 'chicken-manchurian', displayName: 'Chicken Manchurian' },
      { menuItemId: 'chicken-65', displayName: 'Chicken 65' },
      { menuItemId: 'mirchi-fry', displayName: 'Mirchi Fry' },
      { menuItemId: 'fish-sticks', displayName: 'Fish Sticks' },
      { menuItemId: 'potato-tots', displayName: 'Potato Tots (Kids Special)' },
    ],
  },
  {
    id: 'breads',
    title: 'Breads',
    items: [{ menuItemId: 'butter-naan', displayName: 'Butter Naan' }],
  },
  {
    id: 'desserts',
    title: 'Desserts',
    items: [{ menuItemId: 'mango-malai', displayName: 'Mango Malai' }],
  },
  {
    id: 'drinks',
    title: 'Drinks',
    items: [
      { menuItemId: 'orange-juice', displayName: 'Orange Juice' },
      { menuItemId: 'pinacolada', displayName: 'Pinacolada' },
      { menuItemId: 'lemonade', displayName: 'Lemonade' },
      { menuItemId: 'water', displayName: 'Water' },
    ],
  },
] as const

export type BuffetSectionId = (typeof BUFFET_SECTIONS)[number]['id'] | 'other'

export type BuffetLayoutItem = (typeof BUFFET_SECTIONS)[number]['items'][number]

const layoutItemById = new Map<string, BuffetLayoutItem & { sectionId: BuffetSectionId }>()
for (const section of BUFFET_SECTIONS) {
  for (const item of section.items) {
    layoutItemById.set(item.menuItemId, { ...item, sectionId: section.id })
  }
}

export function getBuffetLayoutItem(menuItemId: string) {
  return layoutItemById.get(menuItemId)
}

export function getBuffetSectionId(menuItemId: string): BuffetSectionId {
  return layoutItemById.get(menuItemId)?.sectionId ?? 'other'
}

export function getBuffetDisplayName(menuItemId: string, fallbackName: string): string {
  return layoutItemById.get(menuItemId)?.displayName ?? fallbackName
}
