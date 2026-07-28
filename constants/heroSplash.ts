import type { ImageSourcePropType } from 'react-native'

export interface HeroSplashDish {
  id: string
  /** Human-readable label derived from the image filename */
  name: string
  source: ImageSourcePropType
}

/** Turn a filename like `Boneless_Chicken_Dum_Biryani.png` into a slide label */
export function heroSplashLabelFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return base
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+-\s*$/g, '')
    .trim()
}

const HERO_IMAGES = [
  { id: 'boneless-chicken-dum-biryani', file: 'Boneless_Chicken_Dum_Biryani.png' },
  { id: 'hyderabadi-goat-dum-biryani', file: 'hyderbadi_goat_dum_biryani.png' },
  { id: 'chicken-majestic', file: 'Chicken_Majestic.png' },
  { id: 'chicken-lollipop', file: 'Chicken_Lollipop.png' },
  { id: 'veg-samosa', file: 'Veg_Samosa__2_Pieces__.png' },
  { id: 'chilli-gobi', file: 'Chilli_Gobi.png' },
] as const

export const HERO_SPLASH_DISHES: HeroSplashDish[] = [
  {
    id: HERO_IMAGES[0].id,
    name: heroSplashLabelFromFilename(HERO_IMAGES[0].file),
    source: require('../assets/hero/Boneless_Chicken_Dum_Biryani.png'),
  },
  {
    id: HERO_IMAGES[1].id,
    name: 'Goat Dum Biryani',
    source: require('../assets/hero/hyderbadi_goat_dum_biryani.png'),
  },
  {
    id: HERO_IMAGES[2].id,
    name: heroSplashLabelFromFilename(HERO_IMAGES[2].file),
    source: require('../assets/hero/Chicken_Majestic.png'),
  },
  {
    id: HERO_IMAGES[3].id,
    name: heroSplashLabelFromFilename(HERO_IMAGES[3].file),
    source: require('../assets/hero/Chicken_Lollipop.png'),
  },
  {
    id: HERO_IMAGES[4].id,
    name: 'Samosa',
    source: require('../assets/hero/Veg_Samosa__2_Pieces__.png'),
  },
  {
    id: HERO_IMAGES[5].id,
    name: heroSplashLabelFromFilename(HERO_IMAGES[5].file),
    source: require('../assets/hero/Chilli_Gobi.png'),
  },
]

export const HERO_SPLASH_FALLBACK = HERO_SPLASH_DISHES[0].source

export const HERO_SPLASH_INTERVAL_MS = 4500
