# Eduecosystem import report

Generated: 2026-10-22T10:39:57+00:00  
Generator: `backend/scripts/eduecosystem_import/convert.py`

## Summary

| Subject | Input rows | Unique | Dropped | Kept | PYQs | Unverified answers | Output files |
|---|---:|---:|---:|---:|---:|---:|---|
| art-culture | 20 | 10 | 0 | 10 | 0 | 0 | art-culture.json (0.01 MB) |
| csat | 40 | 20 | 0 | 20 | 0 | 0 | csat.json (0.02 MB) |
| economy | 1185 | 466 | 143 | 323 | 101 | 101 | economy.json (0.27 MB) |
| environment | 660 | 236 | 0 | 236 | 185 | 0 | environment.json (0.21 MB) |
| geography | 2994 | 1434 | 705 | 729 | 123 | 0 | geography.json (0.67 MB) |
| history | 34797 | 11431 | 984 | 10447 | 89 | 0 | history-part1.json (4.16 MB), history-part2.json (4.02 MB) |
| international-relations | 170 | 60 | 0 | 60 | 50 | 0 | international-relations.json (0.05 MB) |
| polity-governance | 12748 | 4039 | 7 | 4032 | 179 | 0 | polity-governance.json (3.26 MB) |
| science-tech | 537 | 196 | 0 | 196 | 145 | 0 | science-tech.json (0.17 MB) |
| **total** | 53151 | 17892 | 1839 | 16053 | 872 | 101 | |

Unique = distinct normalised question texts within the subject (duplicates across banks are merged). Dropped counts are over unique questions. Answer distributions cover kept questions with a known answer.

## art-culture

- Input rows: 20; duplicates merged: 10; unique: 10
- Kept: 10 (PYQs: 0; unverified answers: 0; answers recovered from TS data: 0)
- Dropped by reason: none
- Explanation quality: ok 10, short 0, missing 0
- Answer position before rebalancing: A 0 (0%) / B 8 (80%) / C 2 (20%) / D 0 (0%)
- Answer position after rebalancing:  A 3 (30%) / B 2 (20%) / C 4 (40%) / D 1 (10%)
- Left in original order (order-dependent options): 1
- Question types: FACTUAL 10

## csat

- Input rows: 40; duplicates merged: 20; unique: 20
- Kept: 20 (PYQs: 0; unverified answers: 0; answers recovered from TS data: 0)
- Dropped by reason: none
- Explanation quality: ok 20, short 0, missing 0
- Answer position before rebalancing: A 4 (20%) / B 12 (60%) / C 4 (20%) / D 0 (0%)
- Answer position after rebalancing:  A 3 (15%) / B 8 (40%) / C 6 (30%) / D 3 (15%)
- Left in original order (order-dependent options): 4
- Question types: FACTUAL 16, STATEMENT_BASED 2, CAUSE_EFFECT 2

## economy

- Input rows: 1185; duplicates merged: 719; unique: 466
- Kept: 323 (PYQs: 101; unverified answers: 101; answers recovered from TS data: 0)
- Dropped by reason: broken_statement_stem 143
- Explanation quality: ok 218, short 4, missing 101
- Answer position before rebalancing: A 187 (84%) / B 15 (7%) / C 17 (8%) / D 3 (1%)
- Answer position after rebalancing:  A 103 (46%) / B 35 (16%) / C 43 (19%) / D 41 (18%)
- Left in original order (order-dependent options): 76
- Question types: FACTUAL 243, STATEMENT_BASED 62, ASSERTION_REASON 9, CAUSE_EFFECT 6, MATCH_THE_FOLLOWING 2, CHRONOLOGICAL 1

## environment

- Input rows: 660; duplicates merged: 424; unique: 236
- Kept: 236 (PYQs: 185; unverified answers: 0; answers recovered from TS data: 0)
- Dropped by reason: none
- Explanation quality: ok 191, short 44, missing 1
- Answer position before rebalancing: A 54 (23%) / B 75 (32%) / C 64 (27%) / D 43 (18%)
- Answer position after rebalancing:  A 46 (19%) / B 53 (22%) / C 79 (33%) / D 58 (25%)
- Left in original order (order-dependent options): 135
- Question types: FACTUAL 117, STATEMENT_BASED 103, ASSERTION_REASON 5, MATCH_THE_FOLLOWING 5, CAUSE_EFFECT 3, CHRONOLOGICAL 2, MAP_BASED 1

