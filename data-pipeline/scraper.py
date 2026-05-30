#!/usr/bin/env python3
"""
族語 E 樂園繪本爬蟲
抓取 https://web.klokah.tw/pbc/ 的繪本資料，輸出 JSON 給 RAG/LLM 系統用。

用法：
    python3 scraper.py probe --id 167      # 偵察觀看繪本頁的真實 API
    python3 scraper.py list                 # 抓繪本清單
    python3 scraper.py book --id 167        # 抓單本繪本
    python3 scraper.py all                  # 批次抓全部（斷點續爬）
"""

import argparse
import json
import logging
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ------------------------------------------------------------------
# 設定
# ------------------------------------------------------------------
BASE = "https://web.klokah.tw"
LIST_URL = f"{BASE}/pbc/index.php"
INFO_URL = f"{BASE}/pbc/book/index.php"          # ?id=
ONLINE_URL = f"{BASE}/pbc/book/online/index.php" # ?id=

# 從 js_pbc_book_online_index.js 偵察出來的真實 API endpoint
# 用法：GET get_data.php?id={書本id}&lid={語別id}
# 注意：呼叫時要設 Referer，否則伺服器可能拒絕
DATA_API = f"{BASE}/pbc/book/online/get_data.php"

# 音檔規則：https://web.klokah.tw/text/sound/{audio_url}.mp3
AUDIO_ROOT = f"{BASE}/text/sound/"

# 16 族語對照表（完整抄自 js_js_klokah.js）
# 注意：每本繪本不一定有所有 16 族版本，沒有的版本 API 會回空白
LANGUAGES = [
    {"lid":  1, "name": "阿美語"},
    {"lid":  2, "name": "泰雅語"},
    {"lid":  3, "name": "賽夏語"},
    {"lid":  4, "name": "邵語"},
    {"lid":  5, "name": "賽德克語"},
    {"lid":  6, "name": "布農語"},
    {"lid":  7, "name": "排灣語"},
    {"lid":  8, "name": "魯凱語"},
    {"lid":  9, "name": "太魯閣語"},
    {"lid": 10, "name": "噶瑪蘭語"},
    {"lid": 11, "name": "鄒語"},
    {"lid": 12, "name": "卑南語"},
    {"lid": 13, "name": "雅美語"},
    {"lid": 14, "name": "撒奇萊雅語"},
    {"lid": 15, "name": "卡那卡那富語"},
    {"lid": 16, "name": "拉阿魯哇語"},
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
}

REQUEST_DELAY = 0.5   # 每個請求間至少間隔幾秒（一本書要打 ~17 次 API，太慢會等很久）
MAX_RETRIES = 3
TIMEOUT = 30

OUTPUT_DIR = Path(__file__).parent / "output"
BOOKS_DIR = OUTPUT_DIR / "books"
PROBE_DIR = Path(__file__).parent / "probe"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("klokah")


# ------------------------------------------------------------------
# HTTP 工具
# ------------------------------------------------------------------
def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def fetch(session: requests.Session, url: str, *, params=None, referer=None) -> requests.Response:
    """禮貌的 GET：自動加 referer、重試、間隔。"""
    headers = {}
    if referer:
        headers["Referer"] = referer

    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            time.sleep(REQUEST_DELAY)
            r = session.get(url, params=params, headers=headers, timeout=TIMEOUT)
            r.raise_for_status()
            r.encoding = r.apparent_encoding or "utf-8"
            return r
        except Exception as e:
            last_err = e
            log.warning("fetch fail (%d/%d): %s -> %s", attempt, MAX_RETRIES, url, e)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"giving up after {MAX_RETRIES} retries: {url} ({last_err})")


