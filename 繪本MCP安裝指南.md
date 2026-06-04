# 族語繪本 MCP 安裝指南

> 給沒裝過 MCP 的朋友：照著做，**最快 30 秒**就能在 AI 對話視窗裡查詢「族語 E 樂園」95 本原住民族語繪本。

---

## 這個是什麼？

裝完之後，你在 Claude（或其他支援的 AI）對話視窗用中文問問題，AI 就會自動去查我們的繪本資料庫。例如：

- 「幫我找 3 本適合幼兒、關於動物的族語繪本」
- 「`#167` 阿美語版第 5 頁寫了什麼？」
- 「列出『中級』的繪本」

資料含**華語 + 16 族原住民族語**，每頁有文字、音檔網址、圖片網址。

---

## 你只需要記住這一條網址

不管走哪個路徑，最後都是把這條 URL 貼進設定裡：

```
https://zuyu-rag-backend.onrender.com/mcp/
```

📋 複製起來備用。

---

## 哪個方法適合你？

| 你的狀況 | 建議路徑 | 時間 |
|---|---|---|
| 有 **Claude.ai Pro / Team / Enterprise** | 👉 **路徑 A**：Claude.ai 網頁版 | **30 秒**（免裝任何東西）|
| 用免費 Claude，可以裝桌面 App | 👉 **路徑 B**：Claude Desktop（UI 設定）| 5 分鐘 |
| Claude Desktop 找不到 Connectors 選項 | 👉 **路徑 C**：Claude Desktop 設定檔 | 10 分鐘（要裝 Node.js）|
| 有 **ChatGPT Pro / Team / Business / Enterprise** | 👉 **路徑 D**：ChatGPT Connectors | 1 分鐘 |
| 用 Gemini | ⚠️ 目前**還不支援**使用者自訂 MCP（見下方說明）| — |

---

## 路徑 A：Claude.ai 網頁版（最快，30 秒）

需要 **Claude.ai Pro / Team / Enterprise**（自訂 Connector 是付費功能）。

1. 打開 <https://claude.ai>，登入你的 Pro 帳號
2. 點左下角頭像 → **Settings**（設定）
3. 找「**Connectors**」分頁（中文版可能叫「連接器」）
4. 點「**Add custom connector**」（新增自訂連接器）
5. 在表單填：
   - **名稱**：`族語繪本`
   - **URL**：`https://zuyu-rag-backend.onrender.com/mcp/`
   - **認證**：選「無 / None / Public」或留白
6. 儲存並把開關打開

✅ 完成！跳到下方「**驗證可以用**」。

---

## 路徑 B：Claude Desktop（UI 設定，5 分鐘）

免費 Claude 帳號也可以用桌面 App。

### B-1. 下載並安裝 Claude Desktop

到 <https://claude.ai/download> 下載對應系統版本，安裝後用 Claude 帳號登入。

### B-2. 在 Claude Desktop 加入族語繪本

1. 打開 Claude Desktop
2. **Settings**（設定）——通常在左下角或右上齒輪圖示
3. 找「**Connectors**」、「**Integrations**」或「**整合**」分頁
4. 點「**Add custom connector**」之類的按鈕
5. 在表單填：
   - **名稱**：`族語繪本`
   - **URL**：`https://zuyu-rag-backend.onrender.com/mcp/`
   - **認證**：選「無 / None / Public」或留白
6. 儲存並把開關打開

### B-3. 完全結束再重啟 Claude Desktop

- **macOS**：對 Claude 按 `Cmd+Q`，再從應用程式重開
- **Windows**：在右下角系統列找 Claude 圖示，**右鍵 → Quit**，再從開始功能表重開

✅ 完成！跳到下方「**驗證可以用**」。

> 如果在 B-2 找不到 Connectors / Add custom connector 之類的選項，你的 Claude Desktop 版本可能太舊或不支援；改走**路徑 C**。

---

## 路徑 C：Claude Desktop 設定檔（10 分鐘，相容性最好）

只有路徑 B 找不到選項時才走這條。需要先裝 Node.js。

### C-1. 安裝 Node.js

到 <https://nodejs.org> 下載 **LTS** 版本，安裝時記得勾「Add to PATH」。
裝完**重新開機**讓 PATH 生效。

驗證：開命令提示字元（Windows）或 Terminal（macOS），輸入：

```
npx --version
```

應該會印出版本號（如 `10.x.x`）。沒印出版本號代表 Node.js 沒裝好。

### C-2. 找到 Claude Desktop 的設定檔

| 系統 | 路徑 |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

把這個路徑直接貼進**檔案總管網址列**（Windows）或 Finder「前往資料夾」（macOS Cmd+Shift+G）。

如果檔案**不存在**，自己建立一個空檔，副檔名一定要是 `.json`。

### C-3. 編輯內容

用記事本（Windows）或 TextEdit（macOS，**記得切純文字模式**：格式 → 製作純文字）打開該檔，貼上：

```json
{
  "mcpServers": {
    "klokah-rag": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://zuyu-rag-backend.onrender.com/mcp/"]
    }
  }
}
```