## geography

- Input rows: 2994; duplicates merged: 1560; unique: 1434
- Kept: 729 (PYQs: 123; unverified answers: 0; answers recovered from TS data: 0)
- Dropped by reason: placeholder 593, broken_statement_stem 111, no_answer 1
- Explanation quality: ok 707, short 22, missing 0
- Answer position before rebalancing: A 134 (18%) / B 292 (40%) / C 226 (31%) / D 77 (11%)
- Answer position after rebalancing:  A 205 (28%) / B 175 (24%) / C 185 (25%) / D 164 (22%)
- Left in original order (order-dependent options): 280
- Question types: FACTUAL 448, STATEMENT_BASED 164, ASSERTION_REASON 45, MATCH_THE_FOLLOWING 38, CAUSE_EFFECT 20, MAP_BASED 9, CHRONOLOGICAL 5

## history

- Input rows: 34797; duplicates merged: 23366; unique: 11431
- Kept: 10447 (PYQs: 89; unverified answers: 0; answers recovered from TS data: 1694)
- Dropped by reason: broken_statement_stem 820, parse_dump 143, no_answer 16, options_count_not_4 3, duplicate_options 2
- Explanation quality: ok 4301, short 2628, missing 3518
- Answer position before rebalancing: A 2970 (28%) / B 5709 (55%) / C 1411 (14%) / D 357 (3%)
- Answer position after rebalancing:  A 3250 (31%) / B 2620 (25%) / C 2329 (22%) / D 2248 (22%)
- Left in original order (order-dependent options): 2519
- Question types: FACTUAL 7999, ASSERTION_REASON 860, STATEMENT_BASED 677, CAUSE_EFFECT 478, MATCH_THE_FOLLOWING 299, MAP_BASED 84, CHRONOLOGICAL 50

## international-relations

- Input rows: 170; duplicates merged: 110; unique: 60
- Kept: 60 (PYQs: 50; unverified answers: 0; answers recovered from TS data: 0)
- Dropped by reason: none
- Explanation quality: ok 46, short 14, missing 0
- Answer position before rebalancing: A 19 (32%) / B 14 (23%) / C 13 (22%) / D 14 (23%)
- Answer position after rebalancing:  A 14 (23%) / B 12 (20%) / C 17 (28%) / D 17 (28%)
- Left in original order (order-dependent options): 33
- Question types: FACTUAL 28, STATEMENT_BASED 21, MATCH_THE_FOLLOWING 8, ASSERTION_REASON 3

## polity-governance

- Input rows: 12748; duplicates merged: 8709; unique: 4039
- Kept: 4032 (PYQs: 179; unverified answers: 0; answers recovered from TS data: 357)
- Dropped by reason: options_count_not_4 4, duplicate_options 2, broken_statement_stem 1
- Explanation quality: ok 3079, short 755, missing 198
- Answer position before rebalancing: A 604 (15%) / B 1882 (47%) / C 999 (25%) / D 547 (14%)
- Answer position after rebalancing:  A 977 (24%) / B 1027 (25%) / C 940 (23%) / D 1088 (27%)
- Left in original order (order-dependent options): 1207
- Question types: FACTUAL 3260, STATEMENT_BASED 638, ASSERTION_REASON 49, CAUSE_EFFECT 46, MATCH_THE_FOLLOWING 27, MAP_BASED 8, CHRONOLOGICAL 4

## science-tech

- Input rows: 537; duplicates merged: 341; unique: 196
- Kept: 196 (PYQs: 145; unverified answers: 0; answers recovered from TS data: 0)
- Dropped by reason: none
- Explanation quality: ok 148, short 47, missing 1
- Answer position before rebalancing: A 29 (15%) / B 71 (36%) / C 45 (23%) / D 51 (26%)
- Answer position after rebalancing:  A 41 (21%) / B 34 (17%) / C 55 (28%) / D 66 (34%)
- Left in original order (order-dependent options): 97
- Question types: FACTUAL 102, STATEMENT_BASED 85, MATCH_THE_FOLLOWING 5, CAUSE_EFFECT 2, MAP_BASED 1, ASSERTION_REASON 1

