import { useEffect, useState } from 'react'
import './App.css'
import ChatView from './components/ChatView'
import BrowseView from './components/BrowseView'
import ReaderView from './components/ReaderView'
import ReferencedBooks from './components/ReferencedBooks'
import { fetchBooks, type BookSummary, type Msg } from './api'

type View = { name: 'chat' } | { name: 'browse' } | { name: 'read'; bookId: number }

export default function App() {
  const [view, setView] = useState<View>({ name: 'chat' })
  // 對話內容提升到 App：切換畫面再切回來不會消失，也供右側面板讀取
  const [messages, setMessages] = useState<Msg[]>([])
  // 繪本 metadata 在 App 載入一次，瀏覽畫面與右側面板共用
  const [books, setBooks] = useState<BookSummary[]>([])
  const [booksError, setBooksError] = useState('')

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((e) => setBooksError(e instanceof Error ? e.message : String(e)))
  }, [])

  const openBook = (id: number) => setView({ name: 'read', bookId: id })

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">
          <h1>族語 E 樂園 · 繪本助理</h1>
          <p>用中文問問題，或瀏覽 95 本繪本</p>
        </div>
        <nav className="app__nav">
          <button
            className={view.name === 'chat' ? 'active' : ''}
            onClick={() => setView({ name: 'chat' })}
          >
            對話
          </button>
          <button
            className={view.name !== 'chat' ? 'active' : ''}
            onClick={() => setView({ name: 'browse' })}
          >
            瀏覽繪本
          </button>
        </nav>
      </header>

      {view.name === 'chat' && (
        <div className="chat-layout">
          <ChatView messages={messages} setMessages={setMessages} />
          <ReferencedBooks messages={messages} books={books} onOpen={openBook} />
        </div>
      )}
      {view.name === 'browse' && (
        <BrowseView books={books} error={booksError} onOpen={openBook} />
      )}
      {view.name === 'read' && (
        <ReaderView
          key={view.bookId}
          bookId={view.bookId}
          onBack={() => setView({ name: 'browse' })}
        />
      )}
    </div>
  )
}
