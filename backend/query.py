#!/usr/bin/env python3
"""
query.py — 族語繪本查詢 API（FastAPI 後端）

設計概要：
- 用 Anthropic Claude API 當大腦
- summary.jsonl 整個塞進 system prompt 並開 prompt caching（5 分鐘快取，省 90% 成本）
- Tool use：Claude 想看某本書的完整內容時，自己呼叫 fetch_book_detail 工具
- SSE streaming：回應一邊產生一邊吐給前端
- 多輪對話：前端負責保存 messages 歷史，每次完整傳上來（後端 stateless）

開發環境啟動：
    pip install fastapi uvicorn anthropic python-dotenv
    export ANTHROPIC_API_KEY=sk-ant-...   # Windows: set ANTHROPIC_API_KEY=...
    python query.py
    # 服務跑在 http://localhost:8000，文件在 http://localhost:8000/docs

API：
    GET  /api/health              健康檢查
    GET  /api/books               列出全部繪本 metadata（給前端做下拉、過濾用）
    GET  /api/books/{id}          取單本繪本完整內容
    POST /api/chat                多輪對話（非 streaming，方便除錯）
    POST /api/chat/stream         多輪對話（SSE streaming）
"""

import json
import logging
import os
import re
import threading
import time
from collections import defaultdict, deque
from collections.abc import Iterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import anthropic
import mcp_tools
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# 從 backend/.env 載入環境變數（含 ANTHROPIC_API_KEY）。
# .env 不進版本控制；範本見 .env.example。
# override=True：讓 .env 成為本機後端的權威來源，避免被環境裡既有的空字串
# ANTHROPIC_API_KEY 蓋過（load_dotenv 預設 override=False 不覆蓋既有變數）。
load_dotenv(Path(__file__).parent / ".env", override=True)

# ------------------------------------------------------------------
# 設定
# ------------------------------------------------------------------
# 資料由 data-pipeline（transformer.py）產生，後端唯讀。
# 部署時（Render）須一併打包 data-pipeline/output_v2，或改指向打包進來的資料路徑。
DATA_DIR = Path(__file__).parent.parent / "data-pipeline" / "output_v2"
SUMMARY_PATH = DATA_DIR / "summary.jsonl"
INDEX_PATH = DATA_DIR / "index.json"
BOOKS_DIR = DATA_DIR / "books"

# 預設 Sonnet 4.6（成本約 Opus 的 1/5，找書/取回任務品質足夠）；
# 可用環境變數 CLAUDE_MODEL 覆寫（如改回 claude-opus-4-8）。
MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
MAX_TOKENS = 2048

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("query")


# ------------------------------------------------------------------
# 啟動時把資料載入記憶體（簡單但對這個資料量足夠）
# ------------------------------------------------------------------
def load_summary() -> str:
    """讀 summary.jsonl 並組成放進 system prompt 的字串。"""
    if not SUMMARY_PATH.exists():
        raise FileNotFoundError(
            f"找不到 {SUMMARY_PATH}，請先跑 transformer.py 產生 output_v2/"
        )
    lines = SUMMARY_PATH.read_text(encoding="utf-8").splitlines()
    log.info("載入 %d 本繪本摘要，總字元數 %d", len(lines), sum(len(ln) for ln in lines))
    return "\n".join(lines)


def load_book_detail(book_id: int) -> dict | None:
    """讀單本書的完整 JSON。"""
    path = BOOKS_DIR / f"book_{book_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


SUMMARY_TEXT = load_summary()
SUMMARY_LINES = SUMMARY_TEXT.splitlines()
INDEX_DATA = json.loads(INDEX_PATH.read_text(encoding="utf-8")) if INDEX_PATH.exists() else []

# 幻覺防護：資料庫中真實存在的繪本 ID 集合，用來事後檢查回應是否捏造 ID。
VALID_BOOK_IDS = {b["id"] for b in INDEX_DATA}

