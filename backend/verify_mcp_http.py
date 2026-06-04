"""verify_mcp_http.py — 對 /mcp 端到端跑一次 MCP client（streamable HTTP）。

需要後端先在 http://localhost:8000 啟動（python query.py）。
"""

import asyncio
import json
import sys

import httpx

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


async def run_one_session() -> int:
    import os
    url = os.getenv("MCP_URL", "http://localhost:8000/mcp/")
    print(f"連線 {url}")
    async with streamablehttp_client(url) as (read, write, _):
        async with ClientSession(read, write) as session:
            init = await session.initialize()
            print(f"[PASS] initialize → server={init.serverInfo.name} v{init.serverInfo.version}")

            tools = await session.list_tools()
            names = sorted(t.name for t in tools.tools)
            expected = ["get_book", "get_book_page", "list_books", "search_books"]
            assert names == expected, f"tools mismatch: {names}"
            print(f"[PASS] tools/list → {names}")

            r = await session.call_tool("list_books", {"language": "阿美語"})
            # FastMCP 對非字串回傳值會放進 structuredContent，content[0].text 是同份 JSON 序列化
            payload = r.structuredContent
            if payload is None:
                payload = json.loads(r.content[0].text)
            # FastMCP 的 list 回傳可能被包成 {"result": [...]}
            if isinstance(payload, dict) and "result" in payload:
                payload = payload["result"]
            assert isinstance(payload, list) and len(payload) > 0, f"got: {type(payload).__name__} {str(payload)[:200]}"
            print(f"[PASS] list_books(language=阿美語) → {len(payload)} 本")

            def unwrap(resp):
                p = resp.structuredContent
                if p is None:
                    p = json.loads(resp.content[0].text)
                if isinstance(p, dict) and "result" in p and len(p) == 1:
                    p = p["result"]
                return p

            r = await session.call_tool("search_books", {"query": "森林", "limit": 3})
            payload = unwrap(r)
            assert isinstance(payload, list)
            print(f"[PASS] search_books(森林) → {len(payload)} 筆，第一筆 id={payload[0].get('id') if payload else 'N/A'}")

            r = await session.call_tool("get_book", {"book_id": 167, "language": "阿美語"})
            payload = unwrap(r)
            assert payload.get("id") == 167
            assert payload.get("language_filter") == "阿美語"
            assert len(payload.get("pages", [])) > 0
            print(f"[PASS] get_book(167, 阿美語) → {payload.get('page_count')} 頁；第一頁 indigenous_text 長度 {len(payload['pages'][0]['indigenous_text'] or '')}")

            r = await session.call_tool("get_book_page", {"book_id": 167, "page_number": 1, "language": "阿美語"})
            payload = unwrap(r)
            assert payload.get("book_id") == 167 and payload.get("page_number") == 1
            print(f"[PASS] get_book_page(167, 1, 阿美語) → 族語文字: {payload.get('indigenous_text', '')[:30]}...")

            # 錯誤路徑：呼叫不存在的 book
            r = await session.call_tool("get_book", {"book_id": 99999})
            assert r.isError, f"預期 isError=True，得到 {r}"
            print(f"[PASS] get_book(99999) 回 isError；訊息：{r.content[0].text[:80]}")

    return 0


async def run_rate_limit_probe() -> int:
    """簡單試打：若 MCP_RATE_LIMIT 預設 60，不會在這幾次內觸發。
    這裡只驗證 429 路徑能被 middleware 觸發——以 health 之外的 /mcp 路徑連打。
    跳過 MCP 協定，直接以 httpx 對 /mcp/ 連打 70 次（POST 空 body），預期最後若干次 429。"""
    print("\n--- rate limit probe ---")
    import os
    url = os.getenv("MCP_URL", "http://localhost:8000/mcp/")
    async with httpx.AsyncClient(timeout=10.0) as c:
        codes: list[int] = []
        for _i in range(70):
            try:
                resp = await c.post(url, content="{}", headers={"content-type": "application/json"})
                codes.append(resp.status_code)
            except Exception as e:  # noqa: BLE001
                codes.append(-1)
                print("  request exception:", e)
                break
        n429 = sum(1 for s in codes if s == 429)
        n_other = len(codes) - n429
        print(f"  共打 {len(codes)} 次：429 共 {n429} 次，其餘 {n_other} 次")
        if n429 > 0:
            print("[PASS] rate limit 觸發 429")
            return 0
        print("[FAIL] 70 次內未觸發 429（預設應為 60/min）")
        return 1


async def amain() -> int:
    rc = await run_one_session()
    rc2 = await run_rate_limit_probe()
    return rc or rc2


if __name__ == "__main__":
    sys.exit(asyncio.run(amain()))
