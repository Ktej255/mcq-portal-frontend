# Recharts Render Audit

Date: 2026-05-18

## Issue

Browser warning:

- Recharts chart container width/height reported invalid size.

## Root Cause

`ResponsiveContainer` mounted before stable layout dimensions were available on the report route.

## Dependency Chain

`reports/page.tsx` -> `BarChart` summary -> Recharts container sizing -> browser console warning.

`LongitudinalGrowth.tsx` -> growth charts -> Recharts container sizing -> potential same warning.

## Fix

Replaced `ResponsiveContainer` with measured chart frames using `ResizeObserver` and explicit chart width/height.

## Verification

- Desktop report probe: `events: []`
- Full journey attempt `39`: `events: []`
- Mobile report viewport `390x844`: report rendered.

## Remaining Risk

No Recharts warning reproduced locally after cleanup.