# ------------------------------------------------------------------
# 對外 MCP server（F-09 / DECISION-010）：注入資料來源
# ------------------------------------------------------------------
# 共用已載入記憶體的 INDEX_DATA / SUMMARY_LINES / load_book_detail，
# 避免 mcp_tools.py 重複載入。MCP 工具僅讀資料、不呼叫 Claude。
mcp_tools.register_data_sources(
    index=INDEX_DATA,
    summary_lines=SUMMARY_LINES,
    load_book_detail=load_book_detail,
)

# 抓回應文字裡引用的繪本編號。配合 system prompt 要求以 `#編號` 標註（例：#167），
# 同時相容「編號(id) 167」「id：167」等寫法，盡量多抓以利偵測捏造。
_ID_PATTERNS = [
    re.compile(r"#(\d{1,4})"),
    re.compile(r"編號(?:\(id\)|（id）)?\s*[:：]?\s*#?(\d{1,4})"),
    re.compile(r"\bid\s*[:：]?\s*#?(\d{1,4})", re.IGNORECASE),
]


def extract_book_ids(text: str) -> set[int]:
    """從回應文字抽出所有被引用的繪本編號。"""
    ids: set[int] = set()
    for pat in _ID_PATTERNS:
        ids.update(int(m) for m in pat.findall(text or ""))
    return ids


# ------------------------------------------------------------------
# 給 Claude 看的 system prompt
# ------------------------------------------------------------------
SYSTEM_PROMPT_TEMPLATE = """你是「族語E樂園」繪本平臺的查詢助理。\
你擁有完整的繪本目錄（如下），請依照使用者的問題協助他們找到合適的繪本，或解答跟繪本內容相關的問題。

回答原則：
1. 用繁體中文回答。
2. 推薦繪本時，請列出書名、編號、級別、語法重點、與簡短說明為何推薦。
   **標註編號時一律寫成 `#編號` 格式（例：#167）**，方便系統辨識與連結。
3. 若使用者想看某本繪本的完整內容、特定族語版本、或某頁的詳細文字，請呼叫 `fetch_book_detail` 工具取得完整資料。
4. 不要憑空捏造繪本資訊，所有事實必須來自下方資料庫。**只能提及下方資料庫中真實存在的繪本與編號**；
   若資料庫中找不到相符的繪本，請明說「資料庫中沒有相關繪本」，絕不杜撰書名或編號。
5. 引用族語原文時務必**逐字複製**，包含所有特殊符號與標點（如 ’ ʼ ʔ ʉ ə）；
   不得正規化、不得用一般 ASCII 標點（如 ' ）替換，也不得翻譯或改寫。

==== 繪本資料庫 (summary.jsonl，每行一本書) ====
{summary}
==== 資料庫結束 ===="""


# Claude 可以呼叫的工具
TOOLS = [
    {
        "name": "fetch_book_detail",
        "description": (
            "取得指定編號繪本的完整內容，包含每一頁的中文、各族語文字、音檔網址、圖片網址。"
            "當使用者想閱讀繪本內文、查看某個族語版本、看某頁的詳細資訊時使用。"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "book_id": {
                    "type": "integer",
                    "description": "繪本編號 (id)",
                },
                "language": {
                    "type": "string",
                    "description": "（選填）只想看特定族語版本時填，如「阿美語」、「泰雅語」",
                },
            },
            "required": ["book_id"],
        },
    },
]


