import { Inter } from '@next/font/google'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import styles from './index.module.css'

const inter = Inter({ subsets: ['latin'] })

type Card = {
  original: string,
  transcription: string,
  translation: string,
  example1: string,
  example2: string,
}

function parseStringToObject(str: string) {
  const obj: { [key: string]: string } = {}
  const lines = str.split('\n')

  for (const line of lines) {
    const [key, value] = line.split(': ')
    obj[key.toLowerCase()] = value
  }

  return obj
}

async function getNextWord(lang: string) {
  const res = await fetch(`/api/word?lang=${lang}`)
  const data = await res.json()

  return parseStringToObject(JSON.parse(JSON.stringify(data.text)))
}

async function learnWord(lang: string, word: string) {
  const res = await fetch(`api/word?lang=${lang}`, {
    method: 'POST',
    body: JSON.stringify({
      word,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()

  return parseStringToObject(JSON.parse(JSON.stringify(data.text)))
}

function Home() {
  const [lang, setLang] = useState('en')
  const [card, setCard] = useState<Partial<Card>>({})
  const [isLoading, toggleLoading] = useState(false)
  const [hasError, setError] = useState(false)
  const [words, setWords] = useState<string[]>([])
  const [isRepeating, toggleRepeating] = useState(false)
  const [index, setIndex] = useState(0)

  const handleChangeLang = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    setLang(e.target.value)
    localStorage.setItem('lang', e.target.value)

    try {
      toggleLoading(true)

      const res = await learnWord(e.target.value, card.original as string)
      setCard(res)
    } catch {
      setError(true)
    } finally {
      toggleLoading(false)
    }
  }, [setLang, card])

  const handleNext = useCallback(async () => {
    let filteredWords
    const word = words.find(w => w === card.original)
    
    if (word) {
      filteredWords = words.filter(w => w !== word)
      
      localStorage.setItem('words', JSON.stringify(filteredWords))
      setWords(filteredWords)
    }

    try {
      toggleLoading(true)

      if (isRepeating && filteredWords && filteredWords.length) {
        const res = await learnWord(lang, filteredWords[0])
        setCard(res)

        return
      }

      const res = await getNextWord(lang)
      setCard(res)
    } catch {
      setError(true)
    } finally {
      toggleLoading(false)
    }
  }, [lang, words, card, isRepeating])

  const handleLearnLater = useCallback(async () => {
    if (isRepeating) {
      setIndex(index + 1 < words.length ? index + 1 : 0)
      
      try {
        toggleLoading(true)

        const res = await learnWord(lang, words[index])
        setCard(res)
      } catch {
        setError(true)
      } finally {
        toggleLoading(false)
      }

      return
    }

    localStorage.setItem('words', JSON.stringify(Array.from(new Set([...words, card.original as string]))))
    setWords([...words, card.original as string])
    handleNext()
  }, [words, card, handleNext, index, setIndex, isRepeating, lang])

  useEffect(() => {
    setWords(JSON.parse(localStorage.getItem('words') || '') ?? [])
    setLang(localStorage.getItem('lang') || 'en')
  }, [])

  useEffect(() => {
    if (isRepeating) {
      handleLearnLater()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRepeating])

  useEffect(() => {
    if (!words.length) {
      toggleRepeating(false)
    }
  }, [words])

  useEffect(() => {
    const lang = localStorage.getItem('lang') || 'en'

    const request = async () => {
      try {
        toggleLoading(true)
        const res = await getNextWord(lang)
        setCard(res)
      } catch {
        setError(true)
      } finally {
        toggleLoading(false)
      }
    }

    request()
  }, [])

  return (
    <div className={`${styles.page} ${inter.className}`}>
      <div className={styles.row}>
        <div className={styles.col}>
          <h2>Translate to</h2>
          <div className={styles.radioGroup}>
            <label>
              <input disabled={isLoading} onChange={handleChangeLang} type="radio" name="language" value="en" checked={lang === 'en'} /> English
            </label>
            <label>
              <input disabled={isLoading} onChange={handleChangeLang} type="radio" name="language" value="ru" checked={lang === 'ru'} /> Russian
            </label>
          </div>
          {!!words.length && (
            <button disabled={isLoading} onClick={() => toggleRepeating(!isRepeating)} className={styles.button}>
              {isRepeating ? 'Stop repeating' : `Repeat ${words.length} words`}
            </button>
          )}
        </div>
        <div className={styles.col}>
          <div className={styles.card}>
            {isLoading ? 'Generating flashcard...' : hasError ? <h1>Oops, please try again</h1> : (
              <>
                <h1>{card.original}</h1>
                <code>{card.transcription}</code>
                <h3>{card.translation}</h3>
                <p>{card.example1}</p>
                <p>{card.example2}</p>

                <div className={styles.cardFooter}>
                  <button onClick={handleLearnLater} className={styles.button}>{isRepeating ? 'Next' : 'Learn later'}</button>
                  <button onClick={handleNext} className={`${styles.button} ${styles.buttonPrimary}`}>I know this word!</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
