"""Small helpers shared by the content tools (bank matcher, spreadsheets, importer).

Nothing here touches the database: it only reads the subject JSON tree.
"""

from __future__ import annotations

import difflib
import re
import unicodedata
from typing import Any, Iterator

# Keys inside a content block that never hold readable text.
_NON_TEXT_KEYS = {"type", "tone", "url", "video_url", "src", "image", "icon", "id"}


def iter_leaves(tree: list[Any], ancestors: tuple[str, ...] = ()) -> Iterator[tuple[dict[str, Any], tuple[str, ...]]]:
    """Yield ``(leaf_node, ancestor_titles)`` for every leaf topic, in file order."""
    for node in tree or []:
        if not isinstance(node, dict):
            continue
        children = node.get("children")
        if children:
            yield from iter_leaves(children, ancestors + (str(node.get("title") or ""),))
        elif node.get("node_type", "LEAF_TOPIC") == "LEAF_TOPIC":
            yield node, ancestors


def normalise_question(text: Any) -> str:
    """Lower-case letters and digits only, single spaces: used to spot duplicate questions."""
    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text.lower()).split())


def normalise_title(text: Any) -> str:
    """A forgiving form of a topic title for lookups (case, spacing, dash and quote styles)."""
    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKC", text).replace("–", "-").replace("—", "-")
    text = text.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    return " ".join(text.casefold().split())


class TopicIndex:
    """Find leaf topics by title. Exact titles win; otherwise a forgiving match is used
    as long as it points to exactly one topic."""

    def __init__(self, tree: list[Any]):
        self.leaves: list[dict[str, Any]] = []
        self.ancestors: dict[int, tuple[str, ...]] = {}
        self._exact: dict[str, list[dict[str, Any]]] = {}
        self._loose: dict[str, list[dict[str, Any]]] = {}
        for leaf, anc in iter_leaves(tree):
            self.leaves.append(leaf)
            self.ancestors[id(leaf)] = anc
            title = leaf.get("title")
            if isinstance(title, str):
                self._exact.setdefault(title, []).append(leaf)
                self._loose.setdefault(normalise_title(title), []).append(leaf)

    @property
    def titles(self) -> list[str]:
        return [leaf["title"] for leaf in self.leaves if isinstance(leaf.get("title"), str)]

    def find(self, title: Any) -> tuple[dict[str, Any] | None, str | None]:
        """Return ``(leaf, None)`` or ``(None, plain-language reason)``."""
        if not isinstance(title, str) or not title.strip():
            return None, "the topic title is empty"
        for key, table in ((title, self._exact), (normalise_title(title), self._loose)):
            hits = table.get(key, [])
            if len(hits) == 1:
                return hits[0], None
            if len(hits) > 1:
                return None, f'more than one topic is titled "{title}", so it is not clear which one is meant'
        close = difflib.get_close_matches(title.strip(), self.titles, n=1, cutoff=0.6)
        hint = f' Did you mean "{close[0]}"?' if close else ""
        return None, f'there is no topic titled "{title.strip()}".{hint}'


def collect_text(value: Any) -> list[str]:
    """Every readable string inside a content block (or any nested structure)."""
    out: list[str] = []
    if isinstance(value, str):
        if value.strip():
            out.append(value)
    elif isinstance(value, list):
        for item in value:
            out.extend(collect_text(item))
    elif isinstance(value, dict):
        for key, item in value.items():
            if key not in _NON_TEXT_KEYS:
                out.extend(collect_text(item))
    return out


def mcq_option_texts(mcq: dict[str, Any]) -> list[str]:
    options = mcq.get("options")
    texts: list[str] = []
    if isinstance(options, list):
        for opt in options:
            if isinstance(opt, dict):
                texts.append(str(opt.get("text") or ""))
            elif isinstance(opt, str):
                texts.append(opt)
    return texts