def run_tool(name: str, args: dict) -> str:
    """執行 Claude 呼叫的工具，回傳結果字串給 Claude。"""
    if name == "fetch_book_detail":
        book_id = args.get("book_id")
        language = args.get("language")
        book = load_book_detail(book_id)
        if not book:
            return json.dumps({"error": f"找不到 id={book_id} 的繪本"}, ensure_ascii=False)

        # 如果指定了族語，篩出該族的內容讓回傳更精簡
        if language:
            filtered_pages = []
            for page in book["pages"]:
                indigenous = next(
                    (v for v in page["indigenous_versions"] if v["language"] == language),
                    None,
                )
                filtered_pages.append({
                    "page_number": page["page_number"],
                    "chinese_text": page["chinese_text"],
                    "indigenous_text": indigenous["text"] if indigenous else None,
                    "audio_url_indigenous": indigenous["audio_url"] if indigenous else None,
                    "audio_url_chinese": page["audio_url_chinese"],
                    "image_url": page["image_url"],
                })
            return json.dumps({
                "id": book["id"],
                "title": book["title"],
                "language_filter": language,
                "page_count": book["page_count"],
                "pages": filtered_pages,
            }, ensure_ascii=False)

        return json.dumps(book, ensure_ascii=False)

    return json.dumps({"error": f"未知的工具 {name}"}, ensure_ascii=False)


# ------------------------------------------------------------------
# FastAPI app（含對外 MCP server 子 app 的 lifespan）
# ------------------------------------------------------------------
@asynccontextmanager
async def app_lifespan(_app: FastAPI):
    """啟動 FastMCP 的 streamable HTTP session manager，請求結束時收尾。"""
    async with mcp_tools.mcp.session_manager.run():
        yield


app = FastAPI(title="族語繪本查詢 API", version="0.2.0", lifespan=app_lifespan)

# CORS 來源：開發預設全開（*）；正式部署用環境變數 CORS_ORIGINS 限定前端網域
# （逗號分隔，如 "https://xxx.vercel.app"）。不使用 cookie，故 allow_credentials=False。
# 注意：此 CORS 政策僅針對 /api/*；/mcp 為對外公開介面，由其子 app 自行處理。
_cors_env = os.getenv("CORS_ORIGINS", "*").strip()
ALLOWED_ORIGINS = (
    ["*"] if _cors_env == "*" else [o.strip() for o in _cors_env.split(",") if o.strip()]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# 對外 MCP 的 per-IP rate limit（DECISION-010）
# ------------------------------------------------------------------
# 完全公開不設 token，但用 sliding-window per-IP 計數防爬。
# 預設 60 次/分鐘，可用環境變數 MCP_RATE_LIMIT 覆寫（純整數，單位 per minute）。
class _SlidingWindowLimiter:
    """簡單的 per-key 滑動視窗計數器（thread-safe，記憶體內）。"""

    def __init__(self, max_hits: int, window_sec: float) -> None:
        self.max = max_hits
        self.window = window_sec
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str) -> bool:
        now = time.monotonic()
        cutoff = now - self.window
        with self._lock:
            q = self._hits[key]
            while q and q[0] < cutoff:
                q.popleft()
            if len(q) >= self.max:
                return False
            q.append(now)
            return True


_mcp_limit_per_min = max(1, int(os.getenv("MCP_RATE_LIMIT", "60")))
_mcp_limiter = _SlidingWindowLimiter(max_hits=_mcp_limit_per_min, window_sec=60.0)


@app.middleware("http")
async def mcp_rate_limit_middleware(request: Request, call_next):
    """對 /mcp 路徑做 per-IP rate limit；其他路徑直通。"""
    if request.url.path.startswith("/mcp"):
        client_ip = request.client.host if request.client else "unknown"
        if not _mcp_limiter.hit(client_ip):
            log.warning("/mcp rate limit hit ip=%s limit=%d/min", client_ip, _mcp_limit_per_min)
            return JSONResponse(
                {"error": "rate limit exceeded", "limit_per_minute": _mcp_limit_per_min},
                status_code=429,
                headers={"Retry-After": "60"},
            )
    return await call_next(request)


# 掛載 FastMCP 子 app：對外 MCP 端點為 /mcp（streamable HTTP transport）
app.mount("/mcp", mcp_tools.mcp.streamable_http_app())


client = anthropic.Anthropic()  # 從環境變數讀 ANTHROPIC_API_KEY


