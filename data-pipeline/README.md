# 族語 E 樂園繪本爬蟲

抓取 [族語 E 樂園繪本平臺](https://web.klokah.tw/pbc/) 的繪本資料，輸出成 JSON 給後續的 RAG / LLM 自然語言查詢系統使用。

## 抓什麼

- **繪本資訊頁** `pbc/book/index.php?id={id}` — 書名、繪者、級別、語法重點、簡介
- **觀看繪本頁的後端 API** `pbc/book/online/get_data.php?id={id}&lid={lid}`
  每頁的族語文字、華語文字、族語/華語音檔 URL、圖片 URL，**遍歷 16 族語版本**

不抓「學習內容」與「改編繪本」（依使用者指定）。

## 安裝

```powershell
pip install requests beautifulsoup4
```

## 執行流程

> **Windows 注意**：請用 `python` 不要用 `python3`（後者在 Windows 是 Microsoft Store stub）

### 1. 偵察（已經完成，跳過）

```powershell
python scraper.py probe --id 167
```

### 2. 抓繪本清單

```powershell
python scraper.py list
```

從繪本列表頁抓所有書本 ID 和基本 metadata，輸出 `output/index.json`。

### 3. 試抓一兩本

```powershell
python scraper.py book --id 167
python scraper.py book --id 166
```

每本輸出 `output/books/book_{id}.json`。

### 4. 批次抓全部

```powershell
python scraper.py all
```

自動跳過已抓過的、失敗自動重試、每請求 0.5 秒間隔。中斷再跑會接著做。

## 輸出格式

### `output/index.json`
```json
[
  {"id": 167, "title": "一起來打招呼", "summary": "..."},
  ...
]
```

### `output/books/book_167.json`
```json
{
  "id": 167,
  "title": "一起來打招呼",
  "illustrator": "彭時啟",
  "level": "中級",
  "grammar_focus": "名詞",
  "summary": "...",
  "language_count": 16,
  "languages": [
    {
      "lid": 1,
      "language": "阿美語",
      "page_count": 12,
      "pages": [
        {
          "page_number": 1,
          "indigenous_text": "...",
          "chinese_text": "...",
          "audio_url_indigenous": "https://web.klokah.tw/text/sound/xxx.mp3",
          "audio_url_chinese": "https://web.klokah.tw/text/sound/yyy.mp3",
          "image_url": "https://web.klokah.tw/pbc/book/167/1.jpg"
        }
      ]
    }
  ]
}
```

注意：不是每本繪本都有 16 族版本，有些只有 1–2 種；API 回空的我們會跳過不收。

## 給 RAG 用的建議

- **chunk 單位**：一個 page 是一個 chunk
- **chunk metadata**：book_id、書名、級別、語法重點、語別、頁碼、圖片 URL、音檔 URL
- **chunk text**：`indigenous_text + chinese_text` 兩者一起放（讓 LLM 同時看到對照）
- **過濾**：先按 metadata 過濾（語別、級別、語法重點）再做 vector search 會更精準

## 法律與授權

平臺採用 Creative Commons 授權，見 https://web.klokah.tw/creativeCommons/。
請依授權條款使用抓下來的資料。
