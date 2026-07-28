/**
 * Build curated Unsplash image URLs from menu item titles.
 * Run: node scripts/buildMenuImages.mjs
 */
import { readFileSync, writeFileSync } from 'fs'

const src = readFileSync('constants/staticMenu.ts', 'utf8')
const items = [...src.matchAll(/id:'([^']+)',\s*name:'([^']+)'/g)].map((m) => ({
  id: m[1],
  name: m[2],
}))

function cleanName(name) {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildQueries(name) {
  const clean = cleanName(name)
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

function toStableUrl(url) {
  if (!url) return null
  const match = url.match(/images\.unsplash\.com\/(photo-[^?]+)/)
  if (!match) return null
  return `https://images.unsplash.com/${match[1]}?w=800&q=80&auto=format&fit=crop`
}

async function searchMealDB(query) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
  )
  const data = await res.json()
  return data.meals?.[0]?.strMealThumb ?? null
}

async function searchUnsplash(query) {
  const res = await fetch(
    `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=5&page=1`,
    { headers: { Accept: 'application/json' } },
  )
  if (!res.ok) return null
  const data = await res.json()
  for (const photo of data.results ?? []) {
    const url = photo.urls?.regular ?? photo.urls?.small
    const stable = toStableUrl(url)
    if (!stable) continue
    const desc = `${photo.description ?? ''} ${photo.alt_description ?? ''}`.toLowerCase()
    if (/portrait|person|people|face|landscape|mountain|city|building|logo|text only/i.test(desc)) continue
    return stable
  }
  return null
}

async function resolveImage(item) {
  for (const q of buildQueries(item.name)) {
    const meal = await searchMealDB(q)
    if (meal) return { url: meal, source: 'themealdb', query: q }
    await new Promise((r) => setTimeout(r, 60))
  }
  for (const q of buildQueries(item.name)) {
    const unsplash = await searchUnsplash(q)
    if (unsplash) return { url: unsplash, source: 'unsplash', query: q }
    await new Promise((r) => setTimeout(r, 200))
  }
  return null
}

const results = {}
for (const item of items) {
  const found = await resolveImage(item)
  results[item.id] = found
  console.log(`${item.id}|${found?.source ?? 'MISS'}|${found?.url ?? ''}|${found?.query ?? item.name}`)
}

const lines = Object.entries(results)
  .filter(([, v]) => v)
  .map(([id, v]) => `  '${id}': '${v.url}',`)
  .join('\n')

writeFileSync('/tmp/dish-images-output.txt', lines)
console.log(`\nResolved ${Object.values(results).filter(Boolean).length}/${items.length}`)