# --- Request / Response 結構 ----------------------------------------
class ChatMessage(BaseModel):
    role: str = Field(..., description="user / assistant")
    content: Any = Field(..., description="字串或 Anthropic 多模態 content blocks")


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., description="完整對話歷史，前端負責保存")


class ChatResponse(BaseModel):
    messages: list[dict] = Field(..., description="加上本輪 assistant 回應的完整歷史")
    text: str = Field(..., description="本輪 assistant 的純文字答覆")


# --- 共用：跑一次「agent loop」（處理 tool use 迴圈） -----------------
def build_system_blocks() -> list[dict]:
    """
    把 system prompt 切成「會變的」+「不變的(可快取)」兩塊。
    summary.jsonl 不變 → 開 cache_control: ephemeral，省 90% 成本。
    """
    return [
        {
            "type": "text",
            "text": SYSTEM_PROMPT_TEMPLATE.format(summary=SUMMARY_TEXT),
            "cache_control": {"type": "ephemeral"},
        }
    ]


def serialize_messages(messages: list[ChatMessage]) -> list[dict]:
    """把 Pydantic ChatMessage 轉成 Anthropic SDK 接受的 dict。"""
    return [{"role": m.role, "content": m.content} for m in messages]


def log_usage(usage: Any, where: str) -> None:
    """成本監控：明確記錄每次 LLM 呼叫的 token 用量。
    cache_read 高代表 prompt caching 命中（僅付 10% 成本，見 spec 成本鐵則）。"""
    log.info(
        "usage[%s]: input=%s output=%s cache_read=%s cache_write=%s",
        where,
        getattr(usage, "input_tokens", "?"),
        getattr(usage, "output_tokens", "?"),
        getattr(usage, "cache_read_input_tokens", 0),
        getattr(usage, "cache_creation_input_tokens", 0),
    )


def run_agent_loop(messages: list[dict], max_iter: int = 5) -> list[dict]:
    """
    執行 agent loop：呼叫 Claude，若回應含 tool_use 就執行工具、把結果塞回 messages、再呼叫一次，直到沒有 tool_use 或達到上限。
    回傳更新後的完整 messages list（含所有 assistant 回應與 tool_result）。
    """
    for i in range(max_iter):
        resp = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=build_system_blocks(),
            tools=TOOLS,
            messages=messages,
        )
        log.info("agent loop %d: stop_reason=%s", i + 1, resp.stop_reason)
        log_usage(resp.usage, f"chat·loop{i + 1}")

        # 把 assistant 的回應加進歷史
        # exclude_none：濾掉 SDK 內部欄位（如 parsed_output、citations=None），
        # 否則把這段 assistant 內容回傳當下一輪輸入時 API 會 400（多輪對話必中）。
        assistant_content = [block.model_dump(exclude_none=True) for block in resp.content]
        messages.append({"role": "assistant", "content": assistant_content})

        # 沒有要 call tool 就結束
        if resp.stop_reason != "tool_use":
            break

        # 收集這輪所有 tool_use 並執行
        tool_results = []
        for block in resp.content:
            if block.type == "tool_use":
                log.info("  -> tool_use: %s(%s)", block.name, block.input)
                result_text = run_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_text,
                })

        messages.append({"role": "user", "content": tool_results})

    return messages


def extract_text(message_content: Any) -> str:
    """從 assistant content blocks 抽出純文字部分。"""
    if isinstance(message_content, str):
        return message_content
    parts = []
    for block in message_content or []:
        if isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
    return "\n".join(parts)


# --- API endpoints --------------------------------------------------
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": MODEL,
        "books_loaded": len(INDEX_DATA),
        "summary_chars": len(SUMMARY_TEXT),
    }


@app.get("/api/books")
def list_books():
    """全部繪本的輕量 metadata。前端可以拿來做下拉選單、過濾條件。"""
    return INDEX_DATA


