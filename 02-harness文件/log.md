# log.md — 族語 E 樂園繪本 RAG 變更日誌

> 事後追究的唯一依據。修改者：AI 自動寫入，**append-only**（既有條目不可改，發現錯誤用「修正」類型新增條目指向舊條目）。
>
> 每條格式：時間戳 / 類型 / 範圍與摘要 / 觸發來源 / 決策內容（僅決策類型）/ 風險等級
> 類型：變更 / 決策 / 修正　｜　觸發來源：人類指示 / QA 退件 / 自動偵測 / AI 自主判斷　｜　風險：低 / 中 / 高 / 不可逆

---

## DECISION-001

- **時間戳**：2026-05-28T09:00:00+08:00
- **類型**：決策
- **範圍與摘要**：後端語言選用 Python，延續既有爬蟲/轉換工具的一致性
- **觸發來源**：人類指示
- **決策內容**：
  - 脈絡：需選後端語言
  - 選項：Python / Node.js
  - 決定：Python
  - 後果：與既有 `scraper.py`、`transformer.py` 一致；Anthropic Python SDK 成熟
- **風險等級**：低

## DECISION-002

- **時間戳**：2026-05-28T09:05:00+08:00
- **類型**：決策
- **範圍與摘要**：後端框架選 FastAPI（async、自動文件、SSE、Pydantic）
- **觸發來源**：AI 自主判斷
- **決策內容**：脈絡：需 Web 框架支援 streaming → 選項：FastAPI / Flask → 決定：FastAPI → 後果：SSE 與型別驗證內建，學習與維護成本低
- **風險等級**：低

## DECISION-003

- **時間戳**：2026-05-28T09:10:00+08:00
- **類型**：決策
- **範圍與摘要**：前端框架（React vs Vue）暫緩拍板，待 Phase 3 起步前決定
- **觸發來源**：人類指示
- **決策內容**：脈絡：前端需框架但不影響後端 → 選項：React / Vue → 決定：暫緩，列入 roadmap 阻塞 → 後果：Phase 3 起步前須先解此決策
- **風險等級**：低

## DECISION-004

- **時間戳**：2026-05-28T09:20:00+08:00
- **類型**：決策
- **範圍與摘要**：部署架構定為「前端 Vercel + 後端 Render」，後端不上 Vercel
- **觸發來源**：人類指示（經 AI 提出技術風險後共識）
- **決策內容**：
  - 脈絡：人類初步傾向 Vercel；AI 指出 Vercel serverless 與本後端（SSE 長連線 + prompt caching 需進程持續）架構衝突
  - 選項：(a) 全上 Vercel 並改架構（犧牲 caching 與 streaming）；(b) 前端 Vercel + 後端 Render；(c) 全上 Render
  - 決定：(b)
  - 後果：各用所長，prompt caching 與 SSE 正常；代價是要管兩個部署平台
- **風險等級**：中

## DECISION-005

- **時間戳**：2026-05-28T09:25:00+08:00
- **類型**：決策
- **範圍與摘要**：LLM 用 Claude API，並強制啟用 prompt caching 控制成本
- **觸發來源**：人類指示（成本控制為明確需求）
- **決策內容**：脈絡：summary ~10 萬 token 每次重送成本高 → 選項：每次全送 / prompt caching → 決定：caching（system block 設 ephemeral）→ 後果：5 分鐘內後續請求 cached 部分僅 10% 成本
- **風險等級**：低

## DECISION-006

- **時間戳**：2026-05-28T09:30:00+08:00
- **類型**：決策
- **範圍與摘要**：不使用任何資料庫（無 RDBMS、無 vector DB、無對話持久化）
- **觸發來源**：人類提問後 AI 分析 + 共識
- **決策內容**：
  - 脈絡：詢問是否需資料庫
  - 選項：(a) 加 vector DB 做傳統 RAG；(b) 加 RDBMS 存對話；(c) 全無資料庫，靜態 JSON + 前端管對話
  - 決定：(c)
  - 後果：資料量小可整包進 context，省工程；後端無狀態可水平擴展；未來若需跨裝置歷史/帳號再引入 Postgres
- **風險等級**：低

---

## 踩雷紀錄

## CORRECTION/LESSON-001

- **時間戳**：2026-05-28T01:00:00+08:00
- **類型**：修正
- **範圍與摘要**：Windows 上 `python3` 指令連到 Microsoft Store stub，執行靜默無反應；正確做法是用 `python`
- **觸發來源**：自動偵測（使用者回報指令無反應）
- **風險等級**：低
- **備註**：已晉升至 `ai-rules.md` 硬性教訓清單（風險雖低但會造成卡關且易重複）

## LESSON-002