# ==================================================================
# STAGE 0：API 偵察
# ==================================================================
def cmd_probe(book_id: int):
    """
    抓觀看繪本頁的 HTML + 所有引用的 JS 檔案，並嘗試從 JS 中找到
    真正的資料 API endpoint。

    觀察重點：
    - 觀看頁是 SPA，HTML 只是殼，真正內容靠 JS 從 API 拉
    - 通常會看到 $.ajax({url: 'xxx.php?id='+book_id+'&lang='+lang}) 之類的呼叫
    - 我們需要找出這個 endpoint 和它的回傳格式
    """
    PROBE_DIR.mkdir(parents=True, exist_ok=True)
    session = make_session()

    online_url = f"{ONLINE_URL}?id={book_id}"
    log.info("Fetching online page: %s", online_url)

    r = fetch(session, ONLINE_URL, params={"id": book_id}, referer=f"{INFO_URL}?id={book_id}")
    html_path = PROBE_DIR / f"online_{book_id}.html"
    html_path.write_text(r.text, encoding="utf-8")
    log.info("Saved HTML -> %s (%d bytes)", html_path, len(r.text))

    # 找所有 JS 檔
    soup = BeautifulSoup(r.text, "html.parser")
    scripts = soup.find_all("script")
    js_urls = []
    inline_js = []
    for s in scripts:
        if s.get("src"):
            js_urls.append(urljoin(online_url, s["src"]))
        elif s.string:
            inline_js.append(s.string)

    log.info("Found %d external JS, %d inline scripts", len(js_urls), len(inline_js))

    # 儲存 inline JS
    if inline_js:
        inline_path = PROBE_DIR / f"online_{book_id}_inline.js"
        inline_path.write_text("\n\n/* ---- next script ---- */\n\n".join(inline_js), encoding="utf-8")
        log.info("Saved inline scripts -> %s", inline_path)

    # 下載並儲存外部 JS（只下載同網域的）
    same_origin_js = [u for u in js_urls if urlparse(u).netloc == urlparse(BASE).netloc]
    log.info("Same-origin JS to download: %d", len(same_origin_js))
    for ju in same_origin_js:
        try:
            jr = fetch(session, ju, referer=online_url)
            name = re.sub(r"[^a-zA-Z0-9_.-]", "_", urlparse(ju).path.lstrip("/"))
            out = PROBE_DIR / f"js_{name}"
            out.write_text(jr.text, encoding="utf-8")
            log.info("  saved %s -> %s", ju, out.name)
        except Exception as e:
            log.warning("  failed %s: %s", ju, e)

    # 從所有 JS（內聯 + 外部）中搜尋疑似 API endpoint
    all_js = "\n".join(inline_js)
    for jp in PROBE_DIR.glob("js_*"):
        all_js += "\n" + jp.read_text(encoding="utf-8", errors="ignore")

    # 找 .php 路徑、ajax 呼叫、url 字串
    patterns = [
        (r"['\"][^'\"]*\.php[^'\"]*['\"]", "PHP endpoints"),
        (r"\$\.(get|post|ajax|getJSON)\s*\(\s*['\"]([^'\"]+)['\"]", "jQuery AJAX calls"),
        (r"fetch\s*\(\s*['\"]([^'\"]+)['\"]", "fetch() calls"),
        (r"['\"](\.{0,2}/[^'\"]*\.(?:json|xml))['\"]", "JSON/XML paths"),
        (r"url\s*[:=]\s*['\"]([^'\"]+)['\"]", "url variables"),
    ]
    hits = {}
    for pat, label in patterns:
        found = re.findall(pat, all_js)
        # tuples -> 取最後一個非空元素
        flat = []
        for f in found:
            if isinstance(f, tuple):
                flat.append([x for x in f if x][-1] if any(f) else "")
            else:
                flat.append(f)
        uniq = sorted(set(x for x in flat if x and len(x) < 200))
        hits[label] = uniq

    findings_path = PROBE_DIR / f"findings_{book_id}.txt"
    with findings_path.open("w", encoding="utf-8") as f:
        f.write(f"# Probe findings for book id={book_id}\n\n")
        f.write(f"## External JS URLs ({len(js_urls)})\n")
        for u in js_urls:
            f.write(f"  {u}\n")
        f.write("\n")
        for label, items in hits.items():
            f.write(f"## {label} ({len(items)})\n")
            for it in items:
                f.write(f"  {it}\n")
            f.write("\n")
    log.info("Saved findings -> %s", findings_path)

    print()
    print("=" * 60)
    print(f"偵察完成，輸出在：{PROBE_DIR}")
    print("=" * 60)
    print("請把以下檔案的內容貼給 Claude，他會幫你補完抓取邏輯：")
    print(f"  1. {findings_path.name}（最重要，列出所有可疑的 API endpoint）")
    print(f"  2. {html_path.name}")
    print("  3. 任何看起來相關的 js_*.js 檔案")
    print()


