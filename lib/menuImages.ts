/**
 * Resolves food photography URLs for menu items.
 * Curated Hyderabadi / Indian dish photos keyed by menu item id.
 * Regenerate with: node scripts/buildMenuImages.mjs
 */

import type { MenuItem } from '../types/menu'

/** Bump when restaurant photos change — busts browser/CDN cache for /assets/menu/*.jpg */
const LOCAL_DISH_IMAGE_VERSION = '20260628'

/** Restaurant-owned dish photos served from public/assets/menu/ (web) and bundled assets (native). */
const LOCAL_DISH_IMAGE_URLS: Record<string, string> = {
  'boneless-chicken-dum-biryani': '/assets/menu/boneless-chicken-dum-biryani.jpg',
  'butter-chicken': '/assets/menu/butter-chicken.jpg',
  'butter-naan': '/assets/menu/butter-naan.jpg',
  'chana-masala': '/assets/menu/chana-masala.jpg',
  'chicken-65': '/assets/menu/chicken-65.jpg',
  'chicken-65-biryani': '/assets/menu/chicken-65-biryani.jpg',
  'chicken-bhuna': '/assets/menu/chicken-bhuna.jpg',
  'chicken-karahi': '/assets/menu/chicken-karahi.jpg',
  'chicken-lollipop': '/assets/menu/chicken-lollipop.jpg',
  'chicken-majestic': '/assets/menu/chicken-majestic.jpg',
  'chicken-manchurian': '/assets/menu/chicken-manchurian.jpg',
  'chicken-nuggets': '/assets/menu/chicken-nuggets.jpg',
  'chicken-pakora': '/assets/menu/chicken-pakora.jpg',
  'chicken-reshmi-kabab': '/assets/menu/chicken-reshmi-kabab.jpg',
  'chicken-saag': '/assets/menu/chicken-saag.jpg',
  'chicken-tandoori': '/assets/menu/chicken-tandoori.jpg',
  'chicken-tangdi-kabab': '/assets/menu/chicken-tangdi-kabab.jpg',
  'chicken-tikka': '/assets/menu/chicken-tikka.jpg',
  'chicken-tikka-masala': '/assets/menu/chicken-tikka-masala.jpg',
  'chilli-chicken': '/assets/menu/chilli-chicken.jpg',
  'chilli-gobi': '/assets/menu/chilli-gobi.jpg',
  'chilli-paneer': '/assets/menu/chilli-paneer.jpg',
  'egg-biryani': '/assets/menu/egg-biryani.jpg',
  'fish-65': '/assets/menu/fish-65.jpg',
  'fish-karahi': '/assets/menu/fish-karahi.jpg',
  'fish-majestic': '/assets/menu/fish-majestic.jpg',
  'fish-manchurian': '/assets/menu/fish-manchurian.jpg',
  'fish-pakora': '/assets/menu/fish-pakora.jpg',
  'fish-saag': '/assets/menu/fish-saag.jpg',
  'garlic-naan': '/assets/menu/garlic-naan.jpg',
  'gobi-65': '/assets/menu/gobi-65.jpg',
  'gobi-manchurian': '/assets/menu/gobi-manchurian.jpg',
  'gulab-jamun': '/assets/menu/gulab-jamun.jpg',
  'hyderabadi-chicken-dum-biryani': '/assets/menu/hyderabadi-chicken-dum-biryani.jpg',
  'hyderabadi-goat-dum-biryani': '/assets/menu/hyderabadi-goat-dum-biryani.jpg',
  'kaddu-ki-kheer': '/assets/menu/kaddu-ki-kheer.jpg',
  'kaser-rabdi': '/assets/menu/kaser-rabdi.jpg',
  'lamb-achari': '/assets/menu/lamb-achari.jpg',
  'lamb-bhuna': '/assets/menu/lamb-bhuna.jpg',
  'lamb-karahi': '/assets/menu/lamb-karahi.jpg',
  'lamb-saag': '/assets/menu/lamb-saag.jpg',
  'mix-veg-appetizer': '/assets/menu/mix-veg-appetizer.jpg',
  'mix-veg-curry': '/assets/menu/mix-veg-curry.jpg',
  'mixed-tandoori-grill': '/assets/menu/mixed-tandoori-grill.jpg',
  'mutton-haleem': '/assets/menu/mutton-haleem.jpg',
  'mutton-marag': '/assets/menu/mutton-marag.jpg',
  'naan': '/assets/menu/naan.jpg',
  'onion-bhajee': '/assets/menu/onion-bhajee.jpg',
  'onion-palak-pakora': '/assets/menu/onion-palak-pakora.jpg',
  'paneer-65': '/assets/menu/paneer-65.jpg',
  'paneer-dum-biryani': '/assets/menu/paneer-dum-biryani.jpg',
  'paneer-karahi': '/assets/menu/paneer-karahi.jpg',
  'paneer-manchurian': '/assets/menu/paneer-manchurian.jpg',
  'paneer-tandoori': '/assets/menu/paneer-tandoori.jpg',
  'paneer-tikka-masala': '/assets/menu/paneer-tikka-masala.jpg',
  'ras-malai': '/assets/menu/ras-malai.jpg',
  'roti': '/assets/menu/roti.jpg',
  'saag-dal': '/assets/menu/saag-dal.jpg',
  'saag-palak-paneer': '/assets/menu/saag-palak-paneer.jpg',
  'shrimp-65': '/assets/menu/shrimp-65.jpg',
  'shrimp-bhuna': '/assets/menu/shrimp-bhuna.jpg',
  'shrimp-lollipop': '/assets/menu/shrimp-lollipop.jpg',
  'shrimp-majestic': '/assets/menu/shrimp-majestic.jpg',
  'shrimp-pakora': '/assets/menu/shrimp-pakora.jpg',
  'shrimp-saag': '/assets/menu/shrimp-saag.jpg',
  'sunrise-pudding': '/assets/menu/sunrise-pudding.jpg',
  'talawa-gosht': '/assets/menu/talawa-gosht.jpg',
  'tandoori-veggie-shawarma': '/assets/menu/tandoori-veggie-shawarma.jpg',
  'tiranga-kabab': '/assets/menu/tiranga-kabab.jpg',
  'veg-dum-biryani': '/assets/menu/veg-dum-biryani.jpg',
  'veg-samosa': '/assets/menu/veg-samosa.jpg',
  'water': '/assets/menu/water.jpg',
}