@app.get("/api/books/{book_id}")
def get_book(book_id: int):
    """單本繪本的完整內容（新格式：中文去重、各族語版本）。"""
    book = load_book_detail(book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"book {book_id} not found")
    return book


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """
    非 streaming 版本，方便除錯。
    前端每次傳完整對話歷史，後端跑 agent loop，回傳更新後的完整歷史。
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages 不可為空")

    messages = serialize_messages(req.messages)
    messages = run_agent_loop(messages)

    # 取最後一則 assistant 訊息的純文字
    last_assistant = next(
        (m for m in reversed(messages) if m["role"] == "assistant"),
        None,
    )
    text = extract_text(last_assistant["content"]) if last_assistant else ""

    # 幻覺防護（後處理）：回應若引用資料庫不存在的繪本 ID，記 warning 供監控。
    # 不改寫回應內容，以免破壞忠實呈現；偵測與回歸測試見 tests/test_chat.py。
    hallucinated = extract_book_ids(text) - VALID_BOOK_IDS
    if hallucinated:
        log.warning("回應引用了資料庫不存在的繪本 ID：%s", sorted(hallucinated))

    return ChatResponse(messages=messages, text=text)


@app.post("/api/chat/stream")
def chat_stream(req: ChatRequest):
    """
    SSE streaming 版本。前端用 EventSource 或 fetch + ReadableStream 接收。

    Event 格式：
      event: text      data: {"delta": "..."}        # 文字 chunk
      event: tool_use  data: {"name": "...", "input": {...}}   # Claude 正在呼叫工具
      event: tool_result data: {"name": "...", "output_preview": "..."}  # 工具回傳
      event: done      data: {"final_messages": [...]}  # 完整 messages 歷史
      event: error     data: {"error": "..."}
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages 不可為空")

    messages = serialize_messages(req.messages)

    def event_stream() -> Iterator[bytes]:
        def sse(event: str, data: dict) -> bytes:
            return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n".encode()

        try:
            for _ in range(5):  # max_iter
                with client.messages.stream(
                    model=MODEL,
                    max_tokens=MAX_TOKENS,
                    system=build_system_blocks(),
                    tools=TOOLS,
                    messages=messages,
                ) as stream:
                    for event in stream:
                        # 文字 chunk
                        if event.type == "content_block_delta":
                            delta = getattr(event, "delta", None)
                            if delta and getattr(delta, "type", None) == "text_delta":
                                yield sse("text", {"delta": delta.text})

                    final = stream.get_final_message()
                    log.info("stream done: stop_reason=%s", final.stop_reason)
                    log_usage(final.usage, "stream")

                # 把這輪 assistant 內容加進 messages
                # exclude_none：同上，濾掉 parsed_output 等 SDK 內部欄位，避免多輪 400。
                assistant_content = [b.model_dump(exclude_none=True) for b in final.content]
                messages.append({"role": "assistant", "content": assistant_content})

                # 沒有 tool_use 就結束
                if final.stop_reason != "tool_use":
                    break

                # 處理 tool_use
                tool_results = []
                for block in final.content:
                    if block.type == "tool_use":
                        yield sse("tool_use", {"name": block.name, "input": block.input})
                        result_text = run_tool(block.name, block.input)
                        # 預覽前 200 字給前端看
                        preview = result_text[:200] + ("..." if len(result_text) > 200 else "")
                        yield sse("tool_result", {"name": block.name, "output_preview": preview})
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result_text,
                        })
                messages.append({"role": "user", "content": tool_results})

            yield sse("done", {"final_messages": messages})

        except Exception as e:
            log.exception("stream error")
            yield sse("error", {"error": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ------------------------------------------------------------------
# 開發伺服器
# ------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    if not os.getenv("ANTHROPIC_API_KEY"):
        log.warning("環境變數 ANTHROPIC_API_KEY 沒設！呼叫 Claude API 會失敗。")
    uvicorn.run("query:app", host="0.0.0.0", port=8000, reload=True)
