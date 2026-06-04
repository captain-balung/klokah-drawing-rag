# roadmap.md — 族語 E 樂園繪本 RAG 駕駛艙

> 人類監督 AI 的核心介面，也是專案進度的單一真相來源。
> 修改者：AI 主導（持續更新進度與狀態）。首要讀者是人類監督者。

**狀態符號**：✅ 已完成　🔄 進行中　⬜ 未開始　⛔ 阻塞中　⏭️ 已跳過

---

## 進度摘要（1.9）

> 整體 100%（Phase 1–5 全部完成上線）

- **整體**：Phase 1/2/3/4/5 完成上線
- **當前 Phase**：—（無進行中 Phase）
- **當前焦點**：核心交付完成。對外 MCP server 已上線於 `https://zuyu-rag-backend.onrender.com/mcp/`；可在 Claude Desktop / 其他 MCP client 直接連
- **近期完成**：第三批 UI（CHANGE-016）；第二批 UI（CHANGE-014/015）；Vercel 回滾演練（VERIFY-006）；前後端上線（CHANGE-013）

---

## 當前焦點（1.6）

```
Phase 5（對外 MCP server）→ 🔄 規範文件補完 → 子任務「mcp_tools.py + /mcp 掛載 + 本機驗證 + README」
```

- 預計完成時間：規範完成；程式碼+本機驗證 1–2 個工作 session
- 信心程度：中高（Streamable HTTP 屬 MCP 標準、Python SDK 成熟；唯一未知是 FastAPI mount FastMCP 的 lifespan/path 細節，需以實作驗證）
- 上一個完成：規範文件四檔（spec/design/log/roadmap）對齊 F-09（2026-06-04，本回合）
- ⛔ 待人類：暫無（完全公開、Render Pro 已升、無 chat tool 已拍板）

---

## 阻塞與待決策（1.7）

| 項目 | 類型 | 說明 |
|---|---|---|
| ~~前端框架 React vs Vue~~ | ✅ 已解 | 拍板 **React**（2026-05-30，log DECISION-008，原 DECISION-003）|
| ~~Render 方案（免費 vs 付費）~~ | ✅ 已解 | Pro 方案（2026-06-04，使用者確認）|
| ~~對外 MCP server 範圍／工具集~~ | ✅ 已解 | 完全公開 + 只開資料工具 + 絕不開 chat（2026-06-04，DECISION-010）|

---

## Phase 結構（1.1）與進入條件（1.2）

| Phase | 名稱 | 目標 | 完成條件 | 狀態 |
|---|---|---|---|---|
| 1 | 資料管線 | 抓取並轉換全部繪本 | 95 本 `book_*.json` + `output_v2/` 三產物齊備且通過驗證 | ✅ |
| 2 | 查詢服務 | 可運作的後端 API | F-01~F-04、F-07、F-08 驗收通過，prompt caching 生效 | ✅ |
| 3 | 前端介面 | 完整對話 + 瀏覽網頁 | 三個主要畫面實作完成，Playwright 截圖比對通過 | ✅ |
| 4 | 上線部署 | prod 可用 | 前端 Vercel + 後端 Render 部署，prod `/api/health` 正常 | ✅ |
| 5 | 對外 MCP server | 其他聊天機器人可查繪本資料 | F-09：`/mcp` 通過 MCP Inspector 跑完 initialize/tools/list/tools/call，四工具回傳與 JSON 一致；對外 README 上線 | ✅ |

**進入條件：**
- 進入 Phase 2：Phase 1 的 `output_v2/` 三產物齊備 ✅（已滿足）
- 進入 Phase 3：Phase 2 後端 API 穩定且 `/docs` 可測 ✅ + 前端框架已拍板 ✅（React）→ **已滿足**
- 進入 Phase 4：Phase 3 前端在 local 串接後端成功 + 回滾預案就緒（design.md 已備）
- 進入 Phase 5：Phase 4 prod 後端穩定 ✅ + DECISION-010 範圍拍板 ✅ → **已滿足**

---

## 工作分解結構 WBS（1.3 / 1.4 葉節點檢核 / 1.5 狀態）