function getLocalDishImageUrl(id: string): string | null {
  const path = LOCAL_DISH_IMAGE_URLS[id]
  if (!path) return null
  return `${path}?v=${LOCAL_DISH_IMAGE_VERSION}`
}

export function resolveMenuItemImage(
  item: Pick<MenuItem, 'id' | 'name' | 'category' | 'imageURL'>,
): string {
  if (hasLocalDishImage(item.id)) {
    return getDishImageUrl(item.id, item.name, item.category)
  }
  return item.imageURL || getDishImageUrl(item.id, item.name, item.category)
}

export function hasLocalDishImage(id: string): boolean {
  return id in LOCAL_DISH_IMAGE_URLS
}

const CATEGORY_FALLBACKS: Record<string, string[]> = {
  biryani: [
    'https://images.unsplash.com/photo-1691171047312-d809eccef46d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631515243349-df9a718c0a88?w=800&q=80&auto=format&fit=crop',
  ],
  'veg-appetizers': [
    'https://images.unsplash.com/photo-1601050690597-df0565f95450?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1732519970445-8f2d6998961f?w=800&q=80&auto=format&fit=crop',
  ],
  'non-veg-appetizers': [
    'https://images.unsplash.com/photo-1598016717029-026340d417d4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80&auto=format&fit=crop',
  ],
  'veg-curries': [
    'https://images.unsplash.com/photo-1585937421612-70a008592f82?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800&q=80&auto=format&fit=crop',
  ],
  'non-veg-curries': [
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop',
  ],
  sizzlers: [
    'https://images.unsplash.com/photo-1727280376746-b89107a5b0df?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop',
  ],
  'chef-specials': [
    'https://images.unsplash.com/photo-1630409349197-b733a524b24e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1694579740719-0e601c5d2437?w=800&q=80&auto=format&fit=crop',
  ],
  'weekend-specials': [
    'https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1691171047312-d809eccef46d?w=800&q=80&auto=format&fit=crop',
  ],
  shawarma: [
    'https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529006557810-274b9b2c73cd?w=800&q=80&auto=format&fit=crop',
  ],
  chinese: [
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80&auto=format&fit=crop',
  ],
  breads: [
    'https://images.unsplash.com/photo-1697155406014-04dc649b0953?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1626074353762-517a4e3926e9?w=800&q=80&auto=format&fit=crop',
  ],
  'soups-salads': [
    'https://images.unsplash.com/photo-1605909388460-74ec8b204127?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1667657682263-86e924b34fd9?w=800&q=80&auto=format&fit=crop',
  ],
  desserts: [
    'https://images.unsplash.com/photo-1703763253190-4af44c87a23e?w=800&q=80&auto=format&fit=crop',
  ],
  drinks: [
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop',
  ],
}

