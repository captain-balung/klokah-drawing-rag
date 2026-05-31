import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { displayText, streamChat, type Msg } from '../api'

// 助理回應以 Markdown 渲染（remark-gfm 支援表格）；react-markdown 預設不渲染原始 HTML，安全。
// 忠實呈現：只排版既有文字，不改字。
function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
}

// 判斷一則訊息是否要顯示成對話氣泡（略過內部的 tool_result user 訊息與空白回合）
function renderable(m: Msg): boolean {
  if (m.role === 'user') return typeof m.content === 'string'
  if (m.role === 'assistant') return displayText(m).trim().length > 0
  return false
}

// 對話字級（無障礙：使用者多為有老花的老師，可自行調整並記住設定）
const FONT_MIN = 18
const FONT_MAX = 40
const FONT_DEFAULT = 28
const FONT_STEP = 2
const FONT_KEY = 'chatFontSize'

function loadFontSize(): number {
  const saved = Number(localStorage.getItem(FONT_KEY))
  return saved >= FONT_MIN && saved <= FONT_MAX ? saved : FONT_DEFAULT
}

export default function ChatView({
  messages,
  setMessages,
}: {
  messages: Msg[]
  setMessages: (messages: Msg[]) => void
}) {
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [toolNote, setToolNote] = useState('')
  const [error, setError] = useState('')
  // 連線失敗時保存當輪歷史，供「重試」用（不重複 append 使用者訊息）
  const [retryHistory, setRetryHistory] = useState<Msg[] | null>(null)

  const [fontSize, setFontSize] = useState<number>(loadFontSize)
  useEffect(() => {
    localStorage.setItem(FONT_KEY, String(fontSize))
  }, [fontSize])
  const biggerFont = () => setFontSize((s) => Math.min(FONT_MAX, s + FONT_STEP))
  const smallerFont = () => setFontSize((s) => Math.max(FONT_MIN, s - FONT_STEP))

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveText, toolNote])

  function friendlyError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err)
    if (/fetch|network|load failed|connection/i.test(msg)) {
      return '連線中斷（後端可能正在重啟或網路不穩）。請點「重試」。'
    }
    return msg
  }

  async function runTurn(history: Msg[]) {
    setError('')
    setLiveText('')
    setToolNote('')
    setStreaming(true)
    try {
      await streamChat(history, (e) => {
        if (e.type === 'text') {
          setLiveText((t) => t + e.delta)
        } else if (e.type === 'tool_use') {
          setToolNote('正在查詢繪本資料…')
        } else if (e.type === 'tool_result') {
          setToolNote('')
        } else if (e.type === 'done') {
          setMessages(e.final_messages)
          setLiveText('')
          setToolNote('')
          setRetryHistory(null)
        } else if (e.type === 'error') {
          setError(e.error)
          setRetryHistory(history)
        }
      })
    } catch (err) {
      setError(friendlyError(err))
      setRetryHistory(history)
    } finally {
      setStreaming(false)
    }
  }

  function send() {
    const text = input.trim()
    if (!text || streaming) return
    const history: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setInput('')
    void runTurn(history)
  }

  function retry() {
    if (streaming) return
    const history = retryHistory ?? messages
    if (history.length === 0) return
    void runTurn(history)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const visible = messages.filter(renderable)

  return (
    <div className="view" style={{ '--chat-font-size': `${fontSize}px` } as CSSProperties}>
      <div className="chat__toolbar">
        <span className="chat__toolbar-label">字級</span>
        <button onClick={smallerFont} disabled={fontSize <= FONT_MIN} aria-label="縮小字級">
          A−
        </button>
        <button onClick={biggerFont} disabled={fontSize >= FONT_MAX} aria-label="放大字級">
          A＋
        </button>
      </div>
      <main className="chat">
        {visible.length === 0 && !streaming && (
          <div className="chat__empty">
            <p>試著問問看：</p>
            <ul>
              <li>「推薦一本關於分享的繪本」</li>
              <li>「有沒有關於環保的繪本？」</li>
              <li>「給我 #167 的阿美語第 1 頁」</li>
            </ul>
          </div>
        )}

        {visible.map((m, i) =>
          m.role === 'assistant' ? (
            <div key={i} className="bubble bubble--assistant bubble--md">
              <Markdown>{displayText(m)}</Markdown>
            </div>
          ) : (
            <div key={i} className="bubble bubble--user">
              {displayText(m)}
            </div>
          ),
        )}

        {streaming && (liveText || toolNote) && (
          <div className="bubble bubble--assistant bubble--md">
            {toolNote && <div className="bubble__tool">{toolNote}</div>}
            {liveText && <Markdown>{liveText}</Markdown>}
            <span className="cursor">▋</span>
          </div>
        )}

        {streaming && !liveText && !toolNote && (
          <div className="bubble bubble--assistant bubble--thinking">思考中…</div>
        )}

        {error && (
          <div className="chat__error">
            <span>⚠️ {error}</span>
            <button className="chat__retry" onClick={retry} disabled={streaming}>
              重試
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="輸入問題，Enter 送出（Shift+Enter 換行）"
          rows={2}
          disabled={streaming}
        />
        <button onClick={send} disabled={streaming || !input.trim()}>
          {streaming ? '回應中…' : '送出'}
        </button>
      </footer>
    </div>
  )
}
