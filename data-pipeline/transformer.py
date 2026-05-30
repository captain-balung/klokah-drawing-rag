#!/usr/bin/env python3
"""
transformer.py — 把舊格式 book_*.json 轉成新結構（中文去重版）

舊結構（langs × pages，中文重複 16 次）：
    book_167.json
    └─ languages[]
       ├─ 阿美語 → pages[1..18]（含 ab + ch + audio + image）
       ├─ 泰雅語 → pages[1..18]
       └─ ... 16 種

新結構（pages × langs，中文只放一次）：
    book_167.json
    └─ pages[1..18]
       └─ 每頁:
          ├─ chinese_text          ← 主中文版（多數族採用的版本）
          ├─ chinese_variants[]    ← 少數族用了不一樣的中文（罕見，多半微調）
          ├─ image_url             ← 16 族共用
          ├─ audio_url_chinese     ← 16 族共用
          └─ indigenous_versions[] ← 各族語的文字 + 族語音檔（只放差異）

輸出：
    output_v2/index.json     全部書本 metadata 速查表
    output_v2/summary.jsonl  中文濃縮版（給 LLM 快速找書用）
    output_v2/books/book_{id}.json  完整版（中文去重 + 各族語文字/音檔）

用法：
    python transformer.py                    # 讀 output/，寫 output_v2/
    python transformer.py --in IN --out OUT  # 自訂路徑
    python transformer.py --check 167        # 檢查單本書，不寫檔
"""

import argparse
import json
import logging
from collections import Counter
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("transformer")


# ------------------------------------------------------------------
# 核心轉換邏輯
# ------------------------------------------------------------------
def transform_book(old: dict) -> dict:
    """
    把舊格式 book dict 轉成新格式。
    舊：languages[].pages[]
    新：pages[].indigenous_versions[]
    """
    book_id = old["id"]
    languages = old.get("languages", [])

    if not languages:
        # 沒有任何族語版本，直接回傳骨架
        return {
            "id": book_id,
            "title": old.get("title", ""),
            "illustrator": old.get("illustrator", ""),
            "level": old.get("level", ""),
            "grammar_focus": old.get("grammar_focus", ""),
            "summary": old.get("summary", ""),
            "language_count": 0,
            "available_languages": [],
            "page_count": 0,
            "pages": [],
            "source_urls": old.get("source_urls", {}),
        }

    # 1) 確認各語版的頁數一致；若不一致，取最大值，缺的頁面 indigenous_versions 留空
    page_counts = [lang["page_count"] for lang in languages]
    max_pages = max(page_counts)
    if len(set(page_counts)) > 1:
        log.warning("  book %d: 各語版頁數不一致 %s，取最大值 %d",
                    book_id, page_counts, max_pages)

    # 2) 收集每本書「有哪幾族」的速查 metadata
    available_languages = [
        {"lid": lang["lid"], "name": lang["language"], "page_count": lang["page_count"]}
        for lang in languages
    ]

    # 3) 逐頁翻轉：對第 N 頁，收集 16 族在這頁的內容
    new_pages = []
    for page_idx in range(max_pages):
        page_no = page_idx + 1

        # 從每個語版抽出該頁
        per_lang_page = []  # [(language_dict, page_dict_or_None)]
        for lang in languages:
            if page_idx < len(lang["pages"]):
                per_lang_page.append((lang, lang["pages"][page_idx]))
            else:
                per_lang_page.append((lang, None))

        # ---- 整合中文 ----
        # 大多數情況 16 族中文一樣；偶爾少數族有微調，記到 variants
        ch_counter = Counter()
        for _lang, p in per_lang_page:
            if p:
                ch_counter[p["chinese_text"]] += 1

        if not ch_counter:
            main_chinese = ""
            chinese_variants = []
        else:
            # 找出最多人用的中文當「主版」
            main_chinese, _ = ch_counter.most_common(1)[0]
            # 其他不同的中文整理到 variants
            chinese_variants = []
            for ch, _cnt in ch_counter.items():
                if ch == main_chinese:
                    continue
                used_by = [
                    {"lid": lang["lid"], "name": lang["language"]}
                    for lang, p in per_lang_page
                    if p and p["chinese_text"] == ch
                ]
                chinese_variants.append({
                    "text": ch,
                    "used_by": used_by,
                })

        # ---- 整合共用欄位（圖片、華語音檔）----
        # 這些理論上 16 族都一樣，取第一個非空的當代表
        image_url = ""
        audio_url_chinese = ""
        for _lang, p in per_lang_page:
            if p:
                if not image_url and p.get("image_url"):
                    image_url = p["image_url"]
                if not audio_url_chinese and p.get("audio_url_chinese"):
                    audio_url_chinese = p["audio_url_chinese"]
                if image_url and audio_url_chinese:
                    break

        # 順便偷偷檢查：圖片或華語音檔有不一致嗎？（除錯用，不影響輸出）
        img_set = set(p["image_url"] for _l, p in per_lang_page if p and p.get("image_url"))
        ch_audio_set = set(p["audio_url_chinese"] for _l, p in per_lang_page if p and p.get("audio_url_chinese"))
        if len(img_set) > 1:
            log.warning("  book %d page %d: 圖片 URL 在語版間不一致 %s",
                        book_id, page_no, img_set)
        if len(ch_audio_set) > 1:
            log.debug("  book %d page %d: 華語音檔 URL 不一致（%d 個版本）",
                      book_id, page_no, len(ch_audio_set))

        # ---- 整合各族語文字與音檔 ----
        indigenous_versions = []
        for lang, p in per_lang_page:
            if not p:
                continue
            indigenous_versions.append({
                "lid": lang["lid"],
                "language": lang["language"],
                "text": p.get("indigenous_text", ""),
                "audio_url": p.get("audio_url_indigenous", ""),
            })

        new_pages.append({
            "page_number": page_no,
            "chinese_text": main_chinese,
            "chinese_variants": chinese_variants,   # 通常是空 list
            "image_url": image_url,
            "audio_url_chinese": audio_url_chinese,
            "indigenous_versions": indigenous_versions,
        })

    return {
        "id": book_id,
        "title": old.get("title", ""),
        "illustrator": old.get("illustrator", ""),
        "level": old.get("level", ""),
        "grammar_focus": old.get("grammar_focus", ""),
        "summary": old.get("summary", ""),
        "language_count": len(languages),
        "available_languages": available_languages,
        "page_count": max_pages,
        "pages": new_pages,
        "source_urls": old.get("source_urls", {}),
    }


