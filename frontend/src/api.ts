// 後端 API 串接：SSE streaming 對話。
// 後端預設跑在 http://127.0.0.1:8000（CORS 開放）；可用 VITE_API_BASE 覆寫。

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

export type ContentBlock = {
  type: string
  text?: string
  [k: string]: unknown
}

export type Msg = {
  role: string
  content: string | ContentBlock[]
}

export type ChatEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; output_preview: string }
  | { type: 'done'; final_messages: Msg[] }
  | { type: 'error'; error: string }

/**
 * 對 /api/chat/stream 發 POST，邊收邊解析 SSE 事件。
 * 後端事件格式：每個事件以空行分隔，含 `event:` 與 `data:`（JSON）。
 */
export async function streamChat(
  messages: Msg[],
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })
  if (!res.ok || !res.body) {
    throw new Error(`後端回應異常：HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)

      let eventName = 'message'
      let data = ''
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue

      const payload = JSON.parse(data)
      onEvent({ type: eventName, ...payload } as ChatEvent)
    }
  }
}

// ---- 繪本資料（瀏覽 / 閱讀畫面用）----------------------------------------

export type BookSummary = {
  id: number
  title: string
  level: string
  grammar_focus: string
  summary: string
  page_count: number
  language_count: number
  available_languages: string[]
}

export type IndigenousVersion = {
  language: string
  text: string | null
  audio_url: string | null
}

export type BookPage = {
  page_number: number
  chinese_text: string
  image_url: string | null
  audio_url_chinese: string | null
  indigenous_versions: IndigenousVersion[]
}

export type BookLanguage = { lid: number; name: string; page_count: number }

export type BookDetail = {
  id: number
  title: string
  illustrator?: string
  level: string
  grammar_focus: string
  summary: string
  page_count: number
  available_languages: BookLanguage[]
  pages: BookPage[]
}

/** 取全部繪本的輕量 metadata（給瀏覽/過濾用）。 */
export async function fetchBooks(): Promise<BookSummary[]> {
  const res = await fetch(`${API_BASE}/api/books`)
  if (!res.ok) throw new Error(`載入繪本列表失敗：HTTP ${res.status}`)
  return res.json()
}

/** 取單本繪本完整內容（逐頁、各族語文字、音檔）。 */
export async function fetchBook(id: number): Promise<BookDetail> {
  const res = await fetch(`${API_BASE}/api/books/${id}`)
  if (!res.ok) throw new Error(`載入繪本 #${id} 失敗：HTTP ${res.status}`)
  return res.json()
}

/** 從一則訊息抽出要顯示的純文字（assistant 的 text 區塊 / user 字串）。 */
export function displayText(m: Msg): string {
  if (typeof m.content === 'string') return m.content
  return m.content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
}