/** Curated photo URLs keyed by menu item id (title-searched Hyderabadi / Indian food photography) */
export const DISH_IMAGE_URLS: Record<string, string> = {
  'veg-dum-biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80&auto=format&fit=crop', // Vegetable Dum Biryani
  'egg-biryani': 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=800&q=80&auto=format&fit=crop', // Egg Biryani
  'hyderabadi-chicken-dum-biryani': LOCAL_DISH_IMAGE_URLS['hyderabadi-chicken-dum-biryani'], // Hyderabadi Chicken Dum Biryani
  'paneer-dum-biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80&auto=format&fit=crop', // Paneer Dum Biryani
  'boneless-chicken-dum-biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80&auto=format&fit=crop', // Boneless Chicken Dum Biryani
  'chicken-65-biryani': 'https://images.unsplash.com/photo-1708184528306-f75a0a5118ee?w=800&q=80&auto=format&fit=crop', // Chicken 65 Biryani
  'hyderabadi-goat-dum-biryani': 'https://images.unsplash.com/photo-1691171047312-d809eccef46d?w=800&q=80&auto=format&fit=crop', // Hyderabadi Goat Dum Biryani
  'veg-samosa': 'https://www.themealdb.com/images/media/meals/1529444113.jpg', // Veg Samosa (2 Pieces)
  'veg-pakora': 'https://images.unsplash.com/photo-1631788012442-633d4f91ad31?w=800&q=80&auto=format&fit=crop', // Veg Pakora
  'onion-palak-pakora': 'https://images.unsplash.com/photo-1651427954346-99ae402f1a8f?w=800&q=80&auto=format&fit=crop', // Onion & Palak Pakora
  'french-fries': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&q=80&auto=format&fit=crop', // French Fries
  'onion-bhajee': 'https://images.unsplash.com/photo-1582801206260-5c2be06b832d?w=800&q=80&auto=format&fit=crop', // Onion Bhajee
  'samosa-chaat': 'https://images.unsplash.com/photo-1732519970445-8f2d6998961f?w=800&q=80&auto=format&fit=crop', // Samosa Chaat
  'mix-veg-appetizer': 'https://images.unsplash.com/photo-1772795682257-ccb3ac896e4a?w=800&q=80&auto=format&fit=crop', // Mix Veg. Appetizer
  'gobi-manchurian': 'https://images.unsplash.com/photo-1676976197084-a7b35e0d2537?w=800&q=80&auto=format&fit=crop', // Gobi Manchurian
  'chilli-gobi': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80&auto=format&fit=crop', // Chili Gobi
  'gobi-65': 'https://images.unsplash.com/photo-1585937421612-70a008592f82?w=800&q=80&auto=format&fit=crop', // Gobi 65
  'chilli-paneer': 'https://images.unsplash.com/photo-1690401767645-595de0e0e5f8?w=800&q=80&auto=format&fit=crop', // Chilli Paneer
  'paneer-manchurian': 'https://images.unsplash.com/photo-1690401767645-595de0e0e5f8?w=800&q=80&auto=format&fit=crop', // Paneer Manchurian
  'paneer-65': 'https://images.unsplash.com/photo-1642821369314-100fece91d3c?w=800&q=80&auto=format&fit=crop', // Paneer 65
  'paneer-pakora': 'https://images.unsplash.com/photo-1642821369314-100fece91d3c?w=800&q=80&auto=format&fit=crop', // Paneer Pakora
  'chicken-pakora': 'https://images.unsplash.com/photo-1566918214014-a3b3e0132267?w=800&q=80&auto=format&fit=crop', // Chicken Pakora
  'chicken-nuggets': 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=800&q=80&auto=format&fit=crop', // Chicken Nuggets
  'fish-pakora': 'https://images.unsplash.com/photo-1666190091191-0cd0c5c8c5b5?w=800&q=80&auto=format&fit=crop', // Fish Pakora
  'shrimp-pakora': 'https://images.unsplash.com/photo-1650143987591-8e2d4231a8d6?w=800&q=80&auto=format&fit=crop', // Shrimp Pakora
  'chicken-65': 'https://images.unsplash.com/photo-1598016717029-026340d417d4?w=800&q=80&auto=format&fit=crop', // Chicken 65
  'fish-65': 'https://images.unsplash.com/photo-1760559468250-921f6b43dc61?w=800&q=80&auto=format&fit=crop', // Fish 65
  'shrimp-65': 'https://images.unsplash.com/photo-1691170979035-27e5ec943205?w=800&q=80&auto=format&fit=crop', // Shrimp 65
  'chicken-manchurian': 'https://images.unsplash.com/photo-1623689048105-a17b1e1936b8?w=800&q=80&auto=format&fit=crop', // Chicken Manchurian
  'fish-manchurian': 'https://images.unsplash.com/photo-1676976197084-a7b35e0d2537?w=800&q=80&auto=format&fit=crop', // Fish Manchurian
  'shrimp-manchurian': 'https://images.unsplash.com/photo-1599655345131-6eb73b81d8d6?w=800&q=80&auto=format&fit=crop', // Shrimp Manchurian
  'chilli-chicken': 'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop', // Chilli Chicken
  'fish-chilli': 'https://images.unsplash.com/photo-1765265432611-17d3f2da2d5d?w=800&q=80&auto=format&fit=crop', // Chilli Fish
  'shrimp-chilli': 'https://images.unsplash.com/photo-1599655345131-6eb73b81d8d6?w=800&q=80&auto=format&fit=crop', // Chilli Shrimp
  'chicken-lollipop': 'https://images.unsplash.com/photo-1766589221509-61951995e435?w=800&q=80&auto=format&fit=crop', // Chicken Lollipop
  'fish-lollipop': 'https://images.unsplash.com/photo-1626253836448-e2376678c191?w=800&q=80&auto=format&fit=crop', // Fish Lollipop
  'shrimp-lollipop': 'https://images.unsplash.com/photo-1688084468401-4938b073aef2?w=800&q=80&auto=format&fit=crop', // Shrimp Lollipop
  'chicken-majestic': 'https://images.unsplash.com/photo-1765827082021-a1b864eb7c7e?w=800&q=80&auto=format&fit=crop', // Chicken Majestic
  'fish-majestic': 'https://images.unsplash.com/photo-1727273200824-7bea21cff00e?w=800&q=80&auto=format&fit=crop', // Fish Majestic
  'shrimp-majestic': 'https://images.unsplash.com/photo-1691171047439-4b39b58b4766?w=800&q=80&auto=format&fit=crop', // Shrimp Majestic
  'talawa-gosht': 'https://images.unsplash.com/photo-1751618684794-2e9a411b317c?w=800&q=80&auto=format&fit=crop', // Talawa Gosht (Goat Meat Fry)
  'mixed-vegetable-curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop', // Mixed Vegetable Curry
  'chana-masala': 'https://images.unsplash.com/photo-1587033649773-5c231faa21e3?w=800&q=80&auto=format&fit=crop', // Chana Masala
  'tarka-dal': 'https://images.unsplash.com/photo-1626500154744-e4b394ffea16?w=800&q=80&auto=format&fit=crop', // Tarka Dal
  'white-rice': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&q=80&auto=format&fit=crop', // White Rice
  'bhindi-masala': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80&auto=format&fit=crop', // Bhindi Masala
  'saag-dal': 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800&q=80&auto=format&fit=crop', // Saag Dal
  'aloo-gobi': 'https://images.unsplash.com/photo-1652545296893-ff9227b3512e?w=800&q=80&auto=format&fit=crop', // Aloo Gobi
  'saag-palak-paneer': 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800&q=80&auto=format&fit=crop', // Saag / Palak Paneer
  'paneer-karahi': 'https://images.unsplash.com/photo-1585937421612-70a008592f82?w=800&q=80&auto=format&fit=crop', // Paneer Karahi
  'paneer-khurma': 'https://images.unsplash.com/photo-1696950168461-4e6d40aa5a06?w=800&q=80&auto=format&fit=crop', // Paneer Khurma
  'matar-paneer': 'https://www.themealdb.com/images/media/meals/xxpqsy1511452222.jpg', // Matar Paneer
  'vegetable-khurma': 'https://images.unsplash.com/photo-1696950168461-4e6d40aa5a06?w=800&q=80&auto=format&fit=crop', // Vegetable Khurma
  'vegetable-masala': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80&auto=format&fit=crop', // Vegetable Masala
  'mix-veg-curry': 'https://images.unsplash.com/photo-1683533738338-19b9a22c6405?w=800&q=80&auto=format&fit=crop', // Mix Veg Curry
  'paneer-tikka-masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80&auto=format&fit=crop', // Paneer Tikka Masala
  'butter-chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80&auto=format&fit=crop', // Butter Chicken
  'chicken-tikka-masala': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80&auto=format&fit=crop', // Chicken Tikka Masala
  'lamb-tikka-masala': 'https://images.unsplash.com/photo-1545247181-516773cae754?w=800&q=80&auto=format&fit=crop', // Lamb/Goat Tikka Masala
  'shrimp-tikka-masala': 'https://images.unsplash.com/photo-1708782341807-ed35fc16b4ea?w=800&q=80&auto=format&fit=crop', // Shrimp Tikka Masala
  'fish-tikka-masala': 'https://images.unsplash.com/photo-1626253836448-e2376678c191?w=800&q=80&auto=format&fit=crop', // Fish Tikka Masala
  'chicken-karahi': 'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop', // Chicken Karahi
  'lamb-karahi': 'https://images.unsplash.com/photo-1652545296893-ff9227b3512e?w=800&q=80&auto=format&fit=crop', // Lamb/Goat Karahi
  'shrimp-karahi': 'https://images.unsplash.com/photo-1683533738338-19b9a22c6405?w=800&q=80&auto=format&fit=crop', // Shrimp Karahi
  'fish-karahi': 'https://images.unsplash.com/photo-1696950169364-173f61adbf95?w=800&q=80&auto=format&fit=crop', // Fish Karahi
  'chicken-achari': 'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop', // Chicken Achari
  'lamb-achari': 'https://images.unsplash.com/photo-1652545296893-ff9227b3512e?w=800&q=80&auto=format&fit=crop', // Lamb/Goat Achari
  'shrimp-achari': 'https://images.unsplash.com/photo-1708782341807-ed35fc16b4ea?w=800&q=80&auto=format&fit=crop', // Shrimp Achari
  'fish-achari': 'https://images.unsplash.com/photo-1710091691780-c7eb0dc50cf8?w=800&q=80&auto=format&fit=crop', // Fish Achari
  'chicken-saag': 'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop', // Chicken Saag / Palak
  'lamb-saag': 'https://images.unsplash.com/photo-1657257974728-245a37db588e?w=800&q=80&auto=format&fit=crop', // Lamb/Goat Saag / Palak
  'shrimp-saag': 'https://images.unsplash.com/photo-1504309250229-4f08315f3b5c?w=800&q=80&auto=format&fit=crop', // Shrimp Saag / Palak
  'fish-saag': 'https://images.unsplash.com/photo-1634731201932-9bd92839bea2?w=800&q=80&auto=format&fit=crop', // Fish Saag / Palak
  'chicken-bhuna': 'https://images.unsplash.com/photo-1574484286798-0a2e9a43a48f?w=800&q=80&auto=format&fit=crop', // Chicken Bhuna
  'lamb-bhuna': 'https://images.unsplash.com/photo-1559203244-78de52adba0e?w=800&q=80&auto=format&fit=crop', // Lamb/Goat Bhuna
  'shrimp-bhuna': 'https://images.unsplash.com/photo-1627703567676-baf986fc608a?w=800&q=80&auto=format&fit=crop', // Shrimp Bhuna
  'fish-bhuna': 'https://images.unsplash.com/photo-1696950169364-173f61adbf95?w=800&q=80&auto=format&fit=crop', // Fish Bhuna
  'chicken-vindaloo': 'https://images.unsplash.com/photo-1694579740719-0e601c5d2437?w=800&q=80&auto=format&fit=crop', // Chicken Vindaloo
  'lamb-vindaloo': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&auto=format&fit=crop', // Lamb/Goat Vindaloo
  'shrimp-vindaloo': 'https://images.unsplash.com/photo-1585040867721-72cb8348b986?w=800&q=80&auto=format&fit=crop', // Shrimp Vindaloo
  'fish-vindaloo': 'https://images.unsplash.com/photo-1585040867721-72cb8348b986?w=800&q=80&auto=format&fit=crop', // Fish Vindaloo
  'chicken-tandoori': 'https://images.unsplash.com/photo-1727280376746-b89107a5b0df?w=800&q=80&auto=format&fit=crop', // Chicken Tandoori
  'chicken-tangdi-kabab': 'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop', // Chicken Tangdi Kabab
  'chicken-tikka': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop', // Chicken Tikka
  'chicken-reshmi-kabab': 'https://images.unsplash.com/photo-1727280376746-b89107a5b0df?w=800&q=80&auto=format&fit=crop', // Chicken Reshmi Kabab
  'tiranga-kabab': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop', // Tiranga Kabab
  'paneer-tandoori': 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800&q=80&auto=format&fit=crop', // Paneer Tandoori
  'mutton-reshmi-kabab': 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=800&q=80&auto=format&fit=crop', // Mutton Reshmi Kabab
  'fish-tandoori': 'https://images.unsplash.com/photo-1665401015549-712c0dc5ef85?w=800&q=80&auto=format&fit=crop', // Fish Tandoori
  'mixed-tandoori-grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop', // Mixed Tandoori Grill
  'shrimp-tandoori': 'https://images.unsplash.com/photo-1687020835890-b0b8c6a04613?w=800&q=80&auto=format&fit=crop', // Shrimp Tandoori
  'naan': 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?w=800&q=80&auto=format&fit=crop', // Naan
  'butter-naan': 'https://images.unsplash.com/photo-1772730064970-a7b2735c93b9?w=800&q=80&auto=format&fit=crop', // Butter Naan
  'garlic-naan': 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?w=800&q=80&auto=format&fit=crop', // Garlic Naan
  'onion-garlic-naan': 'https://images.unsplash.com/photo-1559561724-4ea348cd867f?w=800&q=80&auto=format&fit=crop', // Onion Garlic Naan
  'roti': 'https://www.themealdb.com/images/media/meals/hx335q1619789561.jpg', // Roti
  'chapati': 'https://images.unsplash.com/photo-1633442496018-6872fbfbbcc7?w=800&q=80&auto=format&fit=crop', // Chapati
  'aloo-paratha': 'https://images.unsplash.com/photo-1707424963059-6a7a559cae28?w=800&q=80&auto=format&fit=crop', // Aloo Paratha
  'daal-soup': 'https://images.unsplash.com/photo-1605909388460-74ec8b204127?w=800&q=80&auto=format&fit=crop', // Daal Soup
  'mixed-house-salad': 'https://images.unsplash.com/photo-1667657682263-86e924b34fd9?w=800&q=80&auto=format&fit=crop', // Mixed House Salad
  'mulligatawny-soup': 'https://images.unsplash.com/photo-1613844237701-8f3664fc2eff?w=800&q=80&auto=format&fit=crop', // Mulligatawny Soup
  'chicken-soup': 'https://www.themealdb.com/images/media/meals/7kb44y1763589084.jpg', // Chicken Soup
  'chicken-tikka-salad': 'https://images.unsplash.com/photo-1666599028424-e316d4e34aa6?w=800&q=80&auto=format&fit=crop', // Chicken Tikka Salad
  'tandoori-veggie-shawarma': 'https://images.unsplash.com/photo-1697155836250-e3ba3a24fbd5?w=800&q=80&auto=format&fit=crop', // Tandoori Veggie Shawarma
  'tandoori-chicken-shawarma': 'https://www.themealdb.com/images/media/meals/hcg6l91763596970.jpg', // Tandoori Chicken Shawarma
  'tandoori-lamb-shawarma': 'https://images.unsplash.com/photo-1719282432006-c6ebb5b8b222?w=800&q=80&auto=format&fit=crop', // Tandoori Lamb Shawarma
  'schezwan-veg-fried-rice': 'https://www.themealdb.com/images/media/meals/wuyd2h1765655837.jpg', // Schezwan Vegetable Fried Rice
  'chicken-fried-rice': 'https://www.themealdb.com/images/media/meals/wuyd2h1765655837.jpg', // Chicken Fried Rice
  'lagan-dum-chicken': 'https://images.unsplash.com/photo-1694579740719-0e601c5d2437?w=800&q=80&auto=format&fit=crop', // Lagan / Dum Chicken
  'malai-chicken': 'https://images.unsplash.com/photo-1603496987351-f84a3ba5ec85?w=800&q=80&auto=format&fit=crop', // Malai Chicken
  'malai-mutton': 'https://images.unsplash.com/photo-1606843046080-45bf7a23c39f?w=800&q=80&auto=format&fit=crop', // Malai Mutton
  'haryali-chicken': 'https://images.unsplash.com/photo-1634612778224-8d33d9d66c61?w=800&q=80&auto=format&fit=crop', // Haryali Chicken
  'mutton-marag': 'https://images.unsplash.com/photo-1691171047323-37acec85fc84?w=800&q=80&auto=format&fit=crop', // Mutton Marag
  'mutton-haleem': 'https://images.unsplash.com/photo-1630409349197-b733a524b24e?w=800&q=80&auto=format&fit=crop', // Mutton Haleem
  'chicken-mandi': 'https://www.themealdb.com/images/media/meals/er4d081765186828.jpg', // Chicken Mandi
  'mutton-mandi': 'https://images.unsplash.com/photo-1696950170773-db0bf33ca0ca?w=800&q=80&auto=format&fit=crop', // Mutton Mandi
  'paya-nihari': 'https://images.unsplash.com/photo-1640542509430-f529fdfce835?w=800&q=80&auto=format&fit=crop', // Paya Nihari
  'sufiyani-biryani': 'https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?w=800&q=80&auto=format&fit=crop', // Sufiyani Biryani
  'mango-malai': 'https://images.unsplash.com/photo-1703763253190-4af44c87a23e?w=800&q=80&auto=format&fit=crop', // Mango Malai
  'orange-juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop', // Orange Juice
  'pinacolada': 'https://images.unsplash.com/photo-1607644536940-6c300b5784c5?w=800&q=80&auto=format&fit=crop', // Pinacolada
  'lemonade': 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=800&q=80&auto=format&fit=crop', // Lemonade
  'water': 'https://images.unsplash.com/photo-1553531768-88af16561c0f?w=800&q=80&auto=format&fit=crop', // Water
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function cleanDishName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSearchQueries(name: string): string[] {
  const clean = cleanDishName(name)
  const queries = [clean]
  if (/hyderabadi/i.test(clean)) {
    queries.push(clean.replace(/hyderabadi\s*/i, '').trim())
  }
  if (/biryani|haleem|nihari|mandi|majestic|gosht|marag|sufiyani|65/i.test(clean) && !/hyderabadi/i.test(clean)) {
    queries.push(`Hyderabadi ${clean}`)
  }
  if (/lamb\/goat/i.test(clean)) {
    queries.push(clean.replace(/lamb\/goat/i, 'mutton').trim())
  }
  const words = clean.split(' ')
  if (words.length > 3) queries.push(words.slice(0, 3).join(' '))
  if (words.length > 2) queries.push(words.slice(-2).join(' '))
  return [...new Set(queries.filter(Boolean))]
}

function toStableUnsplashUrl(url: string): string | null {
  const match = url.match(/images\.unsplash\.com\/(photo-[^?]+)/)
  if (!match) return null
  return `https://images.unsplash.com/${match[1]}?w=800&q=80&auto=format&fit=crop`
}

/** Synchronous URL — local assets, then id map, then category pool by name hash */
export function getDishImageUrl(id: string, name: string, category: string): string {
  const local = getLocalDishImageUrl(id)
  if (local) return local

  if (DISH_IMAGE_URLS[id]) return DISH_IMAGE_URLS[id]

  const pool = CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS.biryani
  return pool[hashString(name) % pool.length]
}

async function searchMealDB(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
    )
    const data = (await res.json()) as { meals?: { strMealThumb: string }[] }
    return data.meals?.[0]?.strMealThumb ?? null
  } catch {
    return null
  }
}