- **時間戳**：2026-05-28T09:18:00+08:00
- **類型**：修正
- **範圍與摘要**：原規劃後端上 Vercel，發現 serverless 與 FastAPI 長連線 SSE + prompt caching 衝突；改後端走 Render
- **觸發來源**：AI 自主判斷（在寫設計文件前主動指出風險）
- **風險等級**：中
- **備註**：已晉升至 `ai-rules.md` 硬性教訓清單（高風險架構決策，避免未來重蹈）

---

## 初始建檔

## CHANGE-001

- **時間戳**：2026-05-28T10:00:00+08:00
- **類型**：變更
- **範圍與摘要**：依小型軟體生產規範體系，建立 6 份專案文件（README/spec/ai-rules/design/roadmap/log）
- **觸發來源**：人類指示
- **風險等級**：低

---

## DECISION-007

- **時間戳**：2026-05-29T23:45:36+08:00
- **類型**：決策
- **範圍與摘要**：重構專案目錄為 `backend/` + `data-pipeline/` + `frontend/`，對齊文件描述（消除「文件假設 backend/frontend、實作全擠在 01-前期爬蟲/」的落差）
- **觸發來源**：人類指示（AI 提出方向，人類選「搬實作對齊文件」）
- **決策內容**：
  - 脈絡：spec/design 假設乾淨的 backend/frontend 架構，但 query.py/scraper.py/transformer.py/output*/ 全在 `01-前期爬蟲/`，且前端不存在
  - 選項：(a) 搬實作對齊文件；(b) 改文件遷就現狀
  - 決定：(a)
  - 後果：`backend/`（query.py、test_query.py、requirements.txt、.env.example）；`data-pipeline/`（scraper.py、transformer.py、requirements.txt、probe/、output/、output_v2/）；`frontend/` 佔位。query.py 的 `DATA_DIR` 改為 `../data-pipeline/output_v2`。原 `01-前期爬蟲/` 僅剩 `__pycache__`（待人類確認刪除）
- **風險等級**：中（動到檔案位置；非 git 專案無法 git revert，但搬移可逆）

## CHANGE-002

- **時間戳**：2026-05-29T23:45:36+08:00
- **類型**：變更
- **範圍與摘要**：`backend/query.py` 的 `MODEL` 由失效的 `claude-opus-4-5` 更正為現行 `claude-opus-4-8`（維持 Opus 家族原意圖，見 DECISION-005）；同步補 `backend/requirements.txt`、`data-pipeline/requirements.txt`、`frontend/README.md`；更新 README/design/spec/ai-rules 的路徑與專案結構
- **觸發來源**：人類指示
- **風險等級**：低
- **備註**：若日後成本吃緊，可改 `claude-sonnet-4-6`（屬模型決策，須再記一筆）

## CORRECTION/LESSON-003

- **時間戳**：2026-05-29T23:45:36+08:00
- **類型**：修正
- **範圍與摘要**：偵測到 `.env.example` 內含真實格式的 Anthropic API 金鑰（`sk-ant-api03-kNRs…2gAA`，僅記頭尾）。`.env.example` 為範本檔不應含真實金鑰——已將該值換回佔位字串
- **觸發來源**：自動偵測（AI 讀檔時發現，依 ai-rules §6 #4/#5 回報）
- **風險等級**：高（金鑰外洩；檔案位於會同步雲端的 Google Drive 資料夾）
- **後續必辦（人類）**：至 Anthropic Console 立即撤銷該金鑰並重發；新金鑰只放 `.env` 或平台環境變數
- **備註**：清除後，`backend/.env.example` 又出現第二把真實格式金鑰（`sk-ant-api03-yt1P…UPcw-hjOckQAA`，使用者編輯），已再次回報請求撤銷與確認。建議晉升 ai-rules 硬性教訓：範本檔嚴禁貼真實金鑰

---

## CHANGE-003

- **時間戳**：2026-05-30T00:05:00+08:00
- **類型**：變更
- **範圍與摘要**：推進 Phase 2 / F-01「prompt caching 驗證」葉節點。新增/修改：`backend/query.py` 補 `load_dotenv(..., override=True)` 讓 `.env` 成為本機金鑰權威來源；新增專案根 `.gitignore`（排除 `.env`、`__pycache__`、`node_modules` 等）；新增 `backend/verify_cache.py` 驗證腳本（重用 `build_system_blocks()`）
- **觸發來源**：人類指示（推進 roadmap）＋ AI 自主判斷（override 修法、驗證腳本設計）
- **風險等級**：低

## VERIFY-001

- **時間戳**：2026-05-30T00:05:00+08:00
- **類型**：變更（驗證紀錄）
- **範圍與摘要**：prompt caching 命中確認。`verify_cache.py` 連打兩次同 system block：第一次 `cache_creation_input_tokens=125120`、`cache_read=0`；第二次 `cache_creation=0`、`cache_read_input_tokens=125120`。成本鐵則（DECISION-005）實證生效，roadmap 該葉節點打勾
- **觸發來源**：自動驗證（`curl`/腳本，機器優先）
- **風險等級**：低

