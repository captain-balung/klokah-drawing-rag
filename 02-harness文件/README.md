# 族語 E 樂園繪本 RAG

> 用自然語言查詢「族語 E 樂園」全部繪本的對話式助理。

## 一句話描述

把 95 本原住民族語繪本變成可用中文對話查詢的知識庫，由 Claude 回答。

## 專案結構

```
013-族語 E 樂園繪本 RAG/
├─ backend/         FastAPI 查詢服務（query.py、test_query.py、requirements.txt、.env.example）
├─ data-pipeline/   離線批次工具（scraper.py、transformer.py）與資料（output/、output_v2/、probe/）
├─ frontend/        對話/瀏覽介面（Phase 3，目前佔位）
└─ 02-harness文件/   專案規範文件（spec / design / roadmap / log / ai-rules）
```

資料流向嚴格分離：`data-pipeline/scraper.py`（抓取）→ `data-pipeline/transformer.py`（轉換）→ `backend/query.py`（線上查詢，唯讀 `output_v2/`）。

## 安裝方式

**環境需求**

- Python 3.11+（後端）
- Node.js 18+（前端）
- Anthropic API 金鑰

**後端**

```bash
cd backend
pip install -r requirements.txt
# 設定金鑰（勿寫進程式碼）
export ANTHROPIC_API_KEY=sk-ant-...      # Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
python query.py                           # http://localhost:8000
```

**前端**

```bash
cd frontend
npm install
npm run dev                               # http://localhost:5173
```

## 使用範例

啟動後端後，最簡單的健康檢查與一次查詢：

```bash
# 確認服務正常（應回傳 books_loaded: 95）
curl http://localhost:8000/api/health

# 問一個問題
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"推薦一本關於性別平等的繪本"}]}'
```

或直接開前端網頁，像聊天一樣輸入「有沒有關於環保的繪本？」即可。

## 開發與測試（後端）

```bash
cd backend
pip install -r requirements-dev.txt   # ruff + pytest

python -m ruff check .                 # lint（設定見根目錄 pyproject.toml）
python -m pytest                       # 預設只跑免成本案例（live 付費案例自動略過）
python -m pytest -m live               # 需呼叫付費 Claude API 的端到端案例
```

> 成本控管：會呼叫付費 API 的測試標了 `@pytest.mark.live`，預設被排除，避免誤觸成本。

## 主要功能

- **自然語言找書**：依主題、級別、語法重點查詢繪本（細節見 `spec.md` 功能 F-01）
- **繪本內容問答**：查看任一繪本的完整內容、特定族語版本、逐頁文字（F-02）
- **多輪對話**：記得前文脈絡的連續對話（F-03）
- **繪本瀏覽 API**：列出與取得繪本資料供前端使用（F-04）
- **資料抓取與轉換**：爬蟲與格式轉換工具，產生查詢用的 JSON（F-05、F-06）

完整功能清單與驗收條件見 `spec.md`。

## 授權與聯絡

- 繪本原始資料版權屬「族語 E 樂園」平臺，採 Creative Commons 授權（見 https://web.klokah.tw/creativeCommons/ ）。本專案僅供內部研究/教學使用，須遵守原平臺授權條款。
- 本專案程式碼授權：內部使用，未公開發布。
- 問題回報：（請填入你的聯絡方式或 issue 追蹤位置）
