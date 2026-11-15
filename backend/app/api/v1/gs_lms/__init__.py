# GS LMS Platform - API router package
#
# Aggregates all GS LMS sub-routers (syllabus, content, PYQ, practice,
# discussion, progress, planner, PDF, onboarding, video) under a single
# APIRouter that is mounted at /api/v1/gs-lms in app.main. Every route in
# this package is auth-gated and, when GS_LMS_ENFORCE_ACCESS is enabled,
# cohort-access-gated for the private beta.
#
# Multi-subject routing (Requirement 9.1, 9.2): all subject-specific routes
# are mounted under /{subject_slug}/ prefix. The subject_slug path parameter
# is resolved by the resolve_subject dependency in each endpoint.
#
# Hard isolation constraint (design Key Decision 3 / Requirement 10.4): this
# package MUST NOT import from, reference, or modify Optional Subjects
# (app.core.optional / app.api.v1.optional) modules or routes.

from fastapi import APIRouter, Depends

from app.api.v1.gs_lms.access import require_gs_lms_access
from app.api.v1.gs_lms import syllabus
from app.api.v1.gs_lms import content
from app.api.v1.gs_lms import pyqs
from app.api.v1.gs_lms import practice
from app.api.v1.gs_lms import discussion
from app.api.v1.gs_lms import progress
from app.api.v1.gs_lms import readiness
from app.api.v1.gs_lms import planner
from app.api.v1.gs_lms import pdf
from app.api.v1.gs_lms import onboarding
from app.api.v1.gs_lms import video
from app.api.v1.gs_lms import revisit
from app.api.v1.gs_lms import recall_gate
from app.api.v1.gs_lms import retro
from app.api.v1.gs_lms import answers
# Interactive Learning Funnel routers
from app.api.v1.gs_lms import funnel
from app.api.v1.gs_lms import recall
from app.api.v1.gs_lms import mcq_lab
from app.api.v1.gs_lms import mains
from app.api.v1.gs_lms import growth
from app.api.v1.gs_lms import subjects

# All GS LMS routes require authentication AND cohort access. Declaring the
# dependencies at the aggregate level enforces them uniformly across every
# sub-router (Requirement 10.2 / design Property 23). `require_gs_lms_access`
# depends on `get_current_user`, so unauthenticated calls still receive 401.
# When `GS_LMS_ENFORCE_ACCESS` is disabled (local/dev default), authenticated
# users pass without a cohort grant.
router = APIRouter(dependencies=[Depends(require_gs_lms_access)])

# Not subject-specific: lists the subjects and whether students can open them.
router.include_router(subjects.router, tags=["gs-lms"])

# Subject-specific routes are mounted under /{subject_slug}/ prefix.
# The subject_slug is a path parameter resolved in each endpoint via the
# resolve_subject dependency (e.g., "geography" -> GsSubject record).
router.include_router(syllabus.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(content.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(pyqs.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(practice.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(discussion.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(progress.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(readiness.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(planner.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(pdf.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(onboarding.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(video.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(revisit.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(recall_gate.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(retro.router, prefix="/{subject_slug}", tags=["gs-lms"])
router.include_router(answers.router, prefix="/{subject_slug}", tags=["gs-lms"])
# Interactive Learning Funnel sub-routers
router.include_router(funnel.router, prefix="/{subject_slug}", tags=["gs-lms-funnel"])
router.include_router(recall.router, prefix="/{subject_slug}", tags=["gs-lms-funnel"])
router.include_router(mcq_lab.router, prefix="/{subject_slug}", tags=["gs-lms-funnel"])
router.include_router(mains.router, prefix="/{subject_slug}", tags=["gs-lms-funnel"])
router.include_router(growth.router, prefix="/{subject_slug}", tags=["gs-lms-funnel"])