## CORRECTION/LESSON-004

- **時間戳**：2026-05-30T00:05:00+08:00
- **類型**：修正
- **範圍與摘要**：踩雷——執行環境啟動時帶有「空字串」`ANTHROPIC_API_KEY`（持久 User/Machine 層皆未設定，研判來自 shell session/profile 注入），導致 `load_dotenv` 預設 `override=False` 不覆蓋它，後端讀不到金鑰、API 認證失敗。修法：`load_dotenv(override=True)`
- **觸發來源**：自動偵測（驗證時 API 回 auth error，逐步診斷定位）
- **風險等級**：低
- **備註**：未晉升硬性教訓（首次、低風險、清單從簡）；若再發生再晉升

---

## CHANGE-004

- **時間戳**：2026-05-30T00:10:00+08:00
- **類型**：變更
- **範圍與摘要**：推進 Phase 2 / F-01「幻覺防護」葉節點。`backend/query.py`：(1) system prompt 要求以 `#編號` 格式標註並強化「只能提及資料庫存在的繪本，否則明說沒有」；(2) 新增 `VALID_BOOK_IDS` 與 `extract_book_ids()`；(3) `/api/chat` 後處理偵測到不存在 ID 時記 warning（不改寫回應，維持忠實呈現）。新增 `backend/tests/test_chat.py` 回歸測試（可 pytest 或獨立執行）
- **觸發來源**：人類指示（推進 roadmap）＋ AI 自主判斷（`#id` 格式與抽取器設計）
- **風險等級**：低
- **備註**：`#編號` 為對外回應文字格式微調，非破壞性 API 變更；未來前端可據此連結繪本

## VERIFY-002

- **時間戳**：2026-05-30T00:10:00+08:00
- **類型**：變更（驗證紀錄）
- **範圍與摘要**：F-01 幻覺防護回歸測試通過。`test_chat.py` 兩案全綠：找書查詢（環保／分享）引用的 #編號 皆 ∈ index.json；離題查詢（量子力學）未杜撰任何 ID。附帶觀察：三次呼叫第 2、3 次 `cache_read_input_tokens=125668`，caching 跨查詢持續命中
- **觸發來源**：自動驗證（機器優先）
- **風險等級**：低

---

## CHANGE-005

- **時間戳**：2026-05-30T00:20:00+08:00
- **類型**：變更
- **範圍與摘要**：推進 Phase 2 / F-02「繪本內容問答回歸測試」。`tests/test_chat.py` 新增：(1) `test_fetch_book_detail_text_matches_json`（零成本確定性：工具回傳族語/華語文字 vs `book_*.json` 逐字一致）；(2) `test_end_to_end_grounds_on_real_data`（端到端：須實際呼叫 `fetch_book_detail` 取資料，內容含該族語文字，標點正規化後比對）。`query.py` system prompt 新增第 5 條「引用族語務必逐字、勿正規化特殊符號」
- **觸發來源**：人類指示（推進 roadmap）＋ AI 自主判斷（測試分層與設計取捨）
- **風險等級**：低

## VERIFY-003

- **時間戳**：2026-05-30T00:20:00+08:00
- **類型**：變更（驗證紀錄）
- **範圍與摘要**：F-02 回歸測試通過。確定性測試證實 `fetch_book_detail` 對 #167 各族各頁回傳與 JSON 逐字一致（spec 成功標準 #2）；端到端確認查詢會 grounded 於 `fetch_book_detail(book_id=167)` 且回應含該族語文字
- **觸發來源**：自動驗證（機器優先）
- **風險等級**：低

## CORRECTION/LESSON-005

- **時間戳**：2026-05-30T00:20:00+08:00
- **類型**：修正（設計決定）
- **範圍與摘要**：發現 LLM 在對話 prose 會把族語特殊標點正規化（喉塞音 `’` U+2019 → ASCII `'`），與「忠實呈現族語原貌」精神相違。設計決定：**族語逐字忠實以資料層（`book_*.json` / 前端閱讀畫面直接渲染）為準，不以 LLM 對話文字為逐字來源**；prompt 加 best-effort 指示，F-02 機器驗收用 tool-match。已記入 design.md 已知問題
- **觸發來源**：自動偵測（端到端測試失敗，逐字比對定位到標點差異）
- **風險等級**：中（涉及族語忠實性，spec 核心精神）
- **備註**：未晉升硬性教訓清單（已落為架構決定 + design.md 記載）；前端實作 F-02 閱讀畫面時須遵守「逐字渲染資料、不複述 LLM prose」

---

## CHANGE-006

