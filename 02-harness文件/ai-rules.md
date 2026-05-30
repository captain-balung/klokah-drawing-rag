# ai-rules.md — AI 行為原則（＝ CLAUDE.md）

> 本檔每 session 開始必載，直接擔任 Claude Code 的工作入口。
> 開工前必讀：本檔 + `spec.md`；駕駛艙看 `roadmap.md`；所有自主變更與踩雷寫 `log.md`。
> 修改者：人類拍板，AI 不可自行修改（唯一例外：第 7 欄「硬性教訓清單」可由 AI 依晉升規則追加）。

---

## 1. 預設許可清單（正面清單，未列出視為需確認）

AI 預設可以做的事：

- 讀取專案內任何檔案（`.env` 的金鑰值除外，見紅線）
- 撰寫、修改程式碼（`backend/`、`frontend/`、測試）
- 跑測試、執行 lint / format
- 查閱文件、查 log
- 修改本地檔案
- 本地 `git commit`（不含 push）
- 起本地 dev server（後端 `python query.py`、前端 `npm run dev`）

---

## 2. 機器優先原則（正面義務）

可自動化且**可逆**的操作，AI **應優先**用 CLI/MCP 自行完成並驗證，不丟回人類手工：

- git 本地操作、build、起 dev server、查 log
- 後端 API 驗證：用 `curl` 打 `/api/health`、`/api/chat` 自我驗收
- **前端視覺成果：用 Playwright MCP 自行開瀏覽器查看、截圖比對後再迭代**，不丟回人類目視
- 依賴查詢、設定檔讀取

升級給人類的條件：**同一自動化嘗試連續失敗 2 次**才升級。

**邊界**：不可逆操作即使有 CLI 仍須即時確認（讓位於第 3 欄）。把可自動化的可逆工作丟回人類，視為違反 `spec.md` 總體規範第 3 條，須記入 `log.md`。

---

## 3. 需確認才能做的事（每次都要當下確認，不接受整 session 一次授權）

- 刪檔（含 `rm -rf`）
- `git push`、`git push --force`、推 main branch
- 安裝新依賴（`pip install` / `npm install` 新套件）
- **呼叫付費 API（Anthropic Claude API）做超出測試所需的大量呼叫**
- 部署到 Vercel（前端）或 Render（後端）
- 修改外部資源（雲端環境變數、網域設定）
- 執行 `scraper.py`（會對外部網站 web.klokah.tw 發請求）
- 發送任何對外通訊

---

## 4. 絕對不能做的事（紅線，違反時停下並回報，不繞過）

- **寫死 API 金鑰或密碼於程式碼**，或把金鑰/機密貼進對話、寫進任何受版控檔案
- **讀取或輸出 `.env` 內的金鑰實際值**
- **修改原始繪本資料**（`data-pipeline/output/`、`data-pipeline/output_v2/` 的繪本 JSON 為唯讀）
- 繞過認證或授權檢查
- 跳過測試直接合併
- **改 `log.md` 既有條目**（append-only）
- 未經確認執行不可逆操作
- 把使用者查詢內容送往 Anthropic 以外的第三方服務
- 在查詢路徑觸發即時爬蟲

---

## 5. 不確定時的行為

遇到邊緣案例（不確定某操作屬於哪一級）：**採低估值並記錄到 `log.md`**（觸發來源標「AI 自主判斷」）。事後可追究，當下不阻擋流程。

**例外**：若不確定的操作落在第 4 欄「絕對不能做」附近（尤其牽涉金鑰、原始資料寫入、不可逆部署），則**停下並問人類**，不可低估放行。

---

## 6. 回報義務（強制，5 個觸發點，不可選擇性回報）

AI 必須主動回報，不是人類問才答：

1. 完成任務時
2. 卡住超過合理時間時（呼應第 2 欄：自動化連續失敗 2 次）
3. 做了 AI 自主判斷的決定時
4. 發現紅線可能被觸及時（特別是金鑰外洩風險）
5. 偵測到機密資料時（在程式碼/log/對話中發現疑似金鑰）

---

## 7. 硬性教訓清單（由 log.md 踩雷晉升，開工前必看，建議 ≤ 12 條）

> 晉升規則：同類錯誤在 log.md ≥ 2 次、或風險為高/不可逆、或人類明確指示「要記住」。
> 這是 AI 唯一可自行追加本檔的欄位，且只能加此清單。清單膨脹時刪最舊/不復發者（原始紀錄仍留在 log.md）。

- 不要在 Windows 用 `python3` 指令（會連到 Microsoft Store stub，靜默無反應）；用 `python`（踩過，見 log 2026-05-28）
- 不要假設 Vercel serverless 能跑 FastAPI 長連線 SSE 與 prompt caching（架構衝突，後端走 Render；踩過，見 log 2026-05-28）
- 範本檔（`.env.example` 等）嚴禁貼真實金鑰，只放佔位字串；發現真實金鑰即依 §6 #4/#5 回報並要求人類撤銷重發（踩過，見 log 2026-05-29 CORRECTION/LESSON-003）

（後續踩雷依規則晉升於此）

---

## 附：本專案關鍵脈絡速覽（給每次開工的 AI 快速進入狀況）

- **架構**：前端 React/Vue（Vercel）+ 後端 FastAPI（Render）+ Claude API；**無資料庫、無 vector store、無對話持久化**（刻意設計，見 `design.md`）
- **資料**：95 本繪本 JSON，後端啟動載入記憶體。`summary.jsonl`（~10 萬 token）整包進 Claude context 供找書；`books/book_*.json` 供深入查特定書
- **成本鐵則**：system prompt 必開 prompt caching
- **資料流向**：爬蟲（`scraper.py`）→ 轉換（`transformer.py`）→ 查詢（`query.py`），三者嚴格分離
