# Static Asset Forensic Report

Date: 2026-05-18

## Issue

Browser console previously logged a static resource 404.

## Root Cause

The login route referenced an external texture:

- `https://grainy-gradients.vercel.app/noise.svg`

This made local staging dependent on an external static asset.

## Fix

- Added local asset: `frontend/public/noise.svg`
- Updated login page background to `/noise.svg`.

## Verification

Playwright route probe:

- `/login?token=MOCK_TOKEN`
- `/tests`
- `/reports?attemptId=33`

Result:

- `events: []`
- No 404 responses captured.

## Remaining Static Risk

No static 404 reproduced locally after the fix.
