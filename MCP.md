# 族語 E 樂園繪本 MCP server

對外公開的 [Model Context Protocol](https://modelcontextprotocol.io/) 伺服器，
讓任何 MCP-相容的聊天機器人或 AI 助手可以查詢「族語 E 樂園」95 本原住民族語繪本資料
（華語 + 16 族族語、每頁文字 / 音檔 URL / 圖片 URL）。

> **零 LLM 成本**：本 server 僅回傳靜態繪本資料，不呼叫任何 LLM。你的聊天機器人用
> 自己的模型推理；我們不消耗任何 token。

---

## 連線資訊

| 項目 | 值 |
|---|---|
| **Endpoint** | `https://zuyu-rag-backend.onrender.com/mcp/` |
| **Transport** | MCP **Streamable HTTP**（取代已棄用的 HTTP+SSE） |
| **認證** | 無——完全公開 |
| **Rate limit** | 預設 60 次/分鐘/IP；超量回 HTTP 429 |
| **CORS** | 對 `/mcp` 完全公開 |

---

## 工具清單

四個純資料工具。所有回傳值皆為 JSON（透過 MCP `tools/call` 的 structured content）。

### 1. `list_books`

列出繪本 metadata（不含逐頁內容，輕量）。

**輸入**（皆為選填）：
- `level: string` — 級別子字串（如「初級」「中級」「中高級」「高級」）
- `language: string` — 族語名稱子字串（如「阿美語」「泰雅語」）
- `grammar_focus: string` — 語法重點關鍵字
- `title: string` — 書名子字串

**輸出**：`Array<Book>`，每筆含 `id` / `title` / `level` / `grammar_focus` / `summary` /
`page_count` / `language_count` / `available_languages`。

### 2. `search_books`

對全部 95 本繪本的摘要做關鍵字全文比對（子字串、case-insensitive）。

**輸入**：
- `query: string` — 搜尋關鍵字（必填）
- `limit: integer` — 最多回幾筆，預設 10、上限 50

**輸出**：`Array<BookSummary>`，命中項的 summary 物件。

### 3. `get_book`

取單本繪本完整內容。

**輸入**：
- `book_id: integer` — 繪本編號（從 `list_books` / `search_books` 取得）
- `language: string` —（選填）只想看特定族語版本時填，如「阿美語」

**輸出**：整本書的 JSON（含 `pages` 陣列，每頁有 `chinese_text`、`indigenous_versions`、
`audio_url_chinese`、`audio_url_indigenous`、`image_url`）。指定 `language` 時，每頁的
`indigenous_versions` 會被壓平為單一 `indigenous_text` / `audio_url_indigenous`。

`book_id` 不存在時回 `isError: true`。

### 4. `get_book_page`

取單頁切片——比 `get_book` 更省 token，當你只想看某一頁時用。

**輸入**：
- `book_id: integer`
- `page_number: integer` — 頁碼從 1 開始
- `language: string` —（選填）只看特定族語版本

**輸出**：單頁內容。

---

## 連線範例

### Claude Desktop

把以下加進 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "klokah-rag": {
      "url": "https://zuyu-rag-backend.onrender.com/mcp/"
    }
  }
}
```

設定檔位置：
- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

重新啟動 Claude Desktop 後，在對話中應該能看到 `klokah-rag` server 與四個工具。

### MCP Inspector（除錯/探索）

```bash
npx @modelcontextprotocol/inspector
```

開啟後選 **Streamable HTTP** transport，URL 填
`https://zuyu-rag-backend.onrender.com/mcp/`，按 Connect。

### Python（官方 MCP SDK）

```python
import asyncio
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def main():
    url = "https://zuyu-rag-backend.onrender.com/mcp/"
    async with streamablehttp_client(url) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("tools:", [t.name for t in tools.tools])

            # 搜尋關於森林的繪本
            r = await session.call_tool("search_books", {"query": "森林", "limit": 3})
            print(r.structuredContent)

            # 取 #167 的阿美語版第 1 頁
            r = await session.call_tool(
                "get_book_page",
                {"book_id": 167, "page_number": 1, "language": "阿美語"},
            )
            print(r.structuredContent)

asyncio.run(main())
```

### 原始 HTTP（curl）

MCP Streamable HTTP 使用 JSON-RPC 2.0。簡單 `initialize` 範例：

```bash
curl -X POST https://zuyu-rag-backend.onrender.com/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "curl", "version": "0"}
    }
  }'
```

實務上請用 MCP client SDK，而非手寫 JSON-RPC。

---

## 建議查詢流程

1. 用 `search_books("關鍵字")` 或 `list_books(level=..., language=...)` 找候選 `book_id`
2. 用 `get_book(book_id)` 取整本，或用 `get_book_page(book_id, page_number)` 取單頁
3. 引用族語原文時請**逐字保留**特殊符號（如 `ʔ ʉ ə ’`），不要正規化為 ASCII

---

## 資料授權與來源

- 繪本內容來源：[原住民族語 E 樂園](https://web.klokah.tw/)（教育部委辦）
- 本服務不修改、不轉譯內容；僅提供結構化查詢介面
- 使用時請遵守原平臺授權

---

## 回報問題

GitHub Issues：<https://github.com/captain-balung/klokah-drawing-rag/issues>
