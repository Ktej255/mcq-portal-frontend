# UPSC Command Route Matrix

Date: 2026-05-31

Generated from the current `src/app/**/page.tsx` tree. This matrix treats route existence as inventory only; browser verification is recorded separately.

## Summary

| Item | Count |
| --- | ---: |
| Concrete page routes | 98 |
| Public routes | 2 |
| Learner routes | 25 |
| Master-only routes | 71 |

## Area Counts

| Area | Count |
| --- | ---: |
| Admin redirect | 1 |
| Admin tool | 9 |
| Future subject scaffold | 49 |
| Isolated legacy | 5 |
| Learner UPSC | 19 |
| Learner workspace | 6 |
| Public entry | 2 |
| UPSC operator alias | 1 |
| UPSC operator tool | 6 |

## Route Inventory

| Route | Access | Area | Expected destination | Note |
| --- | --- | --- | --- | --- |
| `/` | public | Public entry | `/` | Marketing entry |
| `/admin` | master | Admin redirect | `/admin/dashboard` | Redirects to the operator console |
| `/admin/analytics` | master | Isolated legacy | `/admin/analytics` | Retained for internal inspection only |
| `/admin/dashboard` | master | Admin tool | `/admin/dashboard` | Protected operator surface |
| `/admin/feature-inventory` | master | Admin tool | `/admin/feature-inventory` | Protected operator surface |
| `/admin/founder` | master | Admin tool | `/admin/founder` | Protected operator surface |
| `/admin/integrity` | master | Admin tool | `/admin/integrity` | Protected operator surface |
| `/admin/launch-plan` | master | Admin tool | `/admin/launch-plan` | Protected operator surface |
| `/admin/observability` | master | Isolated legacy | `/admin/observability` | Retained for internal inspection only |
| `/admin/prelims-audit-v2` | master | Admin tool | `/admin/prelims-audit-v2` | Protected operator surface |
| `/admin/pyq-import` | master | Admin tool | `/admin/pyq-import` | Protected operator surface |
| `/admin/questions` | master | Admin tool | `/admin/questions` | Protected operator surface |
| `/admin/questions/bulk` | master | Admin tool | `/admin/questions/bulk` | Protected operator surface |
| `/admin/tests` | master | Isolated legacy | `/admin/tests` | Retained for internal inspection only |
| `/dashboard` | learner | Learner workspace | `/dashboard` | Student-visible after local profile setup |
| `/exam/demo` | master | Isolated legacy | `/exam/demo` | Retained for internal inspection only |
| `/history` | learner | Learner workspace | `/history` | Student-visible after local profile setup |
| `/login` | public | Public entry | `/login` | Local preview sign-in and student preview entry |
| `/reports` | learner | Learner workspace | `/reports` | Student-visible after local profile setup |
| `/revision` | learner | Learner workspace | `/revision` | Student-visible after local profile setup |
| `/settings` | learner | Learner workspace | `/settings` | Student-visible after local profile setup |
| `/simulation/lobby` | master | Isolated legacy | `/simulation/lobby` | Retained for internal inspection only |
| `/tests` | learner | Learner workspace | `/tests` | Student-visible after local profile setup |
| `/upsc` | learner | Learner UPSC | `/upsc` | Student-visible after local profile setup |
| `/upsc/content-command` | master | UPSC operator tool | `/upsc/content-command` | Protected internal UPSC surface |
| `/upsc/current-affairs` | learner | Learner UPSC | `/upsc/current-affairs` | Student-visible after local profile setup |
| `/upsc/daily-command` | learner | Learner UPSC | `/upsc/daily-command` | Student-visible after local profile setup |
| `/upsc/disaster-management` | master | Future subject scaffold | `/upsc/disaster-management` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/disaster-management/lab` | master | Future subject scaffold | `/upsc/disaster-management/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/disaster-management/mcq-readiness` | master | Future subject scaffold | `/upsc/disaster-management/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/disaster-management/revisit` | master | Future subject scaffold | `/upsc/disaster-management/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/disaster-management/talk` | master | Future subject scaffold | `/upsc/disaster-management/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/disaster-management/track` | master | Future subject scaffold | `/upsc/disaster-management/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/disaster-management/watch` | master | Future subject scaffold | `/upsc/disaster-management/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy` | master | Future subject scaffold | `/upsc/economy` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy/lab` | master | Future subject scaffold | `/upsc/economy/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy/mcq-readiness` | master | Future subject scaffold | `/upsc/economy/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy/revisit` | master | Future subject scaffold | `/upsc/economy/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy/talk` | master | Future subject scaffold | `/upsc/economy/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy/track` | master | Future subject scaffold | `/upsc/economy/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/economy/watch` | master | Future subject scaffold | `/upsc/economy/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment` | master | Future subject scaffold | `/upsc/environment` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment/lab` | master | Future subject scaffold | `/upsc/environment/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment/mcq-readiness` | master | Future subject scaffold | `/upsc/environment/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment/revisit` | master | Future subject scaffold | `/upsc/environment/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment/talk` | master | Future subject scaffold | `/upsc/environment/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment/track` | master | Future subject scaffold | `/upsc/environment/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/environment/watch` | master | Future subject scaffold | `/upsc/environment/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/geography` | learner | Learner UPSC | `/upsc/geography` | Student-visible after local profile setup |
| `/upsc/geography/animation-studio` | learner | Learner UPSC | `/upsc/geography/animation-studio` | Student-visible after local profile setup |
| `/upsc/geography/lab` | learner | Learner UPSC | `/upsc/geography/lab` | Student-visible after local profile setup |
| `/upsc/geography/mcq-readiness` | learner | Learner UPSC | `/upsc/geography/mcq-readiness` | Student-visible after local profile setup |
| `/upsc/geography/pilot` | learner | Learner UPSC | `/upsc/geography/pilot` | Student-visible after local profile setup |
| `/upsc/geography/revisit` | learner | Learner UPSC | `/upsc/geography/revisit` | Student-visible after local profile setup |
| `/upsc/geography/talk` | learner | Learner UPSC | `/upsc/geography/talk` | Student-visible after local profile setup |
| `/upsc/geography/testing` | master | UPSC operator tool | `/upsc/geography/testing` | Protected internal UPSC surface |
| `/upsc/geography/track` | learner | Learner UPSC | `/upsc/geography/track` | Student-visible after local profile setup |
| `/upsc/geography/watch` | learner | Learner UPSC | `/upsc/geography/watch` | Student-visible after local profile setup |
| `/upsc/history` | master | Future subject scaffold | `/upsc/history` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/history/lab` | master | Future subject scaffold | `/upsc/history/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/history/mcq-readiness` | master | Future subject scaffold | `/upsc/history/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/history/revisit` | master | Future subject scaffold | `/upsc/history/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/history/talk` | master | Future subject scaffold | `/upsc/history/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/history/track` | master | Future subject scaffold | `/upsc/history/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/history/watch` | master | Future subject scaffold | `/upsc/history/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society` | master | Future subject scaffold | `/upsc/internal-security-society` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society/lab` | master | Future subject scaffold | `/upsc/internal-security-society/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society/mcq-readiness` | master | Future subject scaffold | `/upsc/internal-security-society/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society/revisit` | master | Future subject scaffold | `/upsc/internal-security-society/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society/talk` | master | Future subject scaffold | `/upsc/internal-security-society/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society/track` | master | Future subject scaffold | `/upsc/internal-security-society/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/internal-security-society/watch` | master | Future subject scaffold | `/upsc/internal-security-society/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/mcq-command` | master | UPSC operator tool | `/upsc/mcq-command` | Protected internal UPSC surface |
| `/upsc/optional-subjects` | learner | Learner UPSC | `/upsc/optional-subjects` | Student-visible after local profile setup |
| `/upsc/optional-subjects/agriculture` | learner | Learner UPSC | `/upsc/optional-subjects/agriculture` | Student-visible after local profile setup |
| `/upsc/polity-governance` | master | Future subject scaffold | `/upsc/polity-governance` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/polity-governance/lab` | master | Future subject scaffold | `/upsc/polity-governance/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/polity-governance/mcq-readiness` | master | Future subject scaffold | `/upsc/polity-governance/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/polity-governance/revisit` | master | Future subject scaffold | `/upsc/polity-governance/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/polity-governance/talk` | master | Future subject scaffold | `/upsc/polity-governance/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/polity-governance/track` | master | Future subject scaffold | `/upsc/polity-governance/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/polity-governance/watch` | master | Future subject scaffold | `/upsc/polity-governance/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/prelims-2026-audit` | master | UPSC operator tool | `/upsc/prelims-2026-audit` | Protected internal UPSC surface |
| `/upsc/prelims-2026-audit-v2` | master | UPSC operator alias | `/admin/prelims-audit-v2` | Redirects to the protected V2 corpus audit |
| `/upsc/pricing` | learner | Learner UPSC | `/upsc/pricing` | Student-visible after local profile setup |
| `/upsc/pricing/checkout` | learner | Learner UPSC | `/upsc/pricing/checkout` | Student-visible after local profile setup |
| `/upsc/question-bank` | learner | Learner UPSC | `/upsc/question-bank` | Student-visible after local profile setup |
| `/upsc/readiness-audit` | master | UPSC operator tool | `/upsc/readiness-audit` | Protected internal UPSC surface |
| `/upsc/revision-command` | master | UPSC operator tool | `/upsc/revision-command` | Protected internal UPSC surface |
| `/upsc/science-tech` | master | Future subject scaffold | `/upsc/science-tech` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/science-tech/lab` | master | Future subject scaffold | `/upsc/science-tech/lab` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/science-tech/mcq-readiness` | master | Future subject scaffold | `/upsc/science-tech/mcq-readiness` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/science-tech/revisit` | master | Future subject scaffold | `/upsc/science-tech/revisit` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/science-tech/talk` | master | Future subject scaffold | `/upsc/science-tech/talk` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/science-tech/track` | master | Future subject scaffold | `/upsc/science-tech/track` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/science-tech/watch` | master | Future subject scaffold | `/upsc/science-tech/watch` | Master-inspection scaffold until the Geography learner pilot closes |
| `/upsc/source-library` | learner | Learner UPSC | `/upsc/source-library` | Student-visible after local profile setup |
| `/upsc/yearly-planner` | learner | Learner UPSC | `/upsc/yearly-planner` | Student-visible after local profile setup |