- **時間戳**：2026-05-30T09:30:00+08:00
- **類型**：變更
- **範圍與摘要**：推進 Phase 2 / F-03「多輪對話」。`tests/test_chat.py` 新增 `test_multiturn_refers_to_previous`：第一輪推薦數本、第二輪沿用對話歷史問「其中…」，斷言第二輪 #編號 與第一輪交集非空且皆有效（spec 成功標準 #3）。後端 API 功能群（F-01~F-04、F-07、F-08）至此全綠
- **觸發來源**：人類指示（推進 roadmap）
- **風險等級**：低

## VERIFY-004

- **時間戳**：2026-05-30T09:30:00+08:00
- **類型**：變更（驗證紀錄）
- **範圍與摘要**：F-03 多輪對話測試通過。第二輪正確指涉第一輪推薦結果（ID 交集非空、無捏造）；第二輪請求 `cache_read_input_tokens=125766`，多輪對話下 caching 持續命中
- **觸發來源**：自動驗證（機器優先）
- **風險等級**：低

## CHANGE-007

- **時間戳**：2026-05-30T09:32:00+08:00
- **類型**：變更
- **範圍與摘要**：後端品質群「成本監控」葉節點。`query.py` 新增 `log_usage()`，在 `run_agent_loop` 與 streaming 路徑每次呼叫後輸出 `usage[where]: input/output/cache_read/cache_write` 單行日誌（支撐 spec 成本鐵則之「成本可見」）。離線以假 usage 物件驗證格式正確
- **觸發來源**：人類指示（推進 roadmap，無新依賴可自主完成）
- **風險等級**：低

## DECISION-008

- **時間戳**：2026-05-30T09:35:00+08:00
- **類型**：決策
- **範圍與摘要**：前端框架拍板 **React**，解除 DECISION-003 暫緩、Phase 3 起步阻塞
- **觸發來源**：人類指示
- **決策內容**：脈絡：Phase 2 完成、需起步 Phase 3 → 選項：React / Vue → 決定：React（生態最大、參考資源多、與 Vercel 部署搭配成熟）→ 後果：Phase 3 以 React 建置；指向 DECISION-003 之裁定
- **風險等級**：低

## CHANGE-008

- **時間戳**：2026-05-30T09:35:00+08:00
- **類型**：變更
- **範圍與摘要**：後端品質群「ruff + pytest」收尾。安裝 ruff/pytest（記入 `backend/requirements-dev.txt`）；新增根 `pyproject.toml`（ruff：select E/F/I/UP/B、ignore E501 因 CJK；pytest：`testpaths=backend/tests`、`live` marker、預設 `-m 'not live'`）。修掉 9 個 lint（自動 14＋手動 E741/B007×2）；`tests/test_chat.py` 4 個付費案例加 `@pytest.mark.live`。`ruff check` 全綠、`pytest` 預設 1 免費案例綠
- **觸發來源**：人類指示（同意安裝新依賴）
- **風險等級**：低

## CORRECTION/LESSON-006

- **時間戳**：2026-05-30T09:35:00+08:00
- **類型**：修正
- **範圍與摘要**：在 `pyproject.toml` 設了 `live` marker 與 `addopts = -m 'not live'`，但**忘記在測試函式加 `@pytest.mark.live`**，導致第一次 `pytest` 仍跑了 4 個付費案例（額外 API 成本）。修法：補上 decorator，之後預設 `pytest` 只跑免費案例
- **觸發來源**：自動偵測（pytest 跑了 82 秒且有 API 日誌，發現未如預期略過）
- **風險等級**：低（小額成本；對「成本可控」鐵則為輕微違反，已修正）
- **備註**：教訓——marker 設定與套用要同步；付費測試預設應確實被排除

---

## CHANGE-009

- **時間戳**：2026-05-30T10:10:00+08:00
- **類型**：變更
- **範圍與摘要**：Phase 3 起步。`frontend/` 建立 Vite + React + TypeScript 骨架；`src/api.ts`（SSE streaming 客戶端 + 訊息顯示工具）、`src/App.tsx`（對話畫面：氣泡、串流游標、工具呼叫提示、多輪歷史）、`App.css`/`index.css`（中性色閱讀工具風格、字型涵蓋族語變音符號）。以 Playwright 實測：空狀態、單輪、多輪皆正常
- **觸發來源**：人類指示（同意起 Phase 3、npm install）
- **風險等級**：低

## CORRECTION/LESSON-007

- **時間戳**：2026-05-30T10:10:00+08:00
- **類型**：修正
- **範圍與摘要**：**多輪對話 bug**——`query.py` 以 `block.model_dump()` 序列化 assistant 內容，夾帶 SDK 內部欄位 `parsed_output:null`（streaming 路徑）。把該歷史回傳當下一輪輸入時，Anthropic API 回 400：`messages.1.content.0.text.parsed_output: Extra inputs are not permitted`。使用者在前端第二輪即踩中。修法：兩處 model_dump 改 `exclude_none=True`
- **觸發來源**：自動偵測（前端實測出現 error 事件 → 查後端日誌 + network 請求體定位）
- **風險等級**：中（破壞所有多輪對話；F-03 非串流測試未覆蓋 streaming 路徑故漏網）
- **備註**：已補回歸測試 `test_streaming_multiturn_no_error`（TestClient in-process 跑 /api/chat→/api/chat/stream 多輪，斷言無 error 事件）；教訓——streaming 與非串流序列化路徑都要有測試覆蓋

