/**
 * Seed Firestore with location, buffet config, and menu items.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   npm run seed
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import * as dotenv from 'dotenv'
import { STATIC_MENU } from '../constants/staticMenu'
import { STATIC_LOCATIONS, STATIC_LOCATION_IDS } from '../constants/staticLocations'
import { createDefaultBuffetDishes } from '../lib/buffetLayout'
import { REMOVED_MENU_IDS } from '../lib/menuMerge'

dotenv.config()

const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  'shadab-5c64e'

if (!getApps().length) {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))
    initializeApp({ credential: cert(serviceAccount), projectId })
  } else {
    initializeApp({ projectId })
  }
}

const db = getFirestore()
const LOC = STATIC_LOCATION_IDS

// ─── helpers ────────────────────────────────────────────────────────────────
const ts = () => FieldValue.serverTimestamp()
function item(
  id: string,
  name: string,
  description: string,
  priceDollars: number,
  category: string,
  opts: Partial<{
    subcategory: string
    isVegetarian: boolean
    isSpicy: boolean
    spiceLevel: 1 | 2 | 3
    allergens: string[]
    calories: number
    tags: string[]
    isBuffetItem: boolean
    imageURL: string
  }> = {},
) {
  return {
    id,
    name,
    description,
    price: Math.round(priceDollars * 100),
    category,
    subcategory: opts.subcategory ?? (opts.isVegetarian ? 'veg' : 'non-veg'),
    imageURL: opts.imageURL ?? '',
    isAvailable: true,
    isHalal: true,
    isVegetarian: opts.isVegetarian ?? false,
    isSpicy: opts.isSpicy ?? false,
    spiceLevel: opts.spiceLevel ?? 1,
    allergens: opts.allergens ?? [],
    calories: opts.calories ?? 0,
    tags: opts.tags ?? [],
    isBuffetItem: opts.isBuffetItem ?? false,
    rating: 0,
    reviewCount: 0,
    locationIds: [...LOC],
  }
}

// ─── MENU DATA ───────────────────────────────────────────────────────────────
const menuItems = [

  // ── VEG APPETIZERS ──────────────────────────────────────────────────────
  item('veg-samosa', 'Veg Samosa (2 Pieces)', 'Crispy fried filo pastry triangles filled with spiced potatoes, peas, and vegetables, a classic Indian appetizer.', 4.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'], tags: ['bestseller'], isBuffetItem: true }),

  item('veg-pakora', 'Veg Pakora', 'Assorted vegetables coated in a crispy gram flour batter, seasoned with aromatic spices and herbs.', 5.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'], isBuffetItem: true }),

  item('onion-bhajee', 'Onion Bhajee', 'Thinly sliced onions coated in a spiced batter and fried until golden and crispy, a popular and flavorful appetizer.', 5.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'] }),

  item('samosa-chaat', 'Samosa Chaat', 'Samosas are smashed and broken, and served with chole (chana masala) and sweet, spicy, tangy, and crispy toppings.', 9.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'], tags: ['bestseller'], isSpicy: true, spiceLevel: 2 }),

  item('mix-veg-appetizer', 'Mix Veg. Appetizer', 'Taste the mixture of Veg Samosa, Veg Pakora and Onion Bhajee.', 10.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'] }),

  item('gobi-manchurian', 'Gobi Manchurian', 'Cauliflower florets battered and fried, then sautéed in a soy-sweet sauce made with soy, vinegar, chili, ginger and garlic; a fusion dish that bursts with flavors.', 11.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten', 'soy'], isSpicy: true, spiceLevel: 2 }),

  item('chilli-gobi', 'Chilli Gobi', 'Lightly battered cauliflower florets sautéed in a spicy chilli sauce, a perfect combination of heat and flavor.', 11.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'], isSpicy: true, spiceLevel: 3 }),

  item('gobi-65', 'Gobi 65', "Crispy and spicy cauliflower florets sautéed with our chef's special 65 sauce, a must-try for cauliflower fans.", 11.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['gluten'], isSpicy: true, spiceLevel: 2 }),

  item('chilli-paneer', 'Chilli Paneer', 'Soft and succulent Indian cottage cheese cubes sautéed in a spicy chilli sauce, a fiery appetizer that packs a punch.', 11.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['dairy'], isSpicy: true, spiceLevel: 2 }),

  item('paneer-manchurian', 'Paneer Manchurian', 'Indian cottage cheese cubes sautéed in a tangy-sweet Manchurian sauce, a popular Indo-Chinese fusion dish with a unique flavor profile.', 12.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['dairy', 'gluten'] }),

  item('paneer-65', 'Paneer 65', "Soft and creamy Indian cottage cheese cubes sautéed with our chef's special 65 sauce, a flavorful and addictive appetizer.", 12.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['dairy'], isSpicy: true, spiceLevel: 2 }),

  item('paneer-pakora', 'Paneer Pakora', 'Soft and crispy Indian cottage cheese cubes flavored with ground spices, coated in a chickpea flour batter and deep fried, a delicious and indulgent appetizer.', 12.99, 'veg-appetizers',
    { isVegetarian: true, allergens: ['dairy', 'gluten'] }),

  // ── NON-VEG APPETIZERS ────────────────────────────────────────────────
  item('chicken-pakora', 'Chicken Pakora', 'Quick Indian appetizer made with gram flour, chicken, and a blend of spices and herbs.', 14.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 2, allergens: ['gluten'], tags: ['bestseller'], isBuffetItem: true }),

  item('chicken-65', 'Chicken 65', 'Chicken coated in a spicy marata marination consists of chilli powder, turmeric, garam masala powder, lemon juice, ginger, garlic, eggs. Rice flour marinated chicken is then deep fried till cooked and crispy. Served as it is or tossed in a spicy sauce.', 14.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 3, allergens: ['eggs', 'gluten'], tags: ['bestseller'], isBuffetItem: true }),

  item('chicken-manchurian', 'Chicken Manchurian', 'Delicious fried chicken in slightly sweet, hot & sour Manchurian sauce.', 14.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 2, allergens: ['gluten', 'soy'] }),

  item('chilli-chicken', 'Chilli Chicken', 'Crispy & flavorful Chilli Chicken, made with chicken marinated in Chinese sauces, fried till crispy, sautéed with onions, peppers & sauces.', 14.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 3, allergens: ['gluten', 'soy'] }),

  item('chicken-lollipop', 'Chicken Lollipop', 'Chicken lollipop is a popular Indo-Chinese appetizer where a trenched chicken drumette is marinated and then batter fried or baked until crisp.', 14.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 2, allergens: ['gluten'], tags: ['bestseller'] }),

  item('chicken-majestic', 'Chicken Majestic', "It looks similar to chicken 65 but it's prepared with a thick yoghurt based sauce that is both spicy and deliciously tangy.", 14.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 2, allergens: ['dairy'] }),

  item('talawa-gosht', 'Talawa Gosht (Goat Meat Fry)', 'Marinated bone-in goat pieces sautéed in a special 65 sauce, a flavorful and spicy dish.', 19.99, 'non-veg-appetizers',
    { isSpicy: true, spiceLevel: 2, tags: ['signature'] }),

  // ── BIRYANI ───────────────────────────────────────────────────────────
  item('veg-dum-biryani', 'Vegetable Dum Biryani', 'Aromatic basmati rice cooked with assorted vegetables & traditional Hyderabadi spices, accompanied by raita.', 11.99, 'biryani',
    { isVegetarian: true, subcategory: 'veg', allergens: ['dairy'], isBuffetItem: true }),

  item('egg-biryani', 'Egg Biryani', 'Boiled eggs cooked in a flavorful Hyderabadi-style sauce and mixed with basmati rice, served with raita.', 12.99, 'biryani',
    { allergens: ['eggs', 'dairy'], isBuffetItem: true }),

  item('hyderabadi-chicken-dum-biryani', 'Hyderabadi Chicken Dum Biryani', 'Tender chicken pieces marinated in homemade spices and cooked with basmati rice, flavored with traditional Hyderabadi spices, served with raita.', 14.99, 'biryani',
    { allergens: ['dairy'], tags: ['bestseller', 'signature'], isBuffetItem: true }),

  item('paneer-dum-biryani', 'Paneer Dum Biryani', 'Spicy cubes of cottage cheese marinated in Hyderabadi-style sauce and cooked with basmati rice, served with raita.', 14.99, 'biryani',
    { isVegetarian: true, allergens: ['dairy'], isBuffetItem: true }),

  item('boneless-chicken-dum-biryani', 'Boneless Chicken Dum Biryani', 'Boneless chicken pieces cooked with traditional Hyderabadi spices and basmati rice, served with raita.', 15.99, 'biryani',
    { allergens: ['dairy'], tags: ['bestseller'] }),

  item('chicken-65-biryani', 'Chicken 65 Biryani', 'Chicken 65 sautéed with basmati rice and Indian spices, served with raita.', 16.99, 'biryani',
    { isSpicy: true, spiceLevel: 2, allergens: ['eggs', 'dairy'], tags: ['bestseller'] }),

  item('hyderabadi-goat-dum-biryani', 'Hyderabadi Goat Dum Biryani', 'Tender pieces of goat cooked with traditional Hyderabadi spices and basmati rice, served with raita. Chef Special.', 19.99, 'biryani',
    { allergens: ['dairy'], tags: ['signature', 'bestseller'] }),

  item('sufiyani-biryani', 'Sufiyani Biryani', "One of the hidden gems of Hyderabadi cuisine. Rich, royal prepared with a concoction of milk, paste of almonds, khoya (mawa) & minimal ghee. No red chillies are used in order to maintain the white colour.", 22.99, 'weekend-specials',
    { allergens: ['dairy', 'nuts'], tags: ['signature'] }),

  // ── SHAWARMA ──────────────────────────────────────────────────────────
  item('tandoori-veggie-shawarma', 'Tandoori Veggie Shawarma', 'Shawarma is prepared teardrop-shaped bread that is freshly baked in a tandoor (traditional Indian clay oven) from thin cuts of seasoned and marinated mix veggies.', 9.99, 'shawarma',
    { isVegetarian: true, allergens: ['gluten'] }),

  item('tandoori-chicken-shawarma', 'Tandoori Chicken Shawarma', 'Shawarma is prepared teardrop-shaped bread that is freshly baked in a tandoor (traditional Indian clay oven) from thin cuts of seasoned and marinated chicken.', 10.99, 'shawarma',
    { allergens: ['gluten'], tags: ['bestseller'] }),

  item('tandoori-lamb-shawarma', 'Tandoori Lamb Shawarma', 'Shawarma is prepared teardrop-shaped bread that is freshly baked in a tandoor (traditional Indian clay oven) from thin cuts of seasoned and marinated lamb.', 11.99, 'shawarma',
    { allergens: ['gluten'] }),

  // ── CHINESE ───────────────────────────────────────────────────────────
  item('schezwan-veg-fried-rice', 'Schezwan Vegetable Fried Rice', 'Wok-tossed basmati rice with fresh vegetables in a spicy Schezwan sauce. Add egg +$2, chicken +$2, fish +$5, shrimp +$5.', 11.99, 'chinese',
    { isVegetarian: true, isSpicy: true, spiceLevel: 2, allergens: ['soy', 'gluten'] }),

  // ── CHEF SPECIALS ─────────────────────────────────────────────────────
  item('lagan-dum-chicken', 'Lagan / Dum Chicken', 'Slow cooked marinated chicken in cashew and poppy gravy. The chicken is marinated in curd/yogurt and spices and later slow cooked which gives a rich colour and texture to the gravy.', 15.99, 'chef-specials',
    { allergens: ['dairy', 'nuts'], tags: ['signature'], isBuffetItem: true }),

  item('malai-chicken', 'Malai Chicken', 'Malai chicken or Malai Mutton is a hugely popular chicken dish with cream, cheese rich, nutty and creamy, saffron and spices.', 15.99, 'chef-specials',
    { allergens: ['dairy'], tags: ['bestseller'], isBuffetItem: true }),

  item('haryali-chicken', 'Haryali Chicken', 'Green chicken curry is a popular dish from the region of Hyderabad. Made up of green chillies, green herbs and spices for the authentic taste.', 15.99, 'chef-specials',
    { isSpicy: true, spiceLevel: 2, isBuffetItem: true }),

  item('mutton-marag', 'Mutton Marag', 'Marag is a soup made with tender mutton attached to bones. It is a spicy, juicy and rich mutton stew or soup.', 17.99, 'chef-specials',
    { isSpicy: true, spiceLevel: 2, tags: ['signature'] }),

  item('mutton-haleem', 'Mutton Haleem', 'A slow-cooked stew composed of meat, lentils, Spices. Ghee and pounded wheat made into a thick paste.', 19.99, 'chef-specials',
    { allergens: ['gluten'], tags: ['signature', 'bestseller'], isBuffetItem: true }),

  // ── WEEKEND SPECIALS ──────────────────────────────────────────────────
  item('chicken-mandi', 'Chicken / Mutton Mandi', "Mandi is Yemen's national dish, native to Hadhramaut province, consisting of lamb or chicken meat, fragrant basmati rice and a mixture of various spices.", 19.99, 'weekend-specials',
    { tags: ['signature'] }),

  item('paya-nihari', 'Paya Nihari', 'Paya Nihari is a stew, usually slow cooked overnight which consist of Goat trotters (Paya) mainly cooked with bone marrow.', 17.99, 'weekend-specials',
    { tags: ['signature'] }),

  // ── VEG CURRIES ───────────────────────────────────────────────────────
  item('mixed-vegetable-curry', 'Mixed Vegetable Curry', 'A delicious mix of vegetables cooked in a traditional Indian onion-tomato gravy.', 12.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('chana-masala', 'Chana Masala', 'Tender chickpeas in a rich tomato-based sauce infused with authentic Indian spices.', 12.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('tarka-dal', 'Tarka Dal', 'A smooth and creamy lentil dish tempered with Indian spices and a smoky char finish.', 12.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('saag-dal', 'Saag Dal', 'A spinach and split pea stew bursting with flavor from ginger, garlic, turmeric, cumin, and coriander.', 12.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('aloo-gobi', 'Aloo Gobi', 'Tender cauliflower and potatoes cooked to perfection in a fragrant blend of Indian spices.', 12.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('saag-palak-paneer', 'Saag / Palak Paneer', 'A spinach curry made with spinach, maize flour, and spices, served with paneer.', 13.99, 'veg-curries',
    { isVegetarian: true, allergens: ['dairy'], isBuffetItem: true }),

  item('paneer-karahi', 'Paneer Karahi', 'Paneer, onions, and green bell pepper cubes cooked in a spicy onion-tomato-based gravy flavored with freshly ground spices.', 13.99, 'veg-curries',
    { isVegetarian: true, allergens: ['dairy'], isSpicy: true, spiceLevel: 2, isBuffetItem: true }),

  item('paneer-pasanda', 'Paneer', 'A creamy, rich, and delicately flavored curry made with paneer, almonds, onions, yogurt, and spices.', 13.99, 'veg-curries',
    { isVegetarian: true, allergens: ['dairy', 'nuts'], isBuffetItem: true }),

  item('matar-paneer', 'Matar Paneer', 'A delicious combination of soft paneer and healthy green peas in a spicy rich tomato-based gravy.', 13.99, 'veg-curries',
    { isVegetarian: true, allergens: ['dairy'], isBuffetItem: true }),

  item('vegetable-khurma', 'Vegetable Khurma', 'Mixed vegetables cooked in a rich and creamy coconut-based gravy.', 13.99, 'veg-curries',
    { isVegetarian: true, allergens: ['nuts'], isBuffetItem: true }),

  item('vegetable-masala', 'Vegetable Masala', 'A flavorful mix of vegetables like potatoes, carrots, peas, and beans cooked with onions and tomatoes, and spices like garam masala, ginger, and garlic powder.', 13.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('mix-veg-coco-curry', 'Mix Veg Coco Curry', 'A mix of vegetables cooked in a creamy coconut curry.', 13.99, 'veg-curries',
    { isVegetarian: true, isBuffetItem: true }),

  item('paneer-tikka-masala', 'Paneer Tikka Masala', 'Soft and succulent paneer in a tangy tomato-based sauce, served with biryani rice.', 14.99, 'veg-curries',
    { isVegetarian: true, allergens: ['dairy'], tags: ['bestseller'], isBuffetItem: true }),

  // ── NON-VEG CURRIES ───────────────────────────────────────────────────
  item('butter-chicken', 'Butter Chicken', 'Butter Chicken also known as Chicken Makhani is a classic Indian dish made by simmering marinated & grilled chicken in a spicy, aromatic, buttery and creamy tomato onion gravy.', 15.99, 'non-veg-curries',
    { allergens: ['dairy'], tags: ['bestseller', 'signature'], isBuffetItem: true }),

  item('chicken-tikka-masala', 'Chicken Tikka Masala', 'Tikka masala is a dish consisting of roasted marinated chicken chunks in a spiced sauce. The sauce is buttery creamy and orange-coloured.', 16.99, 'non-veg-curries',
    { allergens: ['dairy'], tags: ['bestseller'], isBuffetItem: true }),

  item('lamb-tikka-masala', 'Lamb/Goat Tikka Masala', 'Roasted marinated lamb or goat in a creamy, buttery, orange-coloured spiced sauce.', 19.99, 'non-veg-curries',
    { allergens: ['dairy'] }),

  item('chicken-karahi', 'Chicken Karahi', 'A dish typically consisting of a base of onions, garlic, ginger and spices being fried together to form a thick coating sauce.', 16.99, 'non-veg-curries',
    { isSpicy: true, spiceLevel: 2, isBuffetItem: true }),

  item('lamb-karahi', 'Lamb/Goat Karahi', 'Lamb or goat in a thick coating sauce of onions, garlic, ginger and aromatic spices.', 19.99, 'non-veg-curries',
    { isSpicy: true, spiceLevel: 2 }),

  item('chicken-achari', 'Chicken Achari', 'Curry made with ingredients used to make achaar or South Asian pickle giving it a tangy and spicy flavor.', 16.99, 'non-veg-curries',
    { isSpicy: true, spiceLevel: 2, tags: ['signature'] }),

  item('chicken-saag', 'Chicken Saag / Palak', 'Saag is a popular Indian dish consisting of meat in a smooth, creamy and delicious spinach gravy.', 16.99, 'non-veg-curries',
    { allergens: ['dairy'], isBuffetItem: true }),

  item('chicken-bhuna', 'Chicken Bhuna', 'A dish typically consisting of a base of onions, garlic, ginger and spices being fried together to form a thick coating sauce.', 16.99, 'non-veg-curries',
    { isSpicy: true, spiceLevel: 2 }),

  item('chicken-vindaloo', 'Chicken Vindaloo', 'Vindaloo is a popular Indian curry originating from the Goa region. A hot, fiery and tangy dish made with meat, vegetables and plenty of spices.', 16.99, 'non-veg-curries',
    { isSpicy: true, spiceLevel: 3 }),

  // ── SIZZLERS ──────────────────────────────────────────────────────────
  item('chicken-tandoori', 'Chicken Tandoori', 'Tender chicken pieces marinated in yogurt and spices, then roasted in a clay oven to perfection. Served sizzling hot with onions and lemon.', 14.99, 'sizzlers',
    { allergens: ['dairy'], tags: ['bestseller'] }),

  item('chicken-tangdi-kabab', 'Chicken Tangdi Kabab', 'Chicken drumsticks that are marinated in a spiced green herb and gram flour (besan) marinade and oven-grilled.', 17.99, 'sizzlers',
    { allergens: ['gluten', 'dairy'] }),

  item('chick-tikka', 'Chick Tikka', 'Boneless chicken marinated in a blend of yogurt and traditional Hyderabadi spices, then roasted over hot coals. Served sizzling hot with onions and lemon.', 14.99, 'sizzlers',
    { allergens: ['dairy'], tags: ['bestseller'] }),

  item('chicken-reshmi-kabab', 'Chicken Reshmi Kabab', 'Made with boneless chicken, it is cooked by marinating chunks of meat in curd, cream, cashew nut paste, spices and then grilled in tandoor.', 17.99, 'sizzlers',
    { allergens: ['dairy', 'nuts'] }),

  item('tiranga-kabab', 'Tiranga Kabab', 'Mix of Chicken Hariyali, Malai and Red Chicken.', 17.99, 'sizzlers',
    { allergens: ['dairy'] }),

  item('paneer-tandoori', 'Paneer Tandoori', 'Indian cottage cheese marinated in a spicy yogurt mixture and then grilled to perfection in the Tandoor. Served sizzling hot with onions and lemon.', 16.99, 'sizzlers',
    { isVegetarian: true, allergens: ['dairy'] }),

  item('mutton-reshmi-kabab', 'Mutton Reshmi Kabab', 'Made with boneless Lamb/Goat. It is cooked by marinating chunks of meat in curd, cream, cashew nut paste, spices and then grilled in tandoor.', 19.99, 'sizzlers',
    { allergens: ['dairy', 'nuts'] }),

  item('fish-tandoori', 'Fish Tandoori', 'Fresh fish marinated in a tangy Tandoori spice blend, then grilled over hot coals to create a smoky flavor. Served sizzling hot with onions & lemon.', 19.99, 'sizzlers',
    { allergens: ['shellfish'] }),

  item('mixed-tandoori-grill', 'Mixed Tandoori Grill', "Can't decide? Try a combination of Tandoori chicken, chicken tikka and sheek kabab. Served sizzling hot with onions and lemon.", 19.99, 'sizzlers',
    { allergens: ['dairy', 'gluten'], tags: ['bestseller'] }),

  item('shrimp-tandoori', 'Shrimp Tandoori', 'Jumbo shrimp marinated in a blend of yogurt and Indian spices, then grilled to perfection in the Tandoor. Served sizzling hot with onions and lemon.', 19.99, 'sizzlers',
    { allergens: ['dairy', 'shellfish'] }),

  // ── SOUPS & SALADS ────────────────────────────────────────────────────
  item('daal-soup', 'Daal Soup', 'A perfect blend of healthy lentils and fresh vegetables, served with a delicious dressing.', 6.99, 'soups-salads',
    { isVegetarian: true }),

  item('mixed-house-salad', 'Mixed House Salad', 'A refreshing mix of crisp greens, juicy tomatoes, crunchy cucumbers, and more, topped with your favorite dressing.', 6.99, 'soups-salads',
    { isVegetarian: true }),

  item('mulligatawny-soup', 'Mulligatawny Soup', 'A fragrant and flavorful soup, made with Indian spices and creamy coconut milk.', 7.99, 'soups-salads',
    { isVegetarian: true, allergens: ['nuts'] }),

  item('chicken-soup', 'Chicken Soup', 'Soup made from chicken, simmered in water with various Indian spice.', 7.99, 'soups-salads', {}),

  item('chicken-tikka-salad', 'Chicken Tikka Salad', 'Our juicy and tender grilled chicken, paired with fresh greens, crispy veggies, and a zesty dressing. This satisfying salad is a crowd pleaser.', 9.99, 'soups-salads',
    { allergens: ['dairy'] }),

  // ── INDIAN BREADS ─────────────────────────────────────────────────────
  item('naan', 'Naan', 'Classic soft leavened flatbread baked in a tandoor.', 3.99, 'breads',
    { isVegetarian: true, allergens: ['gluten', 'dairy'], isBuffetItem: true }),

  item('butter-naan', 'Butter Naan', 'Soft naan brushed generously with butter straight from the tandoor.', 3.99, 'breads',
    { isVegetarian: true, allergens: ['gluten', 'dairy'], tags: ['bestseller'], isBuffetItem: true }),

  item('garlic-naan', 'Garlic Naan', 'Tandoor-baked naan topped with fresh garlic and butter.', 4.99, 'breads',
    { isVegetarian: true, allergens: ['gluten', 'dairy'], tags: ['bestseller'], isBuffetItem: true }),

  item('onion-garlic-naan', 'Onion Garlic Naan', 'Naan stuffed and topped with caramelized onions and garlic.', 4.99, 'breads',
    { isVegetarian: true, allergens: ['gluten', 'dairy'] }),

  item('roti', 'Roti', 'Thin whole-wheat flatbread baked in a tandoor.', 2.99, 'breads',
    { isVegetarian: true, allergens: ['gluten'], isBuffetItem: true }),

  item('chapati', 'Chapati', 'Soft unleavened whole-wheat flatbread cooked on a tawa.', 2.99, 'breads',
    { isVegetarian: true, allergens: ['gluten'], isBuffetItem: true }),

  item('aloo-paratha', 'Aloo Paratha', 'Flaky whole-wheat flatbread stuffed with spiced mashed potato filling.', 4.99, 'breads',
    { isVegetarian: true, allergens: ['gluten'], tags: ['bestseller'] }),
]

// ─── SEED ────────────────────────────────────────────────────────────────────
async function seed() {
  for (const location of STATIC_LOCATIONS) {
    await db.collection('locations').doc(location.id).set({
      ...location,
      updatedAt: ts(),
      createdAt: ts(),
    })
    console.log(`✓ Location seeded: ${location.name}`)

    await db.collection('buffet').doc(location.id).set({
      locationId: location.id,
      weekdayLunchPrice: 1799,
      weekdayDinnerPrice: 1799,
      weekendLunchPrice: 2499,
      weekendDinnerPrice: 2499,
      lunchStart: '11:30',
      lunchEnd: '15:00',
      dinnerStart: '17:00',
      dinnerEnd: '21:00',
      buffetDays: [0, 1, 2, 3, 4, 5, 6],
      todaysDishes: createDefaultBuffetDishes(STATIC_MENU),
      isLunchActive: false,
      isDinnerActive: false,
      specialNote: 'Lunch Buffet Everyday • 20-30+ Items • Eat All You Want!',
      updatedAt: ts(),
    })
    console.log(`✓ Buffet config seeded: ${location.id}`)
  }

  // Retired menu items (legacy Firestore doc ids)
  for (const id of REMOVED_MENU_IDS) {
    await db.collection('menu').doc(id).delete()
  }

  // Menu items
  let count = 0
  for (const { id, ...data } of menuItems) {
    await db.collection('menu').doc(id).set({
      ...data,
      createdAt: ts(),
      updatedAt: ts(),
    })
    count++
    process.stdout.write(`\r✓ ${count}/${menuItems.length} menu items...`)
  }

  console.log(`\n\n✅ Done! Seeded ${count} menu items, ${STATIC_LOCATIONS.length} locations, ${STATIC_LOCATIONS.length} buffet configs.`)
  process.exit(0)
}

seed().catch((e) => { console.error('\n❌', e.message); process.exit(1) })
