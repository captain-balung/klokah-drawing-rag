import { useEffect, useMemo, useState } from 'react'
import { fetchBooks, type BookSummary } from '../api'

export default function BrowseView({ onOpen }: { onOpen: (id: number) => void }) {
  const [books, setBooks] = useState<BookSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [level, setLevel] = useState('')
  const [grammar, setGrammar] = useState('')
  const [lang, setLang] = useState('')

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const levels = useMemo(
    () => [...new Set(books.map((b) => b.level).filter(Boolean))],
    [books],
  )
  const grammars = useMemo(
    () => [...new Set(books.map((b) => b.grammar_focus).filter(Boolean))],
    [books],
  )
  const langs = useMemo(
    () => [...new Set(books.flatMap((b) => b.available_languages))].sort(),
    [books],
  )

  const filtered = books.filter(
    (b) =>
      (!level || b.level === level) &&
      (!grammar || b.grammar_focus === grammar) &&
      (!lang || b.available_languages.includes(lang)),
  )

  if (loading) return <div className="view browse__status">載入繪本列表中…</div>
  if (error) return <div className="view browse__status">⚠️ {error}</div>

  return (
    <div className="view browse">
      <div className="filters">
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">全部級別</option>
          {levels.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select value={grammar} onChange={(e) => setGrammar(e.target.value)}>
          <option value="">全部語法重點</option>
          {grammars.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">全部族語</option>
          {langs.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <span className="filters__count">{filtered.length} 本</span>
      </div>

      <div className="cards">
        {filtered.map((b) => (
          <button key={b.id} className="card" onClick={() => onOpen(b.id)}>
            <div className="card__title">
              {b.title} <span className="card__id">#{b.id}</span>
            </div>
            <div className="card__tags">
              <span>{b.level}</span>
              <span>{b.grammar_focus}</span>
              <span>{b.language_count} 種族語</span>
            </div>
            <div className="card__summary">{b.summary}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
