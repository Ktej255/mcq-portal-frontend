"""Request fields shared by the MCQ lab and checkpoint submissions.

A student's answer to one question is exactly one of:

* ``chosen_answer`` (alias ``selected_option``) — single-correct, e.g. "B";
* ``selected_options`` — multi-correct, e.g. ["A", "C"];
* ``numeric_answer`` — numerical, e.g. -2.5.

None of them = unanswered. ``chosen_answer`` is the original field name, so
existing clients keep working unchanged.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel

from app.core.gs_lms.scoring import Response


class AnswerFieldsIn(BaseModel):
    chosen_answer: Optional[str] = None
    selected_option: Optional[str] = None
    selected_options: Optional[List[str]] = None
    numeric_answer: Optional[float] = None

    def to_response(self) -> Response:
        return Response(
            option=self.chosen_answer if self.chosen_answer is not None else self.selected_option,
            options=self.selected_options,
            numeric=self.numeric_answer,
        )