---

## DECISION-009

- **時間戳**：2026-05-30T10:30:00+08:00
- **類型**：決策
- **範圍與摘要**：正式環境 LLM 改用 **Sonnet 4.6**（原 Opus 4.8）以控制公開端點成本
- **觸發來源**：人類指示（上線前成本防護）
- **決策內容**：脈絡：公開端點無帳號系統，付費 Opus 易被濫用 → 選項：Sonnet / Opus / 加 gate → 決定：預設 Sonnet 4.6（成本約 Opus 1/5，本任務品質足夠），`CLAUDE_MODEL` 環境變數可覆寫 → 後果：每次呼叫成本大降；如需更高品質可隨時切回 Opus
- **風險等級**：低

## CHANGE-010

- **時間戳**：2026-05-30T10:30:00+08:00
- **類型**：變更
- **範圍與摘要**：上線前置。`query.py`：`MODEL` 改 `os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")`；CORS 改由 `CORS_ORIGINS` 環境變數限定（預設 `*`，`allow_credentials=False`）。新增根 `render.yaml`（Render Blueprint：plan starter 常駐、rootDir backend、healthCheckPath、env 佔位）。Render 方案拍板付費常駐（解 roadmap 待決項）
- **觸發來源**：人類指示（同意部署、選 Sonnet/Paid）
- **風險等級**：中（涉及正式部署設定；金鑰/CORS 仍待 Dashboard 人工確認）

## VERIFY-005 / CHANGE-011

- **時間戳**：2026-05-30T10:35:00+08:00
- **類型**：變更（含診斷）
- **範圍與摘要**：使用者回報前端第二輪「network error」。診斷：以真實 HTTP 串流客戶端重現兩輪皆成功（turn2 收 377 字、無 error）→ 判定非程式 bug，而是「為換 Sonnet 重啟後端的數秒連線空窗」使用者剛好打中。改善前端韌性：`App.tsx` 錯誤改友善訊息（辨識連線層失敗）並加「重試」按鈕（保存當輪歷史重送，不重複 append）；`App.css` 對應樣式。tsc 通過、Playwright 多輪實測無誤
- **觸發來源**：QA 退件（使用者回報）→ 自動診斷 + 修補
- **風險等級**：低
- **備註**：操作教訓——使用者實測期間避免重啟後端；若必須，先告知。部署用的正式環境為常駐，不會有此空窗

---

## CHANGE-012

- **時間戳**：2026-05-30T11:00:00+08:00
- **類型**：變更
- **範圍與摘要**：補完 Phase 3 兩個畫面（部署等待人類期間）。`App.tsx` 重構為外殼（頂部導覽 + 視圖切換）；抽出 `components/ChatView.tsx`；新增 `components/BrowseView.tsx`（F-04：卡片網格 + 級別/語法/族別過濾，串 `/api/books`）、`components/ReaderView.tsx`（F-02：逐頁圖片 + 華語 + 族語切換 + 音檔，**族語逐字直接渲染 JSON**）；`api.ts` 加 `BookSummary`/`BookDetail` 型別與 `fetchBooks`/`fetchBook`；`App.css` 對應樣式。Playwright 實測：瀏覽 95 本顯示、過濾器、開卡進閱讀、族語變音符號正確保留
- **觸發來源**：人類指示（趁部署等待往下做）
- **風險等級**：低
- **備註**：Phase 3 三畫面（對話/瀏覽/閱讀）至此全部完成；F-02 閱讀畫面遵守「族語逐字以資料層為準」設計決定（LESSON-005）

## CHANGE-013

- **時間戳**：2026-05-31T16:05:00+08:00
- **類型**：變更
- **範圍與摘要**：Phase 4 上線完成。① GitHub 首次推送（`captain-balung/klokah-drawing-rag`，無金鑰）；② 後端以 Render Blueprint 部署（`zuyu-rag-backend.onrender.com`，**free 方案**，Dashboard 填 `ANTHROPIC_API_KEY`/`CORS_ORIGINS`）；③ 前端 Vercel 部署（rootDir `frontend`、`VITE_API_BASE` 指向 Render，`klokah-drawing-rag.vercel.app`）；④ `CORS_ORIGINS` 由 `*` 收緊為正式網域。驗證（機器優先）：prod `/api/health` 回 `books_loaded:95`；Playwright 多查詢實測前端→後端對話 grounded、無幻覺；curl CORS 正面（正式網域回 ACAO）＋負面（`evil.com` 無 ACAO）
- **觸發來源**：人類指示（逐步操作雲端 Dashboard）＋ AI 自主驗證（curl/Playwright）
- **風險等級**：中（涉及正式對外部署）
- **備註**：`render.yaml` 實為 `plan: free`，與 CHANGE-010 文字「付費常駐」不一致——目前線上確為 free（閒置休眠、冷啟動約 50 秒），是否升級 starter 待人類決定。Phase 4 僅剩「回滾演練」。回滾演練需待有第二個部署版本才有意義（目前 Render/Vercel 各僅一個 commit 版本，無可回滾的前一版），擬併入「第二批修改」部署時實地演練

