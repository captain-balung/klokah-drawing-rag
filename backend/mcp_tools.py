"""mcp_tools.py — 對外 MCP server 工具集（F-09，DECISION-010）。

提供四個純資料工具讓其他聊天機器人/AI 助手以 MCP 協定查詢繪本：
  - list_books      列出 95 本繪本 metadata（可過濾）
  - search_books    對 summary.jsonl 做關鍵字全文搜尋
  - get_book        取單本完整內容（可指定族語）
  - get_book_page   取單頁切片（最省 token）

紅線（spec F-09 反例規格 + DECISION-010）：
  - 工具只能讀 data-pipeline/output_v2/ 靜態 JSON
  - 嚴禁 import anthropic、嚴禁呼叫 Claude API 或任何付費外部服務
  - 嚴禁提供寫入/修改/刪除類工具

掛載：query.py 在啟動時 `register_data_sources(...)` 注入記憶體中的資料，
      再把 `mcp.streamable_http_app()` 掛到 FastAPI 的 /mcp。
"""

import json
from collections.abc import Callable

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings


# ------------------------------------------------------------------
# 資料來源（由 query.py 啟動時注入，避免循環 import）
# ------------------------------------------------------------------
class _DataSources:
    index: list[dict] = []
    summary_lines: list[str] = []
    load_book_detail: Callable[[int], dict | None] | None = None


_ds = _DataSources()


def register_data_sources(
    index: list[dict],
    summary_lines: list[str],
    load_book_detail: Callable[[int], dict | None],
) -> None:
    """由 query.py 在 import 後呼叫，把已載入記憶體的資料注入本模組。"""
    _ds.index = index
    _ds.summary_lines = summary_lines
    _ds.load_book_detail = load_book_detail


# ------------------------------------------------------------------
# FastMCP 實例
# ------------------------------------------------------------------
# stateless_http=True：每個請求獨立、不維護 session（公開查詢場景，無需狀態）
# streamable_http_path="/"：mount 在 /mcp 時，實際 MCP endpoint 為 /mcp/
# enable_dns_rebinding_protection=False：對外完全公開，不限 Host/Origin
mcp = FastMCP(
    name="klokah-rag",
    instructions=(
        "「族語 E 樂園」95 本原住民族語繪本的資料查詢介面（純資料，不含 LLM 推理）。\n"
        "資料含華語 + 16 族原住民族語版本，每頁有文字、音檔 URL、圖片 URL。\n"
        "建議流程：\n"
        "  1) 用 search_books 或 list_books 找候選 book_id\n"
        "  2) 用 get_book 取整本、或 get_book_page 取單頁細節\n"
        "繪本內容請引用時務必逐字保留族語特殊符號（如 ʔ ʉ ə '），不要正規化。"
    ),
    stateless_http=True,
    streamable_http_path="/",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=False,
    ),
)


# ------------------------------------------------------------------
# 內部小工具
# ------------------------------------------------------------------
def _norm(s: object) -> str:
    """正規化成 lower-case 字串（None/非字串視為空字串）。"""
    if s is None:
        return ""
    return str(s).strip().lower()


def _matches(haystack: object, needle: str | None) -> bool:
    """子字串比對；needle 為 None/空字串時視為不過濾（True）。"""
    if not needle:
        return True
    return _norm(needle) in _norm(haystack)


def _require_loader() -> Callable[[int], dict | None]:
    if _ds.load_book_detail is None:
        raise RuntimeError("MCP server 尚未注入資料來源（register_data_sources 未呼叫）")
    return _ds.load_book_detail


# ------------------------------------------------------------------
# 工具：純資料動作
# ------------------------------------------------------------------
@mcp.tool()
def list_books(
    level: str | None = None,
    language: str | None = None,
    grammar_focus: str | None = None,
    title: str | None = None,
) -> list[dict]:
    """列出全部繪本 metadata（不含逐頁內容，輕量）。

    可選過濾條件（皆為子字串、case-insensitive；None 表示不過濾）：
      - level：級別關鍵字（如「一階」「二階」）
      - language：族語名稱，比對 available_languages（如「阿美語」「泰雅語」）
      - grammar_focus：語法重點關鍵字
      - title：書名子字串

    回傳：陣列，欄位以 index.json 為準
    （含 id / title / level / grammar_focus / summary / page_count /
      language_count / available_languages）。
    """
    out: list[dict] = []
    for b in _ds.index:
        if not _matches(b.get("level"), level):
            continue
        if language:
            langs = b.get("available_languages") or []
            if not any(_norm(language) in _norm(la) for la in langs):
                continue
        if not _matches(b.get("grammar_focus"), grammar_focus):
            continue
        if not _matches(b.get("title"), title):
            continue
        out.append(b)
    return out