> 如果檔案裡**已經有其他 mcpServers**（你之前裝過其他 MCP 工具），把 `"klokah-rag": { ... }` 那段插到既有的 `mcpServers` 物件裡，不要整個覆蓋掉。

存檔。

### C-4. 完全結束再重啟 Claude Desktop

同 B-3。

✅ 完成！跳到下方「**驗證可以用**」。

---

## 路徑 D：ChatGPT Connectors（1 分鐘）

需要 **ChatGPT Pro / Team / Business / Enterprise**（一般免費 ChatGPT 沒這個功能）。

> ⚠️ ChatGPT 的入口隨改版調整，下方步驟若對不上請看 OpenAI 官方說明。

1. 打開 <https://chat.openai.com>，登入付費帳號
2. **Settings**（設定）→ 找「**Connectors**」或「**Apps & connectors**」
3. 點「**Add custom connector**」之類的按鈕
4. 在表單填：
   - **名稱**：`族語繪本`
   - **URL**：`https://zuyu-rag-backend.onrender.com/mcp/`
   - **認證**：選「無」
5. 儲存並啟用

✅ 完成！跳到下方「**驗證可以用**」。

---

## Gemini？目前還不行

寫這份指南時（2026 年），**Google Gemini 的一般使用者介面（gemini.google.com / Gemini App）尚未開放讓使用者自訂 MCP server**。

Gemini 的「Extensions」目前只有 Google 預先做好的（Maps、YouTube、Workspace 等），不能貼自訂 URL。

> 開發者層級可以透過 Gemini API + Agent Development Kit 接 MCP，但那是寫程式的範疇，不是一般使用者操作的範疇。
>
> 如果未來 Google 開放這個功能，URL 同樣是 `https://zuyu-rag-backend.onrender.com/mcp/`。

---

## 驗證可以用

開一個新對話，介面上應該會看到「**🔌 族語繪本**」、「**klokah-rag**」之類的 connector 圖示，表示已連上。

試問：

> 幫我找 3 本適合幼兒、關於動物的族語繪本

AI 會自動呼叫 `search_books` 或 `list_books` 工具，回應中應該會出現像 `#167` 這樣的繪本編號——只要編號跑出來，就代表查資料庫成功了。

---

## 試試看這些問題

- 「給我關於分享主題的繪本」
- 「`#167` 是什麼書？有哪些族語版本？」
- 「`#167` 阿美語版第 1 頁的內容」
- 「列出『初級』的繪本」
- 「有什麼布農語繪本？挑一本適合 5 歲小孩的」

> 💡 引用族語原文時，繪本資料庫裡的特殊符號（如 `ʔ` `ʉ` `ə` `’`）是**逐字保留**的——這些是族語的喉塞音與母音記號，請勿替換成一般符號。

---

## 常見問題

### ❓ 對話視窗沒看到 connector 圖示
- 確認該 connector 在 Settings 裡**真的開了**（綠色／打勾）
- 路徑 C：用線上工具（如 <https://jsonlint.com>）驗證 JSON 沒打錯（多一個逗號或漏一個大括號都會壞）
- **完全結束**再重開（不是按關閉按鈕就好）

### ❓ 路徑 C 報錯「`npx` 找不到」、「command not found」
- Node.js 沒裝好，或沒勾「Add to PATH」
- 重裝 Node.js LTS（<https://nodejs.org>）、**重開電腦**

### ❓ AI 說「無法連到 server」
- 開瀏覽器試開 <https://zuyu-rag-backend.onrender.com/api/health>
- 應該會看到類似 `{"status":"ok","books_loaded":95,...}`
- 如果這個都打不開，可能是網路或我們的伺服器暫時掛了，過一會再試

### ❓ AI 回應是憑空編的，不是真的繪本
- 確認 AI 真的有「呼叫工具」（通常會在回應上方/下方顯示「**Using tool: search_books**」之類）
- 沒呼叫工具：把問題改得更具體（含「繪本」「找書」等關鍵字）
- 也可以直接點開 connector 看連線狀態

### ❓ 一定要付費嗎？有沒有免費路徑？
- **這個 server 本身完全免費**——不收費、不消耗任何 AI 額度
- AI 那邊：
  - **Claude Desktop（路徑 B / C）= 免費**（一般免費 Claude 帳號可用）
  - **Claude.ai 網頁版（路徑 A）= 付費** Pro 起跳
  - **ChatGPT（路徑 D）= 付費** Pro 起跳
  - **Gemini = 目前還不支援**

### ❓ 可以離線使用嗎？
- 不行，需要連到雲端伺服器才能查資料

### ❓ 會記錄我問了什麼嗎？
- **不會**。Server 不收個資、不需要登入、不會儲存對話。

---

## 其他工具（開發者向）

任何支援 MCP 的工具都能接，URL 同樣是 `https://zuyu-rag-backend.onrender.com/mcp/`：

- **Claude Code（CLI）**：`claude mcp add --transport http klokah-rag https://zuyu-rag-backend.onrender.com/mcp/`
- **Cursor / Windsurf / VS Code 擴充**：照各家 MCP 設定方式填 URL
- **自寫程式**：用 Python / TypeScript / Go 等 MCP SDK，URL 同上

---

## 有問題找誰？

回報給把這份指南傳給你的人就好 🙂