> 葉節點皆可機器驗證（1.4）；父節點狀態由子節點聚合（1.5）；預設只展開當前 Phase（1.11）。

### ✅ Phase 1：資料管線（已完成）

- ✅ 功能群：爬蟲（F-05）
  - ✅ probe 偵察 API endpoint → 驗證：`findings_*.txt` 找到 `get_data.php` ✅
  - ✅ 抓清單 → 驗證：`index.json` 95 筆 ✅
  - ✅ 全量抓取 → 驗證：`output/books/` 有 95 個 `book_*.json` ✅
- ✅ 功能群：格式轉換（F-06）
  - ✅ 中文去重 + 變體保留 → 驗證：`--check 167` 顯示 5/18 頁變體正確 ✅
  - ✅ 產生三產物 → 驗證：`index.json`/`summary.jsonl`/`books/` 齊備，summary ~15 萬字元 ✅

### ✅ Phase 2：查詢服務（已完成）

- ✅ 功能群：後端 API（F-01~F-04、F-07、F-08 全綠）
  - ✅ FastAPI 骨架 + 載入 summary → 驗證：`/api/health` 回 `books_loaded:95` ✅
  - ✅ F-01 自然語言找書
    - ✅ 雛形可回答 → 驗證：`/api/chat` 回應含真實書本 ID
    - ✅ prompt caching 驗證 → 驗證：第二次呼叫 `cache_read_input_tokens=125120 > 0` ✅（`backend/verify_cache.py`，2026-05-30）
    - ✅ 幻覺防護 → 驗證：`backend/tests/test_chat.py` 斷言回應 #編號 ∈ index.json 通過（找書＋離題各一案，2026-05-30）✅
  - ✅ F-02 繪本內容問答
    - ✅ `fetch_book_detail` 工具可運作 → 驗證：指定族語回傳該族該頁文字一致
    - ✅ 加入回歸測試固定案例 → 驗證：`tests/test_chat.py` 通過（tool 回傳 vs JSON 逐字一致＋端到端 grounded，2026-05-30）✅
  - ✅ F-03 多輪對話 → 驗證：`tests/test_chat.py::test_multiturn_refers_to_previous` 通過（第二輪 #編號 ∩ 第一輪非空，2026-05-30）✅
  - ✅ F-04 繪本瀏覽 → 驗證：`/api/books` 95 筆、`/api/books/{id}` 正確、404 處理 ✅
  - ✅ F-07 SSE streaming → 驗證：`/api/chat/stream` 回 event-stream ✅
  - ✅ F-08 健康檢查 → 驗證：`/api/health` 數字正確 ✅
- ✅ 功能群：後端品質
  - ✅ 建立 `ruff` 設定 + 通過 → 驗證：`ruff check .` All checks passed（`pyproject.toml`，2026-05-30）✅
  - ✅ 建立測試（pytest 接線）→ 驗證：`pytest` 預設 1 免費案例綠、4 個 `live` 案例標記略過；`pytest -m live` 可跑付費案例 ✅
  - ✅ 成本監控 → 驗證：每次呼叫 log 印 `usage[..]: input/output/cache_read/cache_write`（`log_usage`，2026-05-30）✅

### ✅ Phase 3：前端介面（已完成）

- ✅ 前端框架拍板 → React（DECISION-008，2026-05-30）
- ✅ 對話畫面（F-01/03/07）→ Vite+React+TS 骨架、SSE streaming 串接；Playwright 實測空狀態/單輪/多輪皆正常（2026-05-30）✅
  - 修掉多輪 400 bug（model_dump 夾帶 parsed_output；見 log LESSON-007）；加連線失敗重試
- ✅ 串接後端 → local 前端打 local 後端完整跑通多輪對話 ✅
- ✅ 繪本瀏覽畫面（F-04）→ 卡片網格 + 級別/語法/族別過濾，Playwright 實測 95 本顯示正常 ✅
- ✅ 繪本閱讀畫面（F-02）→ 逐頁圖片 + 華語 + 族語切換 + 音檔；族語逐字直接渲染 JSON（變音符號正確保留）✅

### ⬜ Phase 4：上線部署（未開始）