## LESSON-008

- **時間戳**：2026-05-31T16:05:00+08:00
- **類型**：修正
- **範圍與摘要**：AI 一度將「CORS 白名單」表述為 `spec.md` 的要求；使用者質疑後查證：`spec.md` 並無此要求，實際出處為 `design.md`（prod「CORS 限定前端網域」）與 `roadmap.md` Phase 4 驗收項。更正認知：`spec.md` 是最高仲裁文件，引用「spec 要求」前須實查，勿將 design/roadmap 的設計決定混稱為 spec 紅線
- **觸發來源**：自動偵測（使用者質疑 → AI 查證更正）
- **風險等級**：低

## CHANGE-014

- **時間戳**：2026-05-31T16:20:00+08:00
- **類型**：變更
- **範圍與摘要**：第二批①無障礙——對話字級放大。`App.css`：`.bubble` 改用 `var(--chat-font-size, 28px)`（預設 28px，原 16px）＋新增 `.chat__toolbar` 樣式。`ChatView.tsx`：新增字級 state（localStorage 持久化，範圍 18–40px、預設 28、步進 2）與 A−/A＋ 工具列，CSS 變數注入 `.view`。動機：目標使用者多為有老花的老師。驗證（Playwright）：預設 28px、A− 28→24、重整後 localStorage 還原 24、prod 部署後工具列在線；tsc + eslint 全綠
- **觸發來源**：人類指示（第二批優化，字級優先；尺寸經 20/24/28px 截圖比較後人類選 28px + 要可調鈕）
- **風險等級**：低
- **備註**：此 push 產生 Vercel 第二個部署版本，解鎖回滾演練（roadmap Phase 4 / 任務 #6）。繪本「閱讀畫面」內容字級未納入本次，待人類決定是否一併放大

## VERIFY-006

- **時間戳**：2026-05-31T16:45:00+08:00
- **類型**：變更（演練/驗證）
- **範圍與摘要**：Phase 4 回滾演練（Vercel）。經人類明確授權後以 Vercel CLI 執行：`vercel rollback 705b0djqv`（production 退回前一版）→ `vercel inspect klokah-drawing-rag.vercel.app` 證實別名改指向 705b0djqv → `vercel promote 457ibcbto`（切回最新版）→ inspect 證實復原 + Playwright 證工具列/28px 功能完好。「退得回、推得上」雙向驗證通過
- **觸發來源**：人類指示（回滾演練，明確授權動 production）＋ AI 自主執行驗證（CLI/Playwright，機器優先）
- **風險等級**：中（動到線上 production，但全程可逆且已即時復原）
- **備註**：① 踩到限制——Vercel **Hobby 方案只能回滾前一個部署**（跳更遠回 402，需升 Pro），故無法退到「無工具列」舊版，改以 production 指標移動客觀驗證。② Render 回滾順延：後端僅單一 commit 版本，無差異版可退，待有第二個後端部署時補做。③ 安全機制：首次 `vercel rollback --yes` 被 auto 模式分類器擋下（判定「用 CLI 看」非動 production 之授權），取得人類明確確認後才執行——機制運作正確

## CHANGE-015

- **時間戳**：2026-05-31T17:00:00+08:00
- **類型**：變更
- **範圍與摘要**：第二批②——對話回應 Markdown 渲染。新增依賴 `react-markdown` + `remark-gfm`（`npm install`，0 漏洞）。`ChatView.tsx`：助理訊息與串流文字改以 `<Markdown>`（react-markdown + remarkGfm）渲染，使用者訊息維持純文字；react-markdown 預設不渲染原始 HTML（安全）。`App.css`：新增 `.bubble--md` 樣式（標題/粗體/清單/表格框線/引用/code；標題用 `em` 隨 `--chat-font-size` 縮放）。動機：原本 `##`/`**`/表格以純文字顯示、版面雜亂。驗證：本機後端真實查詢 + prod 真實查詢（表格 35 格、標題、粗體、清單皆正確渲染、無殘留原始符號）；tsc + eslint 全綠
- **觸發來源**：人類指示（第二批優化，明確同意安裝新依賴）
- **風險等級**：低
- **備註**：忠實呈現——僅排版既有文字、不改字，符合 spec 精神。第二批兩項（字級放大 + Markdown 渲染）皆完成並上線

