#!/usr/bin/env python3
"""
test_chat.py — 後端對話回歸測試（roadmap Phase 2 / F-01 幻覺防護）。

斷言：對話回應引用的繪本編號（#id）必須全部存在於 index.json。
- 找書查詢：至少引用一本、且引用的 ID 皆有效。
- 離題查詢：不得杜撰不存在的 ID。

可用 pytest 跑（`pytest tests/test_chat.py`），也可直接執行（`python tests/test_chat.py`，
不需安裝 pytest）。會發少量付費 Claude API 呼叫，請先在 backend/.env 設 ANTHROPIC_API_KEY。
"""

import json
import sys
from pathlib import Path

import pytest

# 讓本檔在 tests/ 底下也能 import 到 backend/query.py
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import query  # noqa: E402


def _ask(user_text: str) -> str:
    """跑一輪 agent loop，回傳最後一則 assistant 的純文字。"""
    messages = query.run_agent_loop([{"role": "user", "content": user_text}])
    last_assistant = next(
        (m for m in reversed(messages) if m["role"] == "assistant"), None
    )
    return query.extract_text(last_assistant["content"]) if last_assistant else ""


# 找書查詢：應回傳真實存在的繪本
RECOMMEND_QUERIES = [
    "推薦一本關於環保或愛護大自然的繪本",
    "有沒有教小朋友分享或互助的繪本？",
]

# 離題查詢：資料庫沒有，應誠實說沒有、不得捏造 ID
OUT_OF_DOMAIN_QUERIES = [
    "有沒有關於量子力學的繪本？",
]


@pytest.mark.live
def test_recommend_returns_only_valid_ids():
    assert query.VALID_BOOK_IDS, "index.json 未載入任何書本 ID"
    for q in RECOMMEND_QUERIES:
        answer = _ask(q)
        ids = query.extract_book_ids(answer)
        assert ids, f"查詢「{q}」未引用任何 #編號，回應：{answer[:150]}"
        bad = ids - query.VALID_BOOK_IDS
        assert not bad, f"查詢「{q}」引用了不存在的繪本 ID {sorted(bad)}，回應：{answer[:200]}"


@pytest.mark.live
def test_out_of_domain_does_not_fabricate():
    for q in OUT_OF_DOMAIN_QUERIES:
        answer = _ask(q)
        bad = query.extract_book_ids(answer) - query.VALID_BOOK_IDS
        assert not bad, f"離題查詢「{q}」杜撰了不存在的 ID {sorted(bad)}，回應：{answer[:200]}"


# ---- F-02 繪本內容問答：族語文字與 JSON 一致 -------------------------------

FETCH_TEST_BOOK = 167  # 已確認含 16 族、18 頁


def _expected_indigenous(book_id: int, language: str, page_number: int) -> str | None:
    """直接從 book_*.json 取出該族該頁的族語原文（測試的真相來源）。"""
    book = query.load_book_detail(book_id)
    page = next((p for p in book["pages"] if p["page_number"] == page_number), None)
    if page is None:
        return None
    v = next((x for x in page["indigenous_versions"] if x["language"] == language), None)
    return v["text"] if v else None


def test_fetch_book_detail_text_matches_json():
    """fetch_book_detail 工具回傳的族語/華語文字必須與原 JSON 逐字一致（無 API 成本）。"""
    book = query.load_book_detail(FETCH_TEST_BOOK)
    assert book, f"找不到 book_{FETCH_TEST_BOOK}.json"

    langs = [lng["name"] for lng in book["available_languages"][:2]]
    page_nos = [p["page_number"] for p in book["pages"][:3]]

    for lang in langs:
        out = json.loads(
            query.run_tool("fetch_book_detail", {"book_id": FETCH_TEST_BOOK, "language": lang})
        )
        for pno in page_nos:
            got = next(p["indigenous_text"] for p in out["pages"] if p["page_number"] == pno)
            exp = _expected_indigenous(FETCH_TEST_BOOK, lang, pno)
            assert got == exp, (
                f"#{FETCH_TEST_BOOK} {lang} 第{pno}頁族語文字不一致：{got!r} != {exp!r}"
            )
        # 華語文字也須一致
        for p in out["pages"]:
            exp_ch = next(
                x["chinese_text"] for x in book["pages"] if x["page_number"] == p["page_number"]
            )
            assert p["chinese_text"] == exp_ch, f"#{FETCH_TEST_BOOK} 第{p['page_number']}頁華語文字不一致"


def _normalize_glyphs(s: str) -> str:
    """統一族語 prose 中常被 LLM 正規化的標點，用於語意層比對。
    註：逐字忠實性由 test_fetch_book_detail_text_matches_json（資料層）保證；
    LLM prose 不保證逐字，前端逐字呈現應直接渲染資料而非複述。"""
    for ch in "’ʼ‘ʔ":  # 各式撇號/喉塞音 → 一般撇號
        s = s.replace(ch, "'")
    return s


def _ask_full(user_text: str) -> list[dict]:
    return query.run_agent_loop([{"role": "user", "content": user_text}])


