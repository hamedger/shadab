// Per-category gradient colors and accent tints used in the category grid
export const CATEGORY_CONFIG: Record<string, { gradient: [string, string]; accent: string }> = {
  'biryani':             { gradient: ['#3d1a00', '#1a0a00'], accent: '#c9a24b' },
  'veg-appetizers':      { gradient: ['#0d2b14', '#071508'], accent: '#43a047' },
  'non-veg-appetizers':  { gradient: ['#2b1400', '#150a00'], accent: '#e07820' },
  'veg-curries':         { gradient: ['#0a2b20', '#041510'], accent: '#26a069' },
  'non-veg-curries':     { gradient: ['#2a0e0e', '#150707'], accent: '#d84040' },
  'sizzlers':            { gradient: ['#2b1e00', '#150f00'], accent: '#e89c20' },
  'chef-specials':       { gradient: ['#1a0a2b', '#0d0516'], accent: '#b06ae0' },
  'weekend-specials':    { gradient: ['#2b0a14', '#150509'], accent: '#e04070' },
  'shawarma':            { gradient: ['#1a1a0a', '#0d0d05'], accent: '#c8b830' },
  'breads':              { gradient: ['#1e140a', '#0f0a05'], accent: '#c48830' },
  'soups-salads':        { gradient: ['#0a1a2b', '#050d15'], accent: '#3080d0' },
  'chinese':             { gradient: ['#2b0a0a', '#150505'], accent: '#e03030' },
  'desserts':            { gradient: ['#2b1a0a', '#150d05'], accent: '#e88c30' },
  'drinks':              { gradient: ['#0a1a1a', '#050d0d'], accent: '#30c0b0' },
}
