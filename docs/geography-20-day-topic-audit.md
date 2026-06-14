# Geography 20-Day Topic Audit

Date: 2026-06-11

Source checked:
- `D:\Graphology\Upsc 2027\June - Geography 2026\1. Geography topics.pdf`
- `D:\Graphology\Upsc 2027\June - Geography 2026\Universe_Cluster1_SaritClasses.pdf`

## Coverage Result

- The Geography topics PDF extracts to exactly 82 numbered topic groups.
- All 82 groups are now mapped into the student-facing 20-day Geography plan through `src/lib/upsc/geographyTopicCoverage.ts`.
- Day 1 is an added foundation day for geographic thinking and map relationships.
- Days 18-20 are integration, weak-area repair, PYQ/mock practice, and final command days, so they do not introduce new PDF topic groups.
- All 20 student-facing days now have a primary slide-style web module. Day 1 and Days 18-20 use integration/foundation modules with empty `topicIds` so the 82-topic PDF audit remains clean.

## Day Mapping

- Day 2: Topic 1.
- Day 3: Topics 2-4.
- Day 4: Topics 5-12.
- Day 5: Topics 13-18.
- Day 6: Topics 19-21 and 24-29.
- Day 7: Topics 22-23 and 30.
- Day 8: Topics 31-37.
- Day 9: Topics 38-45.
- Day 10: Topics 46-49.
- Day 11: Topics 50-55.
- Day 12: Topics 56-62.
- Day 13: Topics 63-66.
- Day 14: Topics 67-71.
- Day 15: Topics 72-75.
- Day 16: Topics 76-78.
- Day 17: Topics 79-82.

## Main Gaps

- Topic coverage is mapped, but most topics are still covered by day-level plan text and legacy Watch scenes rather than final PDF-style web modules.
- Topic 1 has a pilot slide-style module through `universe-cluster-1`.
- Topics 13-18 now have a Day 5 draft slide-style module through `climatology-basics-day5`.
- Topics 5-12 now have a Day 4 draft slide-style module through `landforms-cluster-day4`.
- Topics 19-21 and 24-29 now have a Day 6 draft slide-style module through `weather-ocean-systems-day6`.
- Topics 31-37 now have a Day 8 draft slide-style module through `indian-physiography-day8`.
- Topics 38-45 now have a Day 9 draft slide-style module through `drainage-lakes-wetlands-day9`.
- Topics 46-49 now have a Day 10 draft slide-style module through `soils-forests-day10`.
- Topics 50-55 now have a Day 11 draft slide-style module through `agriculture-food-security-day11`.
- Topics 56-62 now have a Day 12 draft slide-style module through `minerals-energy-industry-day12`.
- Topics 63-66 now have a Day 13 draft slide-style module through `transport-communications-day13`.
- Topics 67-71 now have a Day 14 draft slide-style module through `world-geography-day14`.
- Topics 72-75 now have a Day 15 draft slide-style module through `human-geography-day15`.
- Topics 76-78 now have a Day 16 draft slide-style module through `political-geography-day16`.
- Topics 79-82 now have a Day 17 draft slide-style module through `current-geography-day17`.
- Topics 2-4 now have a Day 3 draft slide-style module through `earth-interior-tectonics-day3`.
- Topics 22-23 and 30 now have a Day 7 draft slide-style module through `monsoon-maritime-day7`.
- All 82 topic groups now have at least pilot/draft slide-module coverage. Final approval still requires content review, image metadata, traps, PYQs, MCQs, and teacher acceptance for each module.
- Day 1 now has a foundation module through `geographic-thinking-day1`.
- Day 18 now has an integration module through `integrated-map-recall-day18`.
- Day 19 now has a weak-area/PYQ mock module through `weak-area-pyq-mock-day19`.
- Day 20 now has a command-day module through `geography-command-day20`.
- All 20 student-facing days now have at least pilot/draft slide-module coverage, so the learner no longer switches between module days and legacy-only days.
- Content-quality readiness is now computed separately from structural coverage: approval status, image metadata, PYQ sections, MCQ sections, and expected-recall-point completeness are exposed in the completion audit.
- Each active day module now also exposes a five-check readiness card inside the command room: teacher approval, licensed media, PYQ pattern, MCQ repair, and recall points. This makes the next content-production action visible without opening the source file.
- The optional command-room controls now include a global content production queue for all 20 modules, sorted by day, with readiness score and missing approval/media/PYQ/MCQ/recall checks.
- Current content-quality gaps remain: modules are still draft/sample rather than teacher-approved, media metadata is sparse, and explicit module-level PYQ/MCQ enrichment is not yet present across all modules.
- 11 topic groups are intentionally compressed inside broader days; all 11 now have at least draft-module visibility in the topic finder and active-day audit.
- The speech path exists through browser live speech and audio-note fallback. Full automatic server transcription still depends on configuring a provider behind `/api/upsc/teacher/transcribe`.

## Built Features Confirmed

