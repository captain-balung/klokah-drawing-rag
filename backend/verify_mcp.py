"""verify_mcp.py — F-09 對外 MCP 工具的零成本確定性驗證腳本。

不需要 ANTHROPIC_API_KEY、不啟動 uvicorn；直接 import mcp_tools 注入資料來源，
逐一呼叫四個工具並對照 output_v2/ 靜態 JSON 斷言一致。

執行：python verify_mcp.py
"""

import json
import sys
from pathlib import Path

# Windows 預設 cp950 終端機無法印族語/特殊符號；強制以 UTF-8 輸出。
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import mcp_tools  # noqa: E402

DATA = Path(__file__).parent.parent / "data-pipeline" / "output_v2"


def load_book(book_id: int) -> dict | None:
    path = DATA / "books" / f"book_{book_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    index = json.loads((DATA / "index.json").read_text(encoding="utf-8"))
    summary_lines = (DATA / "summary.jsonl").read_text(encoding="utf-8").splitlines()
    mcp_tools.register_data_sources(index, summary_lines, load_book)

    failures: list[str] = []

    def check(name: str, condition: bool, detail: str = "") -> None:
        status = "PASS" if condition else "FAIL"
        print(f"[{status}] {name}{(' — ' + detail) if detail else ''}")
        if not condition:
            failures.append(name)

    # --- list_books ----------------------------------------------------
    all_books = mcp_tools.list_books()
    check("list_books() 回 95 本", len(all_books) == 95, f"got {len(all_books)}")

    level_filter = mcp_tools.list_books(level="初級")
    check(
        "list_books(level=初級) 結果都含「初級」",
        len(level_filter) > 0
        and all("初級" in b.get("level", "") for b in level_filter),
        f"n={len(level_filter)}",
    )

    lang_filter = mcp_tools.list_books(language="阿美語")
    check(
        "list_books(language=阿美語) 結果都含該族",
        all(
            any("阿美語" in la for la in (b.get("available_languages") or []))
            for b in lang_filter
        ),
        f"n={len(lang_filter)}",
    )

    title_filter = mcp_tools.list_books(title="森林")
    check(
        "list_books(title=森林) 結果書名都含「森林」",
        len(title_filter) > 0
        and all("森林" in b.get("title", "") for b in title_filter),
        f"n={len(title_filter)}",
    )

    # --- search_books --------------------------------------------------
    empty_hits = mcp_tools.search_books("")
    check("search_books('') 回空陣列", empty_hits == [], "")

    search_hits = mcp_tools.search_books("森林", limit=5)
    check(
        "search_books('森林', limit=5) 命中數 ≤ 5",
        0 <= len(search_hits) <= 5,
        f"n={len(search_hits)}",
    )
    check(
        "search_books 命中項都真的含搜尋字（在 summary.jsonl 中）",
        all(any("森林" in str(v) for v in h.values()) for h in search_hits),
        "",
    )

    # 上限保護
    big = mcp_tools.search_books("的", limit=999)
    check("search_books 上限為 50", len(big) <= 50, f"n={len(big)}")

    # --- get_book ------------------------------------------------------
    book_167 = mcp_tools.get_book(167)
    raw_167 = load_book(167)
    check(
        "get_book(167) 與 book_167.json 逐字一致",
        book_167 == raw_167,
        "",
    )

    book_167_ami = mcp_tools.get_book(167, language="阿美語")
    check(
        "get_book(167, language=阿美語) 有 language_filter 欄位",
        book_167_ami.get("language_filter") == "阿美語",
        "",
    )

    # 比對第一頁的阿美語逐字
    ami_page0 = book_167_ami["pages"][0]
    raw_ami_page0 = next(
        v
        for v in raw_167["pages"][0]["indigenous_versions"]
        if v["language"] == "阿美語"
    )
    check(
        "get_book(167, 阿美語) 第一頁族語文字與 JSON 逐字一致",
        ami_page0["indigenous_text"] == raw_ami_page0["text"],
        "",
    )

    try:
        mcp_tools.get_book(99999)
        check("get_book(99999) 應丟 ValueError", False, "未丟例外")
    except ValueError:
        check("get_book(99999) 丟 ValueError", True, "")

    # --- get_book_page -------------------------------------------------
    p1 = mcp_tools.get_book_page(167, 1)
    check("get_book_page(167, 1) 含 book_id/page_number", p1.get("book_id") == 167 and p1.get("page_number") == 1, "")

    p1_ami = mcp_tools.get_book_page(167, 1, language="阿美語")
    check(
        "get_book_page(167, 1, 阿美語) 族語文字與 JSON 逐字一致",
        p1_ami.get("indigenous_text") == raw_ami_page0["text"],
        "",
    )

    try:
        mcp_tools.get_book_page(167, 999)
        check("get_book_page(167, 999) 應丟 ValueError", False, "未丟例外")
    except ValueError:
        check("get_book_page(167, 999) 丟 ValueError", True, "")

    # --- 守門：mcp_tools 模組不得 import anthropic ----------------------
    # （只擋實際 import 陳述句；docstring/註解中提及禁令文字本身 OK）
    import re

    mod_src = Path(mcp_tools.__file__).read_text(encoding="utf-8")
    bad = re.search(r"^\s*(import|from)\s+anthropic\b", mod_src, re.MULTILINE)
    check(
        "mcp_tools 未 import anthropic（不可呼叫付費 API）",
        bad is None,
        "",
    )

    print()
    print(f"=== {len(failures)} failure(s) ===")
    for f in failures:
        print(" -", f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
