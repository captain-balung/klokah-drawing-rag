#!/usr/bin/env python3
"""
verify_cache.py — 驗證 prompt caching 真的生效（roadmap Phase 2 / F-01 葉節點）。

重用 query.py 真正的 build_system_blocks()（summary 設 cache_control: ephemeral），
連打兩次 Claude API：
  - 第一次：寫入快取（cache_creation_input_tokens > 0）
  - 第二次：命中快取（cache_read_input_tokens > 0）→ 即成本鐵則生效的證明

跑法（先在 backend/.env 設好 ANTHROPIC_API_KEY）：
    cd backend
    python verify_cache.py
"""

import query  # 觸發 load_dotenv + 載入 summary + 建 client

MAX_TOKENS = 64  # 驗證只看 usage，輸出壓到最低省成本


def call(user_text: str):
    resp = query.client.messages.create(
        model=query.MODEL,
        max_tokens=MAX_TOKENS,
        system=query.build_system_blocks(),
        messages=[{"role": "user", "content": user_text}],
    )
    return resp.usage


def main() -> int:
    u1 = call("用一句話介紹你能幫我做什麼。")
    print("第一次 usage:", u1)
    u2 = call("再用一句話說明一次。")
    print("第二次 usage:", u2)

    cache_read = getattr(u2, "cache_read_input_tokens", 0) or 0
    if cache_read > 0:
        print(f"\nPASS ✅ 第二次 cache_read_input_tokens = {cache_read}（caching 命中）")
        return 0
    print("\nFAIL ❌ 第二次 cache_read_input_tokens = 0（caching 未命中）")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
