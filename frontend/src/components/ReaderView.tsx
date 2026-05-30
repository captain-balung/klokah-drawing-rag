import { useEffect, useState } from 'react'
import { fetchBook, type BookDetail } from '../api'

export default function ReaderView({
  bookId,
  onBack,
}: {
  bookId: number
  onBack: () => void
}) {
  const [book, setBook] = useState<BookDetail | null>(null)
  const [error, setError] = useState('')
  const [lang, setLang] = useState('')
  const [pageIdx, setPageIdx] = useState(0)

  // 換書時由 App 以 key={bookId} 重新掛載本元件，故初始 state 即為重置狀態，
  // effect 只負責抓資料（在 async callback 設 state，不在 effect body 同步 setState）。
  useEffect(() => {
    let active = true
    fetchBook(bookId)
      .then((b) => {
        if (!active) return
        setBook(b)
        setLang(b.available_languages[0]?.name ?? '')
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      active = false
    }
  }, [bookId])

  if (error)
    return (
      <div className="view reader__status">
        <span>⚠️ {error}</span>
        <button onClick={onBack}>返回列表</button>
      </div>
    )
  if (!book) return <div className="view reader__status">載入中…</div>

  const page = book.pages[pageIdx]
  // 族語逐字直接取自 JSON（忠實呈現，不經 LLM）
  const iv = page?.indigenous_versions.find((v) => v.language === lang)

  return (
    <div className="view reader">
      <div className="reader__bar">
        <button className="reader__back" onClick={onBack}>
          ← 列表
        </button>
        <strong className="reader__title">
          {book.title} <span className="card__id">#{book.id}</span>
        </strong>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {book.available_languages.map((l) => (
            <option key={l.lid} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="page">
        {page?.image_url && (
          <img
            className="page__img"
            src={page.image_url}
            alt={`${book.title} 第 ${page.page_number} 頁`}
            loading="lazy"
          />
        )}

        <div className="page__texts">
          {iv?.text ? (
            <div className="page__block page__indigenous">
              <div className="page__lang">{lang}</div>
              <p>{iv.text}</p>
              {iv.audio_url && <audio controls src={iv.audio_url} preload="none" />}
            </div>
          ) : (
            <div className="page__block page__indigenous page__missing">
              （此頁無 {lang} 文字）
            </div>
          )}

          <div className="page__block page__chinese">
            <div className="page__lang">華語</div>
            <p>{page?.chinese_text}</p>
            {page?.audio_url_chinese && (
              <audio controls src={page.audio_url_chinese} preload="none" />
            )}
          </div>
        </div>
      </div>

      <div className="reader__nav">
        <button disabled={pageIdx === 0} onClick={() => setPageIdx((i) => i - 1)}>
          上一頁
        </button>
        <span>
          {pageIdx + 1} / {book.pages.length}
        </span>
        <button
          disabled={pageIdx >= book.pages.length - 1}
          onClick={() => setPageIdx((i) => i + 1)}
        >
          下一頁
        </button>
      </div>
    </div>
  )
}
