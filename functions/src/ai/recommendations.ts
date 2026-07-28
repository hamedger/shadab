import * as functions from 'firebase-functions/v2'
import * as admin from 'firebase-admin'
import OpenAI from 'openai'

const db = admin.firestore()

export const getAIRecommendations = functions.https.onCall(async (request) => {
  const { auth, data } = request
  const { locationId = 'chicago-il' } = data

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let orderHistory: string[] = []
  let preferences: string[] = []

  if (auth) {
    const userSnap = await db.collection('users').doc(auth.uid).get()
    if (userSnap.exists) {
      const user = userSnap.data()!
      preferences = user.dietaryPreferences ?? []
    }

    const ordersSnap = await db.collection('orders')
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    ordersSnap.docs.forEach((d) => {
      const order = d.data()
      order.items?.forEach((item: any) => orderHistory.push(item.name))
    })
  }

  // Get menu items for context
  const menuSnap = await db.collection('menu')
    .where('locationIds', 'array-contains', locationId)
    .where('isAvailable', '==', true)
    .limit(60)
    .get()

  const menuItems = menuSnap.docs.map((d) => ({ id: d.id, name: d.data().name, category: d.data().category }))

  const prompt = `You are a recommendation engine for Shadab, a Hyderabadi Indian restaurant.

Menu items available (id: name):
${menuItems.map((i) => `${i.id}: ${i.name} (${i.category})`).join('\n')}

${orderHistory.length ? `Customer's recent orders: ${orderHistory.slice(0, 10).join(', ')}` : 'New customer.'}
${preferences.length ? `Dietary preferences: ${preferences.join(', ')}` : ''}
Current time: ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago' })}

Return a JSON array of exactly 4 menu item IDs the customer would most enjoy, ordered by best match. Reply ONLY with a valid JSON array of strings.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.3,
  })

  const content = completion.choices[0]?.message?.content ?? '[]'
  let itemIds: string[] = []
  try {
    itemIds = JSON.parse(content)
  } catch {
    // Fall back to bestsellers
    const fallback = menuSnap.docs.filter((d) => d.data().tags?.includes('bestseller')).slice(0, 4)
    itemIds = fallback.map((d) => d.id)
  }

  return { itemIds: itemIds.slice(0, 4) }
})