@pytest.mark.live
def test_end_to_end_grounds_on_real_data():
    """端到端：問特定族語某頁，須(a)實際呼叫 fetch_book_detail 取資料、(b)內容出現該族語文字
    （容許 LLM 對 ’/' 等標點正規化；逐字保證見資料層測試）。"""
    lang, page_no = "阿美語", 1
    expected = _expected_indigenous(FETCH_TEST_BOOK, lang, page_no)
    assert expected, "測試前提：該族該頁應有族語文字"

    messages = _ask_full(
        f"請給我繪本 #{FETCH_TEST_BOOK} 的{lang}第{page_no}頁族語原文，原樣呈現、不要翻譯或改寫。"
    )

    # (a) 必須透過工具取真實資料，而非憑空作答
    tool_calls = [
        b
        for m in messages
        if isinstance(m.get("content"), list)
        for b in m["content"]
        if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "fetch_book_detail"
    ]
    assert any(tc["input"].get("book_id") == FETCH_TEST_BOOK for tc in tool_calls), (
        f"未呼叫 fetch_book_detail(book_id={FETCH_TEST_BOOK}) 取真實資料"
    )

    # (b) 回應內容須包含該族語文字（標點正規化後比對）
    last_assistant = next(m for m in reversed(messages) if m["role"] == "assistant")
    answer = query.extract_text(last_assistant["content"])
    assert _normalize_glyphs(expected) in _normalize_glyphs(answer), (
        f"回應未包含族語文字。\nexpected={expected!r}\nanswer={answer[:300]!r}"
    )


# ---- F-03 多輪對話：第二輪正確指涉第一輪結果 ----------------------------


def _last_assistant_text(messages: list[dict]) -> str:
    last = next((m for m in reversed(messages) if m["role"] == "assistant"), None)
    return query.extract_text(last["content"]) if last else ""


@pytest.mark.live
def test_multiturn_refers_to_previous():
    """第一輪推薦數本；第二輪沿用歷史挑「其中一本」，須指涉第一輪結果（spec 成功標準 #3）。"""
    # 第一輪
    messages = query.run_agent_loop(
        [{"role": "user", "content": "有沒有關於環保或愛護大自然的繪本？請推薦幾本。"}]
    )
    turn1_ids = query.extract_book_ids(_last_assistant_text(messages))
    assert turn1_ids, "第一輪未推薦任何繪本"

    # 第二輪：延續同一段對話歷史，問題指涉第一輪（「其中…」）
    messages.append(
        {"role": "user", "content": "其中你最推薦哪一本給幼兒？請用 #編號 標註。"}
    )
    messages = query.run_agent_loop(messages)
    turn2_text = _last_assistant_text(messages)
    turn2_ids = query.extract_book_ids(turn2_text)

    assert turn2_ids, f"第二輪未引用任何 #編號：{turn2_text[:150]}"
    bad = turn2_ids - query.VALID_BOOK_IDS
    assert not bad, f"第二輪出現不存在的 ID {sorted(bad)}"
    assert turn1_ids & turn2_ids, (
        f"第二輪未指涉第一輪結果。turn1={sorted(turn1_ids)} turn2={sorted(turn2_ids)}"
        f"\n回應：{turn2_text[:200]}"
    )


@pytest.mark.live
def test_streaming_multiturn_no_error():
    """多輪 streaming 不得因 assistant 內容序列化夾帶 SDK 內部欄位（parsed_output 等）而 400。
    回歸：先前 model_dump() 未濾 None，第二輪 /api/chat/stream 會回 error 事件。"""
    from fastapi.testclient import TestClient

    client = TestClient(query.app)

    # 第一輪（非串流，取回完整歷史）
    r1 = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "推薦一本關於分享的繪本"}]},
    )
    assert r1.status_code == 200, r1.text
    history = r1.json()["messages"]

    # 第二輪：把含 assistant 內容的歷史回傳給 streaming 端點
    history.append({"role": "user", "content": "其中你最推薦哪一本給幼兒？"})
    with client.stream("POST", "/api/chat/stream", json={"messages": history}) as r2:
        assert r2.status_code == 200
        body = "".join(r2.iter_text())

    assert "event: error" not in body, f"多輪 streaming 出現 error 事件：…{body[-400:]}"
    assert "event: done" in body, "streaming 未正常結束（缺 done 事件）"


def _run_standalone() -> int:
    failures = 0
    for name, fn in [
        ("test_fetch_book_detail_text_matches_json", test_fetch_book_detail_text_matches_json),
        ("test_recommend_returns_only_valid_ids", test_recommend_returns_only_valid_ids),
        ("test_out_of_domain_does_not_fabricate", test_out_of_domain_does_not_fabricate),
        ("test_end_to_end_grounds_on_real_data", test_end_to_end_grounds_on_real_data),
        ("test_multiturn_refers_to_previous", test_multiturn_refers_to_previous),
    ]:
        try:
            fn()
            print(f"PASS ✅ {name}")
        except AssertionError as e:
            failures += 1
            print(f"FAIL ❌ {name}: {e}")
    print(f"\n{'全部通過' if failures == 0 else f'{failures} 個失敗'}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(_run_standalone())