# ==================================================================
# STAGE 1：繪本清單
# ==================================================================
def parse_list_page(html: str) -> list[dict]:
    """
    從繪本列表頁解出所有書本的基本資訊。
    列表頁每本書是這樣的結構：
        <a href="...book/index.php?id=XXX">標題</a>
        <p>簡介</p>
    """
    soup = BeautifulSoup(html, "html.parser")
    books = []
    seen = set()

    # 找所有指向 book/index.php?id= 的連結
    for a in soup.find_all("a", href=re.compile(r"book/index\.php\?id=\d+")):
        href = a["href"]
        m = re.search(r"id=(\d+)", href)
        if not m:
            continue
        bid = int(m.group(1))
        if bid in seen:
            continue
        seen.add(bid)

        title = a.get_text(strip=True)
        # 簡介通常在這個 a 之後
        summary = ""
        nxt = a.find_next(["p", "div"])
        if nxt and nxt.get_text(strip=True) and nxt.get_text(strip=True) != title:
            summary = nxt.get_text(" ", strip=True)

        books.append({
            "id": bid,
            "title": title,
            "summary": summary,
        })

    return books


def cmd_list():
    """抓繪本清單頁，輸出 output/index.json（先寫不含詳情的版本）。"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    session = make_session()
    log.info("Fetching list: %s", LIST_URL)
    r = fetch(session, LIST_URL)
    raw_path = OUTPUT_DIR / "_list_raw.html"
    raw_path.write_text(r.text, encoding="utf-8")

    books = parse_list_page(r.text)
    log.info("Parsed %d books from list page", len(books))

    out = OUTPUT_DIR / "index.json"
    out.write_text(json.dumps(books, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Saved -> %s", out)
    print(f"\n抓到 {len(books)} 本繪本，最新 ID = {max(b['id'] for b in books)}")


# ==================================================================
# STAGE 2：單本繪本資訊頁
# ==================================================================
def parse_info_page(html: str) -> dict:
    """
    從繪本資訊頁解出 metadata。
    頁面欄位：書名 / 繪者 / 級別 / 語法重點 / 內容簡介
    """
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text("\n", strip=True)

    # 用 label-based 解析比較穩
    info = {}
    labels = ["書名", "繪者", "級別", "語法重點", "內容簡介"]
    for label in labels:
        # 找該 label 的下一行非空文字
        pat = rf"{label}\s*\n+\s*([^\n]+)"
        m = re.search(pat, text)
        if m:
            info[label] = m.group(1).strip()
        else:
            info[label] = ""

    # 內容簡介可能跨多行，再多抓一些
    m = re.search(r"內容簡介\s*\n+\s*(.+?)(?=\n\s*(?:觀看繪本|觀看改編|改編此繪本|學習內容|\Z))",
                  text, re.DOTALL)
    if m:
        info["內容簡介"] = m.group(1).strip()

    return {
        "title": info.get("書名", ""),
        "illustrator": info.get("繪者", ""),
        "level": info.get("級別", ""),
        "grammar_focus": info.get("語法重點", ""),
        "summary": info.get("內容簡介", ""),
    }


def scrape_book_info(session: requests.Session, book_id: int) -> dict:
    log.info("  info page id=%d", book_id)
    r = fetch(session, INFO_URL, params={"id": book_id}, referer=LIST_URL)
    return parse_info_page(r.text)


# ==================================================================
# STAGE 3：觀看繪本頁 —— 透過 get_data.php API 取得每頁的文字、音訊、圖片
# ==================================================================
# 偵察結果（來自 js_pbc_book_online_index.js）：
#
#   $.get('get_data.php', { id: id, lid: lid }).done(on_done)
#   bookManager.book = $.parseJSON(msg);
#   bookManager.page.max = Object.keys(bookManager.book.pages).length
#
#   每頁的結構：
#     pages[N] = {
#       no:           頁碼,
#       ab:           族語文字,        # ab = aboriginal
#       ch:           華語文字,
#       audio_url:    族語音檔檔名,    # 不含路徑跟副檔名
#       audio_ch_url: 華語音檔檔名
#     }
#
#   音檔完整 URL：AUDIO_ROOT + audio_url + '.mp3'
#   圖片完整 URL：https://web.klokah.tw/pbc/book/{書本id}/{頁碼}.jpg
#
# 觀察重點：
# - get_data.php 接受 lid（語別）不接受 did（方言）—— 一個語別只有一個版本
# - 不是每本繪本都有 16 族版本；找不到的會回空 JSON 或無 pages 欄位


def fetch_book_data(session: requests.Session, book_id: int, lid: int) -> dict | None:
    """
    呼叫 get_data.php 抓某本書的某個族語版本。
    沒有該語版本的話可能回 null、回空字串、或 pages 為空字典 —— 都當作沒有。
    回 None 代表「這個語別沒有資料」，繪本資料字典代表「有」。
    """
    referer = f"{ONLINE_URL}?id={book_id}"
    try:
        r = fetch(
            session,
            DATA_API,
            params={"id": book_id, "lid": lid},
            referer=referer,
        )
    except Exception as e:
        log.warning("    lid=%d fetch error: %s", lid, e)
        return None

    text = (r.text or "").strip()
    if not text or text in ("null", "false", "[]", "{}"):
        return None

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        log.warning("    lid=%d: response not JSON (first 80 chars): %s", lid, text[:80])
        return None

    if not isinstance(data, dict):
        return None

    pages = data.get("pages")
    if not pages:
        return None

    # pages 可能是 dict（key 是字串頁碼）或 list；標準化成 list-of-pages
    if isinstance(pages, dict):
        # key 排序後轉成 list
        try:
            sorted_keys = sorted(pages.keys(), key=lambda k: int(k))
        except ValueError:
            sorted_keys = sorted(pages.keys())
        page_list = [pages[k] for k in sorted_keys]
    elif isinstance(pages, list):
        page_list = pages
    else:
        return None

    if not page_list:
        return None

    data["pages"] = page_list
    return data


def normalize_pages(book_id: int, raw_pages: list[dict]) -> list[dict]:
    """把 API 回傳的 page list 轉成我們要的乾淨格式，含完整 URL。"""
    out = []
    for i, p in enumerate(raw_pages, start=1):
        if not isinstance(p, dict):
            continue
        page_no = p.get("no") or i
        audio_ab = (p.get("audio_url") or "").strip()
        audio_ch = (p.get("audio_ch_url") or "").strip()
        out.append({
            "page_number": int(page_no) if str(page_no).isdigit() else page_no,
            "indigenous_text": (p.get("ab") or "").strip(),
            "chinese_text": (p.get("ch") or "").strip(),
            "audio_url_indigenous": (AUDIO_ROOT + audio_ab + ".mp3") if audio_ab else "",
            "audio_url_chinese": (AUDIO_ROOT + audio_ch + ".mp3") if audio_ch else "",
            "image_url": f"{BASE}/pbc/book/{book_id}/{page_no}.jpg",
        })
    return out


def scrape_book_pages(session: requests.Session, book_id: int) -> list[dict]:
    """
    遍歷 16 族語版本，把該書所有可用的族語版本都抓回來。
    回傳 list-of-language-versions，沒有的版本不會出現。
    """
    versions = []
    for lang in LANGUAGES:
        lid = lang["lid"]
        log.info("    lid=%d (%s) ...", lid, lang["name"])
        data = fetch_book_data(session, book_id, lid)
        if data is None:
            continue
        pages = normalize_pages(book_id, data["pages"])
        if not pages:
            continue
        versions.append({
            "lid": lid,
            "language": lang["name"],
            "page_count": len(pages),
            "pages": pages,
        })
    log.info("  -> got %d language version(s)", len(versions))
    return versions


def cmd_book(book_id: int):
    """抓單本繪本的完整資料：metadata + 所有族語版本的全頁內容。"""
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)
    session = make_session()

    log.info("=== Book id=%d ===", book_id)
    info = scrape_book_info(session, book_id)
    languages = scrape_book_pages(session, book_id)

    data = {
        "id": book_id,
        **info,
        "language_count": len(languages),
        "languages": languages,
        "source_urls": {
            "info": f"{INFO_URL}?id={book_id}",
            "online": f"{ONLINE_URL}?id={book_id}",
        },
    }

    out = BOOKS_DIR / f"book_{book_id}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Saved -> %s", out)
    print(f"\n書 #{book_id} 《{info['title']}》抓取完成")
    print(f"  繪者：{info['illustrator']}")
    print(f"  級別：{info['level']}  語法重點：{info['grammar_focus']}")
    print(f"  語言版本：{len(languages)} 種"
          + (f"（{', '.join(v['language'] for v in languages)}）" if languages else ""))


# ==================================================================
# STAGE 4：批次抓全部
# ==================================================================
def cmd_all():
    """批次抓全部繪本，跳過已存在的。"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)

    index_path = OUTPUT_DIR / "index.json"
    if not index_path.exists():
        log.info("index.json not found, fetching list first")
        cmd_list()

    books = json.loads(index_path.read_text(encoding="utf-8"))
    total = len(books)
    log.info("Total books in index: %d", total)

    done, skipped, failed = 0, 0, 0
    for i, b in enumerate(books, start=1):
        bid = b["id"]
        out = BOOKS_DIR / f"book_{bid}.json"
        if out.exists():
            log.info("[%d/%d] book %d already exists, skip", i, total, bid)
            skipped += 1
            continue
        log.info("[%d/%d] fetching book %d ...", i, total, bid)
        try:
            cmd_book(bid)
            done += 1
        except Exception as e:
            log.error("[%d/%d] book %d failed: %s", i, total, bid, e)
            failed += 1

    print("\n=== 完成 ===")
    print(f"  新抓：{done}  跳過：{skipped}  失敗：{failed}")


# ==================================================================
# CLI
# ==================================================================
def main():
    parser = argparse.ArgumentParser(description="族語 E 樂園繪本爬蟲")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_probe = sub.add_parser("probe", help="偵察觀看繪本頁的真實 API")
    p_probe.add_argument("--id", type=int, default=167)

    sub.add_parser("list", help="抓繪本清單")

    p_book = sub.add_parser("book", help="抓單本繪本")
    p_book.add_argument("--id", type=int, required=True)

    sub.add_parser("all", help="批次抓全部")

    args = parser.parse_args()
    if args.cmd == "probe":
        cmd_probe(args.id)
    elif args.cmd == "list":
        cmd_list()
    elif args.cmd == "book":
        cmd_book(args.id)
    elif args.cmd == "all":
        cmd_all()


if __name__ == "__main__":
    main()
