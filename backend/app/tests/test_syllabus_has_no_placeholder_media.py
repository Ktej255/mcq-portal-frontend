"""The shipped syllabus must not point students at videos that do not exist."""

import json
import re
from pathlib import Path

SYLLABUS = Path(__file__).resolve().parents[1] / "core" / "gs_lms" / "data" / "gs_geography_syllabus.json"
# A YouTube video id is exactly 11 characters of letters, digits, "-" and "_".
REAL_VIDEO = re.compile(r"^https://(www\.youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]{11}$")


def _video_urls(node):
    if isinstance(node, dict):
        if node.get("video_url"):
            yield node["video_url"]
        for value in node.values():
            yield from _video_urls(value)
    elif isinstance(node, list):
        for item in node:
            yield from _video_urls(item)


def test_every_video_link_in_the_syllabus_is_a_real_video_address():
    urls = list(_video_urls(json.loads(SYLLABUS.read_text(encoding="utf-8"))))
    invented = [url for url in urls if not REAL_VIDEO.match(url)]
    assert invented == []