## CHANGE-016

- **時間戳**：2026-05-31T17:30:00+08:00
- **類型**：變更（含 bug 修復）
- **範圍與摘要**：第三批 UI。① **修 bug——對話切畫面後消失**：`messages` 與 books metadata 提升至 `App.tsx`（App 不卸載，故對話跨畫面保留）；`ChatView` 改吃 props、`BrowseView` 改吃共用 `books` prop（消除重複 `/api/books`）。② **新增 `ReferencedBooks` 右側面板**：從助理回應抽 `#編號`、對照 books 去重（最新在前）、顯示卡片含「該書第一頁封面縮圖」（`fetchBook` 以 ref 快取、失敗退純文字），點卡片開啟閱讀。`App.css` 加 `.chat-layout`/`.refbooks`/`.refcard` 樣式（≤680px 隱藏面板）。驗證（Playwright，本機+prod）：面板 2–5 卡片含縮圖全載入、切瀏覽再切回對話內容保留、點卡進閱讀正確；tsc + eslint 全綠
- **觸發來源**：人類指示（回報切畫面消失 bug + 提「顯示提到的繪本」功能；設計經詢問選「右側面板 + 封面縮圖」）
- **風險等級**：低
- **備註**：① catch 不吞例外——封面抓失敗以 `covers[id]=null` 標記、退為純文字卡片（非靜默）。② 封面圖直連原平臺 `web.klokah.tw`（與閱讀畫面一致），不經本後端

---

## DECISION-010

- **時間戳**：2026-06-04T00:00:00+08:00
- **類型**：決策
- **範圍與摘要**：新增「對外 MCP server」（F-09），讓其他聊天機器人/AI 助手以 Model Context Protocol 查詢繪本資料；範圍與紅線一併拍板
- **觸發來源**：人類指示（提出「對外做一個 MCP server」需求）＋ AI 提案技術選型與成本紅線
- **決策內容**：
  - 脈絡：Phase 1–4 已上線、後端 prod 穩定；使用者希望讓外部聊天機器人也能查 95 本繪本
  - 選項：(a) 把 `/api/chat` 包成 MCP tool（外部用我們的 Claude 推理）；(b) 只開純資料工具（外部用自己的 LLM）；(c) 不做
  - 決定：(b)，並補三項細節
    1. **對外範圍：完全公開** — 任何 MCP client 皆可連，**不設 token 認證**；以 per-IP rate limit（預設 60/min，環境變數 `MCP_RATE_LIMIT` 可調）防爬
    2. **絕不開 chat tool** — MCP 工具集僅含 `list_books` / `search_books` / `get_book` / `get_book_page` 四項純資料動作，零 LLM 成本
    3. **Render Pro 方案**（使用者確認已升級）— 解 MCP handshake 對冷啟動的容忍問題
  - 技術選型：MCP Python SDK 的 `FastMCP` + **Streamable HTTP transport**（取代已棄用的 HTTP+SSE）；以子 ASGI app 掛到既有 FastAPI 之 `/mcp`，共用 `INDEX_DATA`/`SUMMARY_TEXT`/`load_book_detail()`；`stateless_http=True`（無 session 狀態，符合公開查詢場景）
  - 後果：
    - 我們的 Anthropic 額度**不受**外部呼叫影響（純讀檔，零 LLM token 成本）
    - `/mcp` 對外公開、不套用 `CORS_ORIGINS` 白名單；其餘 `/api/*` 維持原 CORS 政策
    - 新增依賴：`mcp`（官方 Python SDK）、`slowapi`（rate limit）
    - 新增文件：repo 根 `MCP.md`（對外連線說明）
- **風險等級**：中（涉及對外公開端點與新外部依賴；無不可逆風險，可隨時 `git revert` 並從 Render 撤下 `/mcp` 子 app）

---

## CHANGE-017

- **時間戳**：2026-06-04T10:40:00+08:00
- **類型**：變更
- **範圍與摘要**：實作 F-09 對外 MCP server。新增 `backend/mcp_tools.py`（FastMCP + 四工具 `list_books`/`search_books`/`get_book`/`get_book_page`；資料層注入避免循環 import；嚴禁 import anthropic 守門條件設於驗證腳本）；`backend/query.py` 加 lifespan 起 MCP session manager、`app.mount("/mcp", ...)`、自寫 sliding-window per-IP rate limiter middleware（60/min 預設，環境變數 `MCP_RATE_LIMIT` 可覆寫）；`backend/requirements.txt` 加 `mcp`；`render.yaml` 加 `MCP_RATE_LIMIT` 佔位；根目錄新增 `MCP.md` 對外連線說明（Claude Desktop 設定、Python SDK、curl 範例）；新增 `backend/verify_mcp.py`（16 項零成本確定性檢查）與 `backend/verify_mcp_http.py`（端到端 MCP client + 429 rate-limit 探針）
- **觸發來源**：人類指示（按提案規劃自主執行）＋ AI 自主判斷（細節：rate limiter 用自寫 20 行避免新增 dep；`streamable_http_path="/"` 配 mount `/mcp` 讓最終 URL 為 `/mcp/`；`transport_security` 關 DNS rebinding protection 以利公開存取）
- **風險等級**：低（新功能，與既有 `/api/*` 互不影響；無不可逆性）
- **備註**：實際端點為 `/mcp/`（含結尾斜線，由 Starlette mount 約定）；MCP client SDK 對兩種寫法皆能處理

