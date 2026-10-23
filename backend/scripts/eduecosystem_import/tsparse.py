"""Minimal, dependency-free extractor of question objects from TypeScript data files.

The Eduecosystem frontend stores questions as plain object literals inside
``export const X: MCQ[] = [ {...}, ... ]``.  Rather than evaluating TypeScript we
scan the source with a string/comment-aware brace matcher, and parse every
innermost ``{...}`` that has exactly one ``question:`` key and an ``options`` key
with a small, forgiving JS-literal parser.  Anything unparseable is skipped.

Only question-like objects are returned; flashcards, notes, timelines etc. do not
have ``question`` + ``options`` and are ignored.
"""

from __future__ import annotations

import re
from typing import Any, Iterator

_TOKEN_RE = re.compile(
    r"""//[^\n]*|/\*.*?\*/|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`|[{}]""",
    re.S,
)
_QUESTION_KEY_RE = re.compile(r"""(?<![\w$])["']?question["']?\s*:""")


class _Unparseable(Exception):
    pass


class _Unknown:
    """Placeholder for expressions we do not evaluate (identifiers, calls...)."""

    def __repr__(self) -> str:  # pragma: no cover
        return "<unknown>"


UNKNOWN = _Unknown()

_ESCAPES = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}
_IDENT_RE = re.compile(r"[A-Za-z_$][\w$]*")
_NUM_RE = re.compile(r"-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?")
_WS_RE = re.compile(r"(?:\s+|//[^\n]*|/\*.*?\*/)+", re.S)


class _Parser:
    def __init__(self, text: str):
        self.s = text
        self.i = 0

    def ws(self) -> None:
        m = _WS_RE.match(self.s, self.i)
        if m:
            self.i = m.end()

    def peek(self) -> str:
        return self.s[self.i] if self.i < len(self.s) else ""

    def parse_value(self) -> Any:
        self.ws()
        val = self.parse_primary()
        self.ws()
        # string concatenation: 'a' + 'b'
        while self.peek() == "+" and isinstance(val, str):
            self.i += 1
            self.ws()
            nxt = self.parse_primary()
            if isinstance(nxt, str):
                val += nxt
            else:
                val = UNKNOWN
            self.ws()
        return val

    def parse_primary(self) -> Any:
        c = self.peek()
        if c in ("'", '"'):
            return self.parse_string(c)
        if c == "`":
            return self.parse_template()
        if c == "[":
            return self.parse_array()
        if c == "{":
            return self.parse_object()
        m = _NUM_RE.match(self.s, self.i)
        if m and (c.isdigit() or c in "-."):
            self.i = m.end()
            txt = m.group(0)
            return float(txt) if any(ch in txt for ch in ".eE") else int(txt)
        m = _IDENT_RE.match(self.s, self.i)
        if m:
            word = m.group(0)
            if word in ("true", "false", "null", "undefined"):
                self.i = m.end()
                return {"true": True, "false": False}.get(word)
            return self.skip_expression()
        if c == "":
            raise _Unparseable("eof")
        return self.skip_expression()

    def skip_expression(self) -> Any:
        """Skip an unevaluated expression up to the next top-level , ] or }."""
        depth = 0
        n = len(self.s)
        while self.i < n:
            c = self.s[self.i]
            if c in ("'", '"'):
                self.parse_string(c)
                continue
            if c == "`":
                self.parse_template(allow_expr=True)
                continue
            if c in "([{":
                depth += 1
            elif c in ")]}":
                if depth == 0:
                    break
                depth -= 1
            elif c == "," and depth == 0:
                break
            self.i += 1
        return UNKNOWN

    def parse_string(self, quote: str) -> str:
        s, i = self.s, self.i + 1
        out: list[str] = []
        n = len(s)
        while i < n:
            c = s[i]
            if c == quote:
                self.i = i + 1
                return "".join(out)
            if c == "\\":
                i += 1
                if i >= n:
                    break
                e = s[i]
                if e == "u":
                    if s[i + 1 : i + 2] == "{":
                        j = s.index("}", i)
                        out.append(chr(int(s[i + 2 : j], 16)))
                        i = j
                    else:
                        out.append(chr(int(s[i + 1 : i + 5], 16)))
                        i += 4
                elif e == "x":
                    out.append(chr(int(s[i + 1 : i + 3], 16)))
                    i += 2
                elif e == "\n":
                    pass
                else:
                    out.append(_ESCAPES.get(e, e))
                i += 1
                continue
            out.append(c)
            i += 1
        raise _Unparseable("unterminated string")

    def parse_template(self, allow_expr: bool = False) -> str:
        s, i = self.s, self.i + 1
        n = len(s)
        j = i
        while j < n:
            if s[j] == "\\":
                j += 2
                continue
            if s[j] == "`":
                break
            j += 1
        else:
            raise _Unparseable("unterminated template")
        raw = s[i:j]
        if "${" in raw and not allow_expr:
            raise _Unparseable("template expression")
        self.i = j + 1
        if allow_expr:
            return raw
        out: list[str] = []
        k = 0
        while k < len(raw):
            if raw[k] == "\\" and k + 1 < len(raw):
                e = raw[k + 1]
                out.append(_ESCAPES.get(e, e))
                k += 2
            else:
                out.append(raw[k])
                k += 1
        return "".join(out)

    def parse_array(self) -> list:
        self.i += 1
        items: list = []
        while True:
            self.ws()
            c = self.peek()
            if c == "]":
                self.i += 1
                return items
            if c == ",":
                self.i += 1
                continue
            if c == "":
                raise _Unparseable("eof in array")
            if self.s.startswith("...", self.i):
                self.i += 3
                self.parse_value()
                continue
            items.append(self.parse_value())

    def parse_object(self) -> dict:
        self.i += 1
        obj: dict = {}
        while True:
            self.ws()
            c = self.peek()
            if c == "}":
                self.i += 1
                return obj
            if c == ",":
                self.i += 1
                continue
            if c == "":
                raise _Unparseable("eof in object")
            if self.s.startswith("...", self.i):
                self.i += 3
                self.parse_value()
                continue
            if c in ("'", '"'):
                key = self.parse_string(c)
            elif c == "[":
                raise _Unparseable("computed key")
            else:
                m = _IDENT_RE.match(self.s, self.i) or _NUM_RE.match(self.s, self.i)
                if not m:
                    raise _Unparseable(f"bad key at {self.i}")
                key = m.group(0)
                self.i = m.end()
            self.ws()
            if self.peek() == ":":
                self.i += 1
                obj[key] = self.parse_value()
            elif self.peek() in (",", "}"):
                obj[key] = UNKNOWN  # shorthand property
            elif self.peek() == "(":
                raise _Unparseable("method")
            else:
                raise _Unparseable(f"expected ':' at {self.i}")


