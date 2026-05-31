import { useEffect, useMemo, useRef, useState } from 'react'
import { displayText, fetchBook, type BookSummary, type Msg } from '../api'

// 從對話的助理回應抽出提到的繪本 #編號：去重、只保留資料庫存在的、最新提到的排前面。
function referencedIds(messages: Msg[], valid: Set<number>): number[] {
  const ids: number[] = []
  for (const m of messages) {
    if (m.role !== 'assistant') continue
    for (const match of displayText(m).matchAll(/#(\d+)/g)) {
      const id = Number(match[1])
      if (valid.has(id) && !ids.includes(id)) ids.push(id)
    }
  }
  return ids.reverse() // 最新提到的在前
}

export default function ReferencedBooks({
  messages,
  books,
  onOpen,
}: {
  messages: Msg[]
  books: BookSummary[]
  onOpen: (id: number) => void
}) {
  const byId = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const valid = useMemo(() => new Set(books.map((b) => b.id)), [books])
  const ids = useMemo(() => referencedIds(messages, valid), [messages, valid])

  // 封面縮圖＝該書第一張有圖的頁面；抓過就快取，不重複請求。
  const [covers, setCovers] = useState<Record<number, string | null>>({})
  const fetched = useRef<Set<number>>(new Set())
  useEffect(() => {
    for (const id of ids) {
      if (fetched.current.has(id)) continue
      fetched.current.add(id)
      fetchBook(id)
        .then((b) => {
          const img = b.pages.find((p) => p.image_url)?.image_url ?? null
          setCovers((c) => ({ ...c, [id]: img }))
        })
        .catch(() => setCovers((c) => ({ ...c, [id]: null }))) // 封面抓失敗就標記無圖
    }
  }, [ids])

  return (
    <aside className="refbooks">
      <div className="refbooks__title">對話提到的繪本</div>
      {ids.length === 0 ? (
        <p className="refbooks__empty">
          對話中提到的繪本會出現在這裡，點卡片可開啟閱讀。
        </p>
      ) : (
        <div className="refbooks__list">
          {ids.map((id) => {
            const b = byId.get(id)
            if (!b) return null
            const cover = covers[id]
            return (
              <button
                key={id}
                className="refcard"
                onClick={() => onOpen(id)}
                title={`開啟閱讀 #${id} ${b.title}`}
              >
                {cover ? (
                  <img
                    className="refcard__img"
                    src={cover}
                    alt={b.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="refcard__img refcard__img--none">無封面</div>
                )}
                <div className="refcard__body">
                  <div className="refcard__title">
                    {b.title} <span className="refcard__id">#{id}</span>
                  </div>
                  <div className="refcard__meta">{b.level}</div>
                  <div className="refcard__summary">{b.summary}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