async function searchUnsplash(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=5&page=1`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: { urls?: { regular?: string; small?: string }; description?: string; alt_description?: string }[]
    }
    for (const photo of data.results ?? []) {
      const url = photo.urls?.regular ?? photo.urls?.small
      const stable = url ? toStableUnsplashUrl(url) : null
      if (!stable) continue
      const desc = `${photo.description ?? ''} ${photo.alt_description ?? ''}`.toLowerCase()
      if (/portrait|person|people|face|landscape|mountain|city|building/i.test(desc)) continue
      return stable
    }
  } catch {
    // fall through
  }
  return null
}

/** For seed scripts — search by menu title via TheMealDB then Unsplash */
export async function fetchDishImageUrl(name: string, category: string, id?: string): Promise<string> {
  if (id && DISH_IMAGE_URLS[id]) return DISH_IMAGE_URLS[id]

  for (const query of buildSearchQueries(name)) {
    const meal = await searchMealDB(query)
    if (meal) return meal
  }
  for (const query of buildSearchQueries(name)) {
    const photo = await searchUnsplash(query)
    if (photo) return photo
  }
  return getDishImageUrl(id ?? '', name, category)
}

export function withMenuImages<T extends { id: string; name: string; category: string; imageURL: string }>(
  items: T[],
): T[] {
  return items.map((item) => ({
    ...item,
    imageURL: resolveMenuItemImage(item),
  }))
}
