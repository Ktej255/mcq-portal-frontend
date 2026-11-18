import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.domain import Question, Test, Topic, WorkflowStatusEnum
from .contracts import MCQStructure, MCQOption, UPSCQuestionType
from .forensics import MCQForensics
from app.core.observability.tracer import trace_execution


class _TransactionNeutralTraceSession:
    """Expose the caller session to tracing without allowing trace commits."""

    def __init__(self, db: Session):
        self._db = db

    def commit(self):
        # ExecutionTracer commits its own trace lifecycle updates. Flush those
        # updates into the caller-owned transaction instead of finalizing it.
        self._db.flush()

    def __getattr__(self, name):
        return getattr(self._db, name)


class MCQIngestionEngine:
    @staticmethod
    def detect_question_type(text: str) -> UPSCQuestionType:
        text_upper = text.upper()
        if "ASSERTION (A):" in text_upper and "REASON (R):" in text_upper:
            return UPSCQuestionType.ASSERTION_REASON
        if "CONSIDER THE FOLLOWING STATEMENTS" in text_upper:
            return UPSCQuestionType.MULTI_STATEMENT
        if "MATCH LIST I WITH LIST II" in text_upper:
            return UPSCQuestionType.MATCH_FOLLOWING
        if "CHRONOLOGICAL ORDER" in text_upper:
            return UPSCQuestionType.CHRONOLOGY
        if "WHICH OF THE PAIRS GIVEN ABOVE IS/ARE CORRECTLY MATCHED" in text_upper:
            return UPSCQuestionType.PAIR_MATCHING
        return UPSCQuestionType.STANDARD

    @staticmethod
    def ingest_batch(db: Session, test_id: int, questions: List[Dict[str, Any]]) -> List[Question]:
        trace_db = _TransactionNeutralTraceSession(db)
        with trace_execution(db=trace_db, module="pedagogy.ingestion", function="ingest_batch") as trace:
            trace.input_payload = {"test_id": test_id, "count": len(questions)}
            
            created_questions = []
            for raw_q in questions:
                # 0. Data Mapping (Compatibility Layer)
                if "options" not in raw_q and "options_en" in raw_q:
                    raw_q["options"] = [
                        {"id": k, "text_en": v} for k, v in raw_q["options_en"].items()
                    ]
                
                # Resolve subject and topic names if needed (assuming IDs are passed for now)
                raw_q.setdefault("subject", "UNSPECIFIED")
                raw_q.setdefault("topic", "UNSPECIFIED")
                raw_q.setdefault("batch", "INGESTION_V1")
                raw_q.setdefault("question_number", 0)

                # 1. Structural Validation (Compiler-First)
                # Auto-detect type if not provided
                if "question_type" not in raw_q or not raw_q["question_type"]:
                    raw_q["question_type"] = MCQIngestionEngine.detect_question_type(raw_q.get("text_en", ""))
                
                mcq = MCQStructure(**raw_q)
                
                # 2. UPSC-Aware Parsing (Implicitly handled by Pydantic model + custom logic)
                # We can add explicit pattern detection here if raw_q is unstructured text, 
                # but for now we assume structured JSON input as per "Strict Schema Enforcement"
                
                # 3. Content Forensics
                fingerprint = MCQForensics.generate_fingerprint(mcq)
                
                # 4. Safe Option Shuffling (Deterministic if needed, or verified)
                # For ingestion, we usually store the "Canonical" order first.
                
                db_obj = Question(
                    test_id=test_id,
                    topic_id=raw_q.get("topic_id"), # Assume resolved topic_id
                    text_en=mcq.text_en,
                    text_hi=mcq.text_hi,
                    options_en=[{"id": o.id, "text": o.text_en} for o in mcq.options],
                    options_hi=[{"id": o.id, "text": o.text_hi} for o in mcq.options] if mcq.text_hi else None,
                    correct_option=mcq.correct_option,
                    statements_en=mcq.statements_en,
                    statements_hi=mcq.statements_hi,
                    explanation_en=mcq.explanation_en,
                    explanation_hi=mcq.explanation_hi,
                    difficulty=mcq.difficulty,
                    question_number=mcq.question_number,
                    status=WorkflowStatusEnum(raw_q.get("status") or WorkflowStatusEnum.DRAFT),
                    quality_notes=raw_q.get("quality_notes"),
                    content_hash=fingerprint.content_hash,
                    structure_hash=fingerprint.structure_hash,
                    options_hash=fingerprint.options_hash,
                    integrity_metadata={
                        "integrity_hash": fingerprint.integrity_hash,
                        "question_type": mcq.question_type.value,
                        "statements_count": len(mcq.statements_en),
                        "ingested_at": datetime.now(timezone.utc).isoformat()
                    }
                )
                db.add(db_obj)
                created_questions.append(db_obj)
            
            # Flush for generated identifiers and constraint validation, but leave
            # transaction ownership to the caller (bulk CRUD/API boundary).
            db.flush()
            
            trace.output_payload = {"status": "success", "ingested_count": len(created_questions)}
            return created_questions

    @staticmethod
    def shuffle_options(question: Question, seed: int = None) -> Dict[str, Any]:
        """
        Deterministic reshuffling of options with answer remapping.
        Rules:
        - Statements NEVER mutate.
        - Correct answer remaps automatically.
        - Explanation alignment preserved.
        """
        if seed:
            random.seed(seed)
            
        options = list(question.options_en)
        original_correct_id = question.correct_option
        
        # Find the correct option text before shuffling
        correct_option_text = next(opt["text"] for opt in options if opt["id"] == original_correct_id)
        
        # Shuffle
        random.shuffle(options)
        
        # Remap IDs (A, B, C, D) based on new order
        new_options = []
        new_correct_id = None
        for i, opt in enumerate(options):
            new_id = chr(65 + i) # A, B, C, D
            if opt["text"] == correct_option_text:
                new_correct_id = new_id
            new_options.append({"id": new_id, "text": opt["text"], "original_id": opt["id"]})
            
        # Pre/Post Verification
        if not new_correct_id:
            raise ValueError("Correct option lost during shuffling - Critical Integrity Failure")
            
        return {
            "options": new_options,
            "correct_option": new_correct_id
        }