- Student profile funnel is present: beginner starts Watch-first, intermediate/advanced start Talk-first.
- Geography is student-facing Day 1 to Day 20.
- Day 2+ starts with previous-day recall before new content opens.
- Universe module reads like slides and requires cumulative section recall.
- Day 5 climatology basics now has a draft slide module covering atmosphere structure, insolation, heat budget, temperature distribution, pressure belts, winds, jet streams, and local winds.
- Day 4 landforms now has a draft slide module covering volcanoes, rocks, geomorphic process discipline, fluvial, glacial, aeolian, coastal, and karst systems.
- Day 6 weather/ocean systems now has a draft slide module covering humidity, precipitation, fronts, cyclones, climate classification, ocean-floor relief, salinity, temperature, currents, and tides.
- Day 8 India physiography now has a draft slide module covering Himalayas, Himalayan passes, northern plains, peninsular plateau, coastal plains, and islands.
- Day 9 drainage now has a draft slide module covering drainage patterns, Indus, Ganga, Brahmaputra, peninsular rivers, lakes, wetlands, and Ramsar sites.
- Day 10 soils/forests now has a draft slide module covering soil types, soil degradation, forest types, forest cover, and forest policy.
- Day 11 agriculture now has a draft slide module covering cropping seasons, crop-state mapping, agricultural revolutions, irrigation, food security, policy, and farm issues.
- Day 12 minerals/industry now has a draft slide module covering ferrous, non-ferrous, critical minerals, energy resources, iron and steel, textiles, and industrial corridors.
- Day 13 transport now has a draft slide module covering ports, maritime trade, roads, railways, freight corridors, inland waterways, logistics, and communications.
- Day 14 world geography now has a draft slide module covering world physiography, rivers, lakes, straits/channels, and biomes.
- Day 15 human geography now has a draft slide module covering population geography, migration, urban geography, cultural geography, current-affairs bridges, and term traps.
- Day 16 political geography now has a draft slide module covering India's borders, Northeast India, tribal geography, identity, terrain, security, development, and map-pair traps.
- Day 17 current geography now has a draft slide module covering geopolitical geography in news, infrastructure geography, climate change geography, disaster geography, static-current bridge, and news trap logic.
- Day 3 Earth interior now has a draft slide module covering indirect evidence, layers, seismic waves, shadow zones, earthquakes, plate boundaries, Indian Plate collision, and Himalaya formation.
- Day 7 monsoon/maritime now has a draft slide module covering Indian monsoon mechanism, ENSO-IOD-MJO, regional impacts, maritime zones, EEZ, continental shelf, blue economy, and legal traps.
- Day 1 foundation now has a draft slide module covering what-where-why, absolute/relative location, site-situation-scale, India map relationships, and foundation traps.
- Day 18 integration now has a draft slide module covering physical-to-India chains, world-human-current chains, weak-link diagnosis, and integrated traps.
- Day 19 repair now has a draft slide module covering evidence-based weak-area repair, root-cause classification, PYQ pattern reading, mixed mock strategy, and final repair handoff.
- Day 20 command now has a draft slide module covering full-syllabus spoken recall, map confidence audit, PYQ trap lock, revision lock, and next-subject handoff.
- Talk stores known concepts and missing concepts from recall evidence.
- Reports show baseline known, gap filled, and remaining gap.
- The command page now shows a folded coverage audit for the active day.
- The command page now has an 82-topic finder so a topic can be mapped back to its day without remembering the plan.
- Watch, Talk, MCQ, Revisit, and Track now share a common room compass with the same day context, Command link, primary action, and simple navigation rule.
- Optional Visual Lab now shares the same room compass, so the learner can always return to Command or continue to MCQ without remembering the route graph.
- `/upsc/geography/continue` now reads local progress and sends the learner to the next correct Geography room automatically.
- The command page now includes a folded completion audit showing complete, partial, and missing feature areas.
- The completion audit now separates structural readiness from final content readiness: topic/day module coverage, teacher approval, media metadata, PYQ sections, MCQ sections, and recall-point completeness.
- The active module panel now shows per-module readiness score, completed checks, missing checks, and the exact status for approval, media, PYQ, MCQ, and recall-point coverage.
- The command page now has a single all-module production queue, so teacher review no longer requires manually opening all 20 days to discover what is incomplete.

## UX Direction

- Keep the top command-page action as the only primary student action.
- Use `/upsc/geography/continue` as the safest global "resume Geography" link.
- Keep detailed route controls folded.
- Use the 82-topic finder for teacher/operator lookup, not as a second learning path.
- Keep the shared room compass on every Geography room so the student never has to remember the route graph.
- Keep pilot, testing, and production-check as operator/specialist surfaces, not daily learner navigation.
- Next content work should move from draft coverage to approval: replace sample text with final teacher-approved content, attach licensed image metadata to every module, and add richer PYQ/MCQ banks.
- Use the computed readiness counters as the content-production queue: approve modules only after teacher review, at least one licensed visual per module, module-specific PYQ pattern cards, and module-specific MCQ repair drills.
