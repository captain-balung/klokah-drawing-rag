import { useState } from 'react'
import './App.css'
import ChatView from './components/ChatView'
import BrowseView from './components/BrowseView'
import ReaderView from './components/ReaderView'

type View = { name: 'chat' } | { name: 'browse' } | { name: 'read'; bookId: number }

export default function App() {
  const [view, setView] = useState<View>({ name: 'chat' })

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

      {view.name === 'chat' && <ChatView />}
      {view.name === 'browse' && (
        <BrowseView onOpen={(id) => setView({ name: 'read', bookId: id })} />
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
