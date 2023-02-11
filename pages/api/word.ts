import { getWordsList } from 'most-common-words-by-language'
import { NextApiRequest, NextApiResponse } from 'next'

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY')
}

const prompt = ({ word, lang }: { word: string, lang: string }) => `
  Translate ${word} spanish word to ${lang} and build text in next format:

  original: ${word}
  translation: <paste translated word>
  transcription: <past transcription of original word>
  example1: <paste short sentence with given word in spanish>
  example2: <paste translation first sentence to given language>
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const words = getWordsList('spanish')
  const randomIndex = Math.floor(Math.random() * 10000)
  const word = words[randomIndex]
  const { query: { lang }, method, body } = req
  const translateTo = lang === 'en' ? 'English' : 'Russian'

  const payload = {
    model: 'text-davinci-003',
    prompt: prompt({ word: method === 'POST' ? body.word : word, lang: translateTo }),
    temperature: process.env.AI_TEMP ? parseFloat(process.env.AI_TEMP) : 0.7,
    max_tokens: process.env.AI_MAX_TOKENS
      ? parseInt(process.env.AI_MAX_TOKENS)
      : 200,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: '',
    user: '',
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  }

  if (process.env.OPENAI_API_ORG) {
    requestHeaders['OpenAI-Organization'] = process.env.OPENAI_API_ORG
  }

  const response = await fetch('https://api.openai.com/v1/completions', {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (data.error) {
    console.error('OpenAI API error: ', data.error)
    return res.json({
      text: `ERROR with API integration. ${data.error.message}`,
    })
  }

  // return response with 200 and stringify json text
  return res.json({ text: data.choices[0].text })
}
