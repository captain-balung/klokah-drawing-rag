# roadmap.md — 族語 E 樂園繪本 RAG 駕駛艙

> 人類監督 AI 的核心介面，也是專案進度的單一真相來源。
> 修改者：AI 主導（持續更新進度與狀態）。首要讀者是人類監督者。

**狀態符號**：✅ 已完成　🔄 進行中　⬜ 未開始　⛔ 阻塞中　⏭️ 已跳過

---

## 進度摘要（1.9）

> 整體 ~95%（Phase 1/2/3 完成並驗證；Phase 4 後端+前端皆上線並實測，僅剩「回滾演練」一項）

- **整體**：約 95%（Phase 1/2/3 完成；Phase 4 後端 Render + 前端 Vercel 均上線並端到端實測通過，CORS 白名單生效；剩回滾演練）
- **當前 Phase**：Phase 4（部署）——**後端 + 前端皆已上線**（2026-05-31）；prod 對話、CORS 白名單正面/負面驗證全綠
- **當前焦點**：僅剩「回滾演練」（在 Render/Vercel 各回滾一次）即可完成 Phase 4
- **近期完成**：前端上 Vercel（`klokah-drawing-rag.vercel.app`）+ 後端上 Render（`zuyu-rag-backend.onrender.com`）+ CORS 白名單收緊並驗證；GitHub 首次推送；Phase 3 三畫面

---

## 當前焦點（1.6）

```
Phase 4（部署）→ ✅ 推 GitHub 完成 → 子任務「Render 後端 + Vercel 前端」→ ⛔ 卡在人類確認點（雲端帳號 / 金鑰 / CORS）
```

- 預計完成時間：取決於人類操作時間
- 信心程度：中（程式與設定就緒；部署多為人類確認點）
- 上一個完成：GitHub private repo 首次推送成功（2026-05-31，`captain-balung/klokah-drawing-rag`）
- ⛔ 待人類：① ~~建 GitHub repo + 推送~~ ✅ 完成　② Render 連 repo + 填 `ANTHROPIC_API_KEY`　③ Vercel 設 `VITE_API_BASE` + 部署　④ 回填後端 `CORS_ORIGINS`

---

## 阻塞與待決策（1.7）

| 項目 | 類型 | 說明 |
|---|---|---|
| ~~前端框架 React vs Vue~~ | ✅ 已解 | 拍板 **React**（2026-05-30，log DECISION-008，原 DECISION-003）|
| Render 方案（免費 vs 付費）| 待人類決策 | 影響冷啟動體驗（見 design.md 已知問題）；Phase 4 才需拍板 |

---

## Phase 結構（1.1）與進入條件（1.2）

| Phase | 名稱 | 目標 | 完成條件 | 狀態 |
|---|---|---|---|---|
| 1 | 資料管線 | 抓取並轉換全部繪本 | 95 本 `book_*.json` + `output_v2/` 三產物齊備且通過驗證 | ✅ |
| 2 | 查詢服務 | 可運作的後端 API | F-01~F-04、F-07、F-08 驗收通過，prompt caching 生效 | ✅ |
| 3 | 前端介面 | 完整對話 + 瀏覽網頁 | 三個主要畫面實作完成，Playwright 截圖比對通過 | ✅ |
| 4 | 上線部署 | prod 可用 | 前端 Vercel + 後端 Render 部署，prod `/api/health` 正常 | 🔄 |

**進入條件：**
- 進入 Phase 2：Phase 1 的 `output_v2/` 三產物齊備 ✅（已滿足）
- 進入 Phase 3：Phase 2 後端 API 穩定且 `/docs` 可測 ✅ + 前端框架已拍板 ✅（React）→ **已滿足**
- 進入 Phase 4：Phase 3 前端在 local 串接後端成功 + 回滾預案就緒（design.md 已備）

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
- ⬜ 回滾演練 → 驗證：實際在 Render/Vercel 各回滾一次成功

---

## 跨 phase 引用（1.8）

- Phase 3 → Phase 2（硬依賴）：前端串接需後端 API 穩定
- Phase 4 → Phase 3（硬依賴）：部署前需 local 全鏈路跑通
- Phase 3 前端框架決策 → Phase 3 全部子任務（硬依賴）：未拍板無法起步
- Phase 4 → design.md 回滾預案（軟依賴）：已就緒，部署即可演練

---

## 細項粒度規範（1.10）

- 葉節點須 30 分鐘內可完成、有明確機器驗證條件
- AI 拆得太粗時人類可要求重拆
- **機器優先驗收**：能自動驗的葉節點 AI 自己驗（API 用 `curl`/`pytest`、視覺用 Playwright MCP 截圖比對），不丟回人類；驗完才勾選
- 任務須引用 spec.md 功能 ID（可追溯）

---

## 樹狀展開狀態（1.11）

- 預設只展開當前 Phase（Phase 2）與當前焦點路徑
- Phase 1 已折疊為摘要（全 ✅）
- Phase 3、4 維持未展開細節，進入時再展開