def parse_js_literal(text: str) -> Any:
    """Parse a JS object/array literal; raises on hard syntax errors."""
    p = _Parser(text)
    val = p.parse_value()
    return val


def iter_question_objects(src: str) -> Iterator[dict]:
    """Yield raw parsed dicts for every innermost object that looks like a question."""
    stack: list[int] = []
    last_parsed_start = -1
    for m in _TOKEN_RE.finditer(src):
        tok = m.group(0)
        if tok == "{":
            stack.append(m.start())
        elif tok == "}":
            if not stack:
                continue
            start = stack.pop()
            if last_parsed_start >= start:
                continue  # contains an already-parsed child question
            text = src[start : m.end()]
            if "options" not in text:
                continue
            if len(_QUESTION_KEY_RE.findall(text)) != 1:
                continue
            try:
                obj = parse_js_literal(text)
            except (_Unparseable, ValueError, IndexError):
                continue
            if isinstance(obj, dict) and isinstance(obj.get("question"), str):
                last_parsed_start = start
                yield obj


def _clean_options(raw: Any) -> list[str] | None:
    """Normalise options to a list of strings, or None when not usable."""
    if not isinstance(raw, list):
        return None
    out: list[str] = []
    for o in raw:
        if isinstance(o, str):
            out.append(o)
        elif isinstance(o, dict) and isinstance(o.get("text"), str):
            out.append(o["text"])
        else:
            return None
    return out


def _option_correct_flag(raw: Any) -> int | None:
    if isinstance(raw, list):
        flagged = [i for i, o in enumerate(raw) if isinstance(o, dict) and o.get("isCorrect") is True]
        if len(flagged) == 1:
            return flagged[0]
    return None


def extract_questions(src: str) -> list[dict]:
    """Return normalised question dicts found in a TS source string.

    Keys: question, options (list[str]), answer (see below), explanation, difficulty,
    year, id, topic, export_name.  ``answer`` is a dict ``{"index": int}``,
    ``{"letter": "A"}``, ``{"text": str}`` or ``None`` when no answer field exists.
    """
    results: list[dict] = []
    export_names = [(m.start(), m.group(1)) for m in re.finditer(r"export\s+const\s+([A-Za-z_$][\w$]*)", src)]
    # Map object start offsets are not retained; use the first export as best-effort label.
    export_name = export_names[0][1] if export_names else None
    for obj in iter_question_objects(src):
        options = _clean_options(obj.get("options"))
        if options is None:
            continue
        answer: dict | None = None
        flagged = _option_correct_flag(obj.get("options"))
        if isinstance(obj.get("correctIndex"), int) and not isinstance(obj.get("correctIndex"), bool):
            answer = {"index": obj["correctIndex"]}
        else:
            for key in ("correctAnswer", "answer", "correct", "correctOption"):
                v = obj.get(key)
                if isinstance(v, bool) or v is None or v is UNKNOWN:
                    continue
                if isinstance(v, int):
                    answer = {"index": v}
                elif isinstance(v, str):
                    vs = v.strip()
                    if re.fullmatch(r"(?i)[a-d]", vs):
                        answer = {"letter": vs.upper(), "text": v}
                    else:
                        answer = {"text": v}
                break
        if answer is None and flagged is not None:
            answer = {"index": flagged}
        expl = obj.get("explanation")
        diff = obj.get("difficulty")
        year = obj.get("year")
        results.append(
            {
                "question": obj["question"],
                "options": options,
                "answer": answer,
                "explanation": expl if isinstance(expl, str) else "",
                "difficulty": diff if isinstance(diff, str) else None,
                "year": year if isinstance(year, int) and not isinstance(year, bool) else None,
                "id": obj.get("id") if isinstance(obj.get("id"), str) else None,
                "topic": obj.get("topic") if isinstance(obj.get("topic"), str) else None,
                "exam": obj.get("exam") if isinstance(obj.get("exam"), str) else None,
                "export_name": export_name,
            }
        )
    return results
