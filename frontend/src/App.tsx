import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import './App.css'
import { displayText, streamChat, type Msg } from './api'

// 判斷一則訊息是否要顯示成對話氣泡（略過內部的 tool_result user 訊息與空白回合）
function renderable(m: Msg): boolean {
  if (m.role === 'user') return typeof m.content === 'string'
  if (m.role === 'assistant') return displayText(m).trim().length > 0
  return false
}

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [toolNote, setToolNote] = useState('')
  const [error, setError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveText, toolNote])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return

    const history: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setInput('')
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
        } else if (e.type === 'error') {
          setError(e.error)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setStreaming(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const visible = messages.filter(renderable)

  return (
    <div className="app">
      <header className="app__header">
        <h1>族語 E 樂園 · 繪本助理</h1>
        <p>用中文問問題，找書、讀內容、查特定族語版本</p>
      </header>

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

        {visible.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>
            {displayText(m)}
          </div>
        ))}

        {streaming && (liveText || toolNote) && (
          <div className="bubble bubble--assistant">
            {toolNote && <div className="bubble__tool">{toolNote}</div>}
            {liveText}
            <span className="cursor">▋</span>
          </div>
        )}

        {streaming && !liveText && !toolNote && (
          <div className="bubble bubble--assistant bubble--thinking">思考中…</div>
        )}

        {error && <div className="chat__error">⚠️ {error}</div>}
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
        <button onClick={() => void send()} disabled={streaming || !input.trim()}>
          {streaming ? '回應中…' : '送出'}
        </button>
      </footer>
    </div>
  )
}