@mcp.tool()
def search_books(query: str, limit: int = 10) -> list[dict]:
    """以關鍵字在繪本摘要（summary.jsonl 全文）做子字串比對搜尋。

    純字串比對（case-insensitive），不呼叫任何 LLM。

    參數：
      - query：搜尋關鍵字（必填、非空）
      - limit：最多回幾筆，預設 10、上限 50

    回傳：命中的繪本 summary（每筆是 summary.jsonl 的一行 JSON 物件）。
    若 query 為空字串則回空陣列。
    """
    if not query or not query.strip():
        return []
    limit = max(1, min(int(limit or 10), 50))
    needle = _norm(query)

    hits: list[dict] = []
    for line in _ds.summary_lines:
        if not line.strip():
            continue
        if needle not in _norm(line):
            continue
        try:
            hits.append(json.loads(line))
        except json.JSONDecodeError:
            continue
        if len(hits) >= limit:
            break
    return hits


@mcp.tool()
def get_book(book_id: int, language: str | None = None) -> dict:
    """取單本繪本完整內容（每頁華語、各族語、音檔 URL、圖片 URL）。

    參數：
      - book_id：繪本編號（見 list_books / search_books 回傳的 id）
      - language：選填，只想看特定族語版本時填（如「阿美語」）；
                  不填則回所有族語版本。

    回傳：整本書的 JSON。指定 language 時，每頁的 indigenous_versions
          會被壓平成單一 indigenous_text/audio_url_indigenous 欄位。

    book_id 不存在時丟出 ValueError。
    """
    load = _require_loader()
    book = load(book_id)
    if not book:
        raise ValueError(f"book_id={book_id} 不存在")

    if not language:
        return book

    filtered_pages: list[dict] = []
    for page in book.get("pages", []):
        indig = next(
            (
                v
                for v in page.get("indigenous_versions", [])
                if v.get("language") == language
            ),
            None,
        )
        filtered_pages.append({
            "page_number": page.get("page_number"),
            "chinese_text": page.get("chinese_text"),
            "indigenous_text": indig.get("text") if indig else None,
            "audio_url_indigenous": indig.get("audio_url") if indig else None,
            "audio_url_chinese": page.get("audio_url_chinese"),
            "image_url": page.get("image_url"),
        })
    return {
        "id": book.get("id"),
        "title": book.get("title"),
        "language_filter": language,
        "page_count": book.get("page_count"),
        "pages": filtered_pages,
    }


@mcp.tool()
def get_book_page(
    book_id: int,
    page_number: int,
    language: str | None = None,
) -> dict:
    """取單頁切片：指定書與頁數（最省 token 的方式取細節）。

    參數：
      - book_id：繪本編號
      - page_number：頁碼（從 1 開始）
      - language：選填，只看特定族語版本

    回傳：單頁內容（含華語、各族語或單族、音檔、圖片）。

    book_id 或 page_number 不存在時丟出 ValueError。
    """
    load = _require_loader()
    book = load(book_id)
    if not book:
        raise ValueError(f"book_id={book_id} 不存在")

    page = next(
        (p for p in book.get("pages", []) if p.get("page_number") == page_number),
        None,
    )
    if not page:
        raise ValueError(f"book_id={book_id} 沒有第 {page_number} 頁")

    if language:
        indig = next(
            (
                v
                for v in page.get("indigenous_versions", [])
                if v.get("language") == language
            ),
            None,
        )
        return {
            "book_id": book_id,
            "book_title": book.get("title"),
            "page_number": page_number,
            "chinese_text": page.get("chinese_text"),
            "indigenous_text": indig.get("text") if indig else None,
            "audio_url_indigenous": indig.get("audio_url") if indig else None,
            "audio_url_chinese": page.get("audio_url_chinese"),
            "image_url": page.get("image_url"),
            "language_filter": language,
        }

    return {
        "book_id": book_id,
        "book_title": book.get("title"),
        **page,
    }