# ------------------------------------------------------------------
# Summary（給 LLM 快速找書的中文濃縮版）
# ------------------------------------------------------------------
def make_summary_record(new_book: dict) -> dict:
    """
    從新格式 book 抽出「找書用」的中文濃縮版。
    特點：
    - 只有中文（族語要看內容時才載完整版）
    - 一本書一個 JSON 物件（適合存 JSONL）
    - 包含足夠 metadata 讓 LLM 決定要不要載完整版
    """
    return {
        "id": new_book["id"],
        "title": new_book["title"],
        "illustrator": new_book["illustrator"],
        "level": new_book["level"],
        "grammar_focus": new_book["grammar_focus"],
        "summary": new_book["summary"],
        "page_count": new_book["page_count"],
        "available_languages": [a["name"] for a in new_book["available_languages"]],
        "chinese_pages": [
            {
                "page_number": p["page_number"],
                "chinese_text": p["chinese_text"],
            }
            for p in new_book["pages"]
        ],
    }


def make_index_record(new_book: dict) -> dict:
    """
    最輕量的 metadata（不含逐頁中文）。
    給 LLM 第一輪「初篩」用：「哪本書可能跟 XXX 主題有關？」
    """
    return {
        "id": new_book["id"],
        "title": new_book["title"],
        "level": new_book["level"],
        "grammar_focus": new_book["grammar_focus"],
        "summary": new_book["summary"],
        "page_count": new_book["page_count"],
        "language_count": new_book["language_count"],
        "available_languages": [a["name"] for a in new_book["available_languages"]],
    }


# ------------------------------------------------------------------
# 主流程
# ------------------------------------------------------------------
def cmd_check(in_dir: Path, book_id: int):
    """單本檢查模式：把轉換結果印到螢幕，不寫檔。"""
    src = in_dir / "books" / f"book_{book_id}.json"
    if not src.exists():
        log.error("找不到 %s", src)
        return
    old = json.loads(src.read_text(encoding="utf-8"))
    new = transform_book(old)

    print("\n" + "=" * 60)
    print(f"書 #{book_id} 《{new['title']}》轉換結果")
    print("=" * 60)
    print(f"級別: {new['level']}  語法重點: {new['grammar_focus']}")
    print(f"族語版本: {new['language_count']} 種  |  總頁數: {new['page_count']}")
    print(f"族語: {', '.join(a['name'] for a in new['available_languages'])}")
    print()

    # 顯示中文差異統計
    variant_pages = [p for p in new["pages"] if p["chinese_variants"]]
    print(f"有中文差異的頁面: {len(variant_pages)}/{new['page_count']}")
    for p in variant_pages:
        print(f"  P.{p['page_number']}: 主版「{p['chinese_text']}」")
        for v in p["chinese_variants"]:
            users = ", ".join(u["name"] for u in v["used_by"])
            print(f"          異版「{v['text']}」 ← {users}")

    # 體積比較
    old_size = len(json.dumps(old, ensure_ascii=False))
    new_size = len(json.dumps(new, ensure_ascii=False))
    summary = make_summary_record(new)
    sum_size = len(json.dumps(summary, ensure_ascii=False))
    print("\n體積比較（單位：字元）：")
    print(f"  舊格式:        {old_size:>8,}")
    print(f"  新格式:        {new_size:>8,}  ({new_size/old_size*100:.1f}%)")
    print(f"  summary 條目:   {sum_size:>8,}  ({sum_size/old_size*100:.1f}%)")


