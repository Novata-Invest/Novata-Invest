#!/usr/bin/env python3
"""
Сборка автономных версий страниц.

Берёт index.html / policy.html / agreement.html, вшивает внутрь CSS, JS и
картинки (base64) и кладёт результат в папку standalone/. Каждый файл после
этого работает сам по себе — без папки assets. Именно такие файлы удобно
вставлять в Tilda или пересылать заказчику одним вложением.

Запуск:  python3 build-standalone.py
"""

import base64
import mimetypes
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUT = ROOT / "standalone"
PAGES = ["index.html", "policy.html", "agreement.html"]


def data_uri(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    if mime is None:
        mime = "application/octet-stream"
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode("ascii"))


def inline_stylesheets(html: str) -> str:
    def repl(match: "re.Match[str]") -> str:
        href = match.group(1)
        if href.startswith("http"):
            return match.group(0)  # шрифты Google оставляем ссылкой
        css = (ROOT / href).read_text(encoding="utf-8")
        css = inline_css_urls(css)
        return "<style>\n%s\n</style>" % css

    return re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/?>', repl, html)


def inline_css_urls(css: str) -> str:
    def repl(match: "re.Match[str]") -> str:
        url = match.group(1).strip("'\"")
        if url.startswith(("http", "data:")):
            return match.group(0)
        target = (ASSETS / Path(url).name)
        if not target.exists():
            return match.group(0)
        return "url('%s')" % data_uri(target)

    return re.sub(r"url\(([^)]+)\)", repl, css)


def inline_scripts(html: str) -> str:
    def repl(match: "re.Match[str]") -> str:
        src = match.group(1)
        if src.startswith("http"):
            return match.group(0)
        js = (ROOT / src).read_text(encoding="utf-8")
        return "<script>\n%s\n</script>" % js

    return re.sub(r'<script src="([^"]+)"></script>', repl, html)


def inline_images(html: str) -> str:
    def repl(match: "re.Match[str]") -> str:
        attr, url = match.group(1), match.group(2)
        if url.startswith(("http", "data:", "#")):
            return match.group(0)
        target = ROOT / url
        if not target.exists():
            return match.group(0)
        return '%s="%s"' % (attr, data_uri(target))

    return re.sub(r'(src|href)="(assets/[^"]+)"', repl, html)


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    for name in PAGES:
        html = (ROOT / name).read_text(encoding="utf-8")
        html = inline_stylesheets(html)
        html = inline_scripts(html)
        html = inline_images(html)
        target = OUT / name
        target.write_text(html, encoding="utf-8")
        print("%-16s %7.0f КБ" % (target.name, target.stat().st_size / 1024))


if __name__ == "__main__":
    main()