## VERIFY-007

- **時間戳**：2026-06-04T10:40:00+08:00
- **類型**：變更（驗證紀錄）
- **範圍與摘要**：F-09 對外 MCP 本機驗證全綠
  - 單元層（`python verify_mcp.py`）：16/16 PASS——`list_books` 含 4 種過濾、`search_books` 含空字串/上限保護、`get_book(167, 阿美語)` 對 `book_167.json` 第 1 頁逐字一致、`get_book_page` 同上、不存在 ID 丟 `ValueError`、原始碼斷言「未 `import anthropic`」
  - 端到端（`python verify_mcp_http.py`）：以官方 `mcp` Python SDK 對 `http://localhost:8000/mcp/` 跑 initialize → tools/list（回 4 工具）→ 4 個 call_tool（含族語逐字斷言）→ 1 個錯誤路徑（`get_book(99999)` 回 `isError`）全綠
  - Rate limit：對 `/mcp/` 連打 70 次後，第 49 次起回 429（含 `Retry-After: 60`），總計 22 個 429——與「預設 60/min」設定相符（前段已有 ~12 次 MCP session 請求占額度）
- **觸發來源**：自動驗證（機器優先）
- **風險等級**：低
- **備註**：尚未部署 prod。部署檢核項：git push → Render 自動 build → prod `/mcp/` 跑一次 initialize/tools/list/tools/call → MCP.md 中的 prod URL 在 Claude Desktop 連得到

## VERIFY-008

- **時間戳**：2026-06-04T10:58:00+08:00
- **類型**：變更（驗證紀錄）
- **範圍與摘要**：F-09 prod 部署驗證全綠。`git push origin main`（`d9ca8ea..35553d6`）觸發 Render 自動 build；新版上線後對 `https://zuyu-rag-backend.onrender.com/mcp/` 跑 `verify_mcp_http.py`：initialize（server=`klokah-rag`）→ tools/list（4 工具）→ 4 個 call_tool（`list_books(阿美語)=95`、`search_books(森林, limit=3)` 命中 #100、`get_book(167, 阿美語)=18 頁`、`get_book_page(167, 1, 阿美語)` 族語文字逐字一致）→ 錯誤路徑（`get_book(99999)` 回 `isError`）皆綠；rate limit 70 連打觸發 19 次 429（與 `MCP_RATE_LIMIT=60` 相符）
- **觸發來源**：自動驗證（機器優先；`MCP_URL` 環境變數切 prod）
- **風險等級**：低
- **備註**：對外 MCP server 正式上線；現可在 Claude Desktop / 其他 MCP client 用 `https://zuyu-rag-backend.onrender.com/mcp/` 連線。`verify_mcp_http.py` 同時支援 local 與 prod（讀 `MCP_URL` 環境變數，預設 local）

## CHANGE-018

- **時間戳**：2026-06-04T11:20:00+08:00
- **類型**：變更
- **範圍與摘要**：新增對外友善版安裝指南。repo 根 `繪本MCP安裝指南.md`（與既有開發者向 `MCP.md` 並存）涵蓋四條路徑（Claude.ai 網頁版／Claude Desktop UI／Claude Desktop 設定檔／ChatGPT Connectors），含決策表、共用 URL box、驗證步驟、試試看的查詢、常見問題、隱私聲明；另說明 Gemini 一般使用者介面目前未開放自訂 MCP。本機以 `npx md-to-pdf` 轉出 `繪本MCP安裝指南.pdf`（878 KB 約 6 頁、A4、Windows 系統字 Microsoft JhengHei）給人類傳檔給朋友用；PDF 不入版控（`.gitignore` 加 `*.pdf` + `.claude/` 規則）
- **觸發來源**：人類指示（朋友要安裝、要對外友善 + 加 Claude.ai 與 ChatGPT 路徑 + 出 PDF 版）＋ AI 自主判斷（決策表結構、Gemini 區段、Win/Mac 路徑分項）
- **風險等級**：低（純文件、不動程式）
- **備註**：發現後續可做但不在本次範圍——Phase 4 Render 回滾演練本次 push 後已**解鎖**（後端現有 ≥2 個 deploy 版本可互退），待人類擇期演練再補 VERIFY

---