- ✅ 後端上 Render → 驗證：prod `/api/health` 回 `books_loaded:95` ✅（`https://zuyu-rag-backend.onrender.com`，2026-05-31）
- ✅ 前端上 Vercel → 驗證：prod 網址可開、可對話 ✅（`https://klokah-drawing-rag.vercel.app`，Playwright 實測多查詢，2026-05-31）
- ✅ CORS 白名單 + 金鑰環境變數 → 驗證：正式網域 ACAO 放行、`evil.com` 無 ACAO 被擋、金鑰僅在 Render 環境變數（curl + Playwright 實測，2026-05-31）✅
- 🔄 回滾演練 → Vercel ✅：`vercel rollback 705b0djqv`（退）→ `vercel promote 457ibcbto`（切回），`vercel inspect` 證實別名指向移動並復原、Playwright 證功能完好（CLI，2026-05-31）。Render ⏸️：後端僅單一版本（`f970d48`），無差異版可回滾，順延至有第二個後端部署時補做（Vercel 免費方案亦僅支援回滾前一版）

### ✅ Phase 5：對外 MCP server（已完成上線）

- ✅ 規範文件補完 → spec.md 加 F-09、design.md 對外介面表加 `/mcp` 列、log.md DECISION-010、roadmap.md Phase 5（2026-06-04）✅
- 🔄 功能群：對外 MCP server（F-09）
  - ✅ 實作 `backend/mcp_tools.py` → 驗證：四工具註冊、`verify_mcp.py` 16 項全綠（含族語逐字一致）✅
  - ✅ `query.py` 掛載 `/mcp` + per-IP sliding-window rate limit（自寫 20 行，無新增 dep）→ 驗證：本機啟動 `/api/health` 200、`/mcp/` initialize 200、70 連打後第 49 次起 429（CHANGE-017，2026-06-04）✅
  - ✅ `backend/requirements.txt` 加 `mcp`、`render.yaml` 加 `MCP_RATE_LIMIT` 佔位 → 驗證：本機 `pip install` 已驗，prod 留待 Render build ✅
  - ✅ MCP client 本機驗證 → 改用官方 `mcp` Python SDK 直接驗（`verify_mcp_http.py`），等同 Inspector：initialize/tools/list/4×tools_call/錯誤路徑/429 探針全綠（VERIFY-007，2026-06-04）✅
  - ✅ 寫 repo 根 `MCP.md` → 含 prod URL、四工具 schema、Claude Desktop config 範本、Python SDK 與 curl 範例 ✅
  - ✅ 部署 prod → 驗證：`git push` 觸發 Render auto-deploy；對 prod `/mcp/` 跑 `verify_mcp_http.py` 全綠（initialize/4 工具/錯誤路徑/429 全 PASS，2026-06-04，VERIFY-008）✅

---

## 跨 phase 引用（1.8）

- Phase 3 → Phase 2（硬依賴）：前端串接需後端 API 穩定
- Phase 4 → Phase 3（硬依賴）：部署前需 local 全鏈路跑通
- Phase 3 前端框架決策 → Phase 3 全部子任務（硬依賴）：未拍板無法起步
- Phase 4 → design.md 回滾預案（軟依賴）：已就緒，部署即可演練
- Phase 5 → Phase 2（軟依賴）：MCP 工具共用 `query.py` 已載入的 `INDEX_DATA`/`SUMMARY_TEXT`/`load_book_detail()`
- Phase 5 → Phase 4（軟依賴）：與 `/api/*` 共用同一 Render 服務，部署管線復用

---

## 細項粒度規範（1.10）

- 葉節點須 30 分鐘內可完成、有明確機器驗證條件
- AI 拆得太粗時人類可要求重拆
- **機器優先驗收**：能自動驗的葉節點 AI 自己驗（API 用 `curl`/`pytest`、視覺用 Playwright MCP 截圖比對），不丟回人類；驗完才勾選
- 任務須引用 spec.md 功能 ID（可追溯）

---

## 樹狀展開狀態（1.11）

- 預設只展開當前 Phase（Phase 5）與當前焦點路徑
- Phase 1–4 已折疊為摘要（全 ✅，回滾僅 Render 順延）
