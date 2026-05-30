#!/usr/bin/env python3
"""
test_query.py — 測試 query.py API 的範例腳本

跑這個之前，請先在另一個視窗啟動服務：
    python query.py

然後在新視窗：
    python test_query.py
"""

import json

import requests

BASE = "http://localhost:8000"


def test_health():
    print("=== /api/health ===")
    r = requests.get(f"{BASE}/api/health")
    print(json.dumps(r.json(), ensure_ascii=False, indent=2))
    print()


def test_list_books():
    print("=== /api/books (前 3 本) ===")
    r = requests.get(f"{BASE}/api/books")
    books = r.json()
    print(f"總共 {len(books)} 本")
    for b in books[:3]:
        print(f"  #{b['id']} {b['title']} ({b['level']}/{b['grammar_focus']})")
    print()


def test_chat_simple():
    print("=== /api/chat：一問一答 ===")
    print("Q: 推薦一本跟性別平等有關的繪本")
    r = requests.post(
        f"{BASE}/api/chat",
        json={
            "messages": [
                {"role": "user", "content": "推薦一本跟性別平等有關的繪本"}
            ]
        },
        timeout=120,
    )
    data = r.json()
    print("A:", data["text"][:500])
    print()
    return data["messages"]


def test_chat_multiturn():
    print("=== /api/chat：多輪對話 ===")
    history = []

    # 第一輪
    history.append({"role": "user", "content": "有沒有關於環保的繪本？"})
    print("Q1: 有沒有關於環保的繪本？")
    r = requests.post(f"{BASE}/api/chat", json={"messages": history}, timeout=120)
    data = r.json()
    print("A1:", data["text"][:300], "\n")
    history = data["messages"]  # 用後端回傳的完整歷史接著對話

    # 第二輪（記得第一輪上下文）
    history.append({"role": "user", "content": "其中你最推薦哪一本？告訴我它的第 1 頁阿美語怎麼說"})
    print("Q2: 其中你最推薦哪一本？告訴我它的第 1 頁阿美語怎麼說")
    r = requests.post(f"{BASE}/api/chat", json={"messages": history}, timeout=120)
    data = r.json()
    print("A2:", data["text"][:500])
    print()


def test_chat_stream():
    print("=== /api/chat/stream：SSE streaming ===")
    print("Q: 簡單介紹「思樂本的種子」這本書")
    with requests.post(
        f"{BASE}/api/chat/stream",
        json={
            "messages": [
                {"role": "user", "content": "簡單介紹「思樂本的種子」這本書"}
            ]
        },
        stream=True,
        timeout=120,
    ) as r:
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("event:"):
                event = line.split(":", 1)[1].strip()
            elif line.startswith("data:"):
                data = json.loads(line.split(":", 1)[1].strip())
                if event == "text":
                    print(data["delta"], end="", flush=True)
                elif event == "tool_use":
                    print(f"\n[Claude 正在呼叫工具 {data['name']}({data['input']})]")
                elif event == "tool_result":
                    print(f"[工具回傳預覽：{data['output_preview'][:80]}...]")
                elif event == "done":
                    print("\n[結束]")
                elif event == "error":
                    print(f"\n[錯誤：{data['error']}]")
    print()


if __name__ == "__main__":
    test_health()
    test_list_books()
    test_chat_simple()
    test_chat_multiturn()
    test_chat_stream()