def cmd_run(in_dir: Path, out_dir: Path):
    """完整轉換：讀 in_dir/books/*.json，寫 out_dir/{index.json, summary.jsonl, books/*.json}"""
    src_books = in_dir / "books"
    if not src_books.exists():
        log.error("找不到輸入目錄 %s", src_books)
        return

    out_books = out_dir / "books"
    out_books.mkdir(parents=True, exist_ok=True)

    src_files = sorted(src_books.glob("book_*.json"))
    log.info("找到 %d 本舊格式繪本，開始轉換...", len(src_files))

    index_records = []
    summary_records = []

    total_old = 0
    total_new = 0
    total_summary = 0

    for i, src in enumerate(src_files, 1):
        try:
            old = json.loads(src.read_text(encoding="utf-8"))
        except Exception as e:
            log.error("[%d/%d] 讀取 %s 失敗: %s", i, len(src_files), src.name, e)
            continue

        new = transform_book(old)

        # 寫單本新檔
        out_path = out_books / src.name
        new_text = json.dumps(new, ensure_ascii=False, indent=2)
        out_path.write_text(new_text, encoding="utf-8")

        # 累計 index + summary
        index_records.append(make_index_record(new))
        summary_records.append(make_summary_record(new))

        # 體積累計（不含 indent，更接近實際傳輸大小）
        total_old += len(json.dumps(old, ensure_ascii=False))
        total_new += len(json.dumps(new, ensure_ascii=False))
        total_summary += len(json.dumps(summary_records[-1], ensure_ascii=False))

        log.info("[%d/%d] book %d 《%s》: %d 族 × %d 頁",
                 i, len(src_files), new["id"], new["title"],
                 new["language_count"], new["page_count"])

    # 寫 index.json（一個 JSON array）
    index_path = out_dir / "index.json"
    index_path.write_text(
        json.dumps(index_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    log.info("寫入 index → %s（%d 筆）", index_path, len(index_records))

    # 寫 summary.jsonl（一行一本書，方便 streaming load）
    summary_path = out_dir / "summary.jsonl"
    with summary_path.open("w", encoding="utf-8") as f:
        for rec in summary_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    log.info("寫入 summary → %s（%d 筆）", summary_path, len(summary_records))

    # 報表
    print("\n" + "=" * 60)
    print("轉換完成")
    print("=" * 60)
    print(f"  繪本數量: {len(index_records)}")
    print(f"  輸出位置: {out_dir}")
    print()
    print("體積比較（純 JSON 字元數，不含 indent）：")
    print(f"  舊格式總和:    {total_old:>12,}  字元")
    print(f"  新格式總和:    {total_new:>12,}  字元  ({total_new/total_old*100:.1f}%)")
    print(f"  summary 全部:  {total_summary:>12,}  字元  ({total_summary/total_old*100:.1f}%)")
    print()
    print("粗估 token 數（中文 ~1.5 字/token，混合內容 ~2 字/token）：")
    print(f"  summary.jsonl ≈ {total_summary // 2:,} ~ {total_summary // 1:,} tokens")
    print()
    print("使用建議：")
    print("  - 找書（主題、級別、語法）   → 把 summary.jsonl 整個丟給 LLM")
    print("  - 看某本書的族語內容        → 載入 books/book_{id}.json")
    print("  - 純 metadata 速查         → 用 index.json")


def main():
    parser = argparse.ArgumentParser(description="把舊格式 book_*.json 轉成中文去重的新結構")
    parser.add_argument("--in", dest="in_dir", default="output",
                        help="輸入目錄（含 books/*.json），預設 output")
    parser.add_argument("--out", dest="out_dir", default="output_v2",
                        help="輸出目錄，預設 output_v2")
    parser.add_argument("--check", type=int, metavar="BOOK_ID",
                        help="只檢查單本書（印到螢幕，不寫檔）")
    args = parser.parse_args()

    in_dir = Path(args.in_dir)
    out_dir = Path(args.out_dir)

    if args.check is not None:
        cmd_check(in_dir, args.check)
    else:
        cmd_run(in_dir, out_dir)


if __name__ == "__main__":
    main()
