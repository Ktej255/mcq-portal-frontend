"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useApiConfig } from "@/lib/hooks/useApi";
import { optionalService, type SubjectConfigOut } from "@/services/api/optionalService";

/**
 * Per-subject framework primitives (spec task 15 — R11 / R19).
 *
 * The platform serves a DB-backed `SubjectConfig` per subject (papers/sections
 * shape + enabled feature modules). These helpers let the UI mount
 * subject-specific features purely by that config, so adding a subject in
 * Phase 2 is *content + config*, not new code (design "Per-subject framework").
 *
 * - {@link useSubjectFeatures} fetches the subject's config and exposes a
 *   feature-flag checker, with a graceful fallback set used while loading or if
 *   the fetch fails (so a subject never loses an already-shipping affordance).
 * - {@link SubjectFeatureSlot} renders its children only when a named feature
 *   module is enabled for the subject.
 */

export interface SubjectFeatures {
  /** Enabled feature-module keys for the subject (from the backend config). */
  features: Set<string>;
  /** True once the backend config has loaded (false while loading / on error). */
  loaded: boolean;
  /** True when a feature module is enabled for the subject. */
  has: (feature: string) => boolean;
  /** The raw config, when loaded. */
  config: SubjectConfigOut | null;
}

/**
 * Fetch a subject's enabled feature modules (R11.2). While the config loads (or
 * if it fails / the subject has no DB config), `fallback` is used so a subject
 * keeps any affordance it shipped with rather than flickering it off.
 */
export function useSubjectFeatures(
  slug: string,
  fallback: readonly string[] = [],
): SubjectFeatures {
  const { isLoaded, isSignedIn } = useApiConfig();
  const [config, setConfig] = useState<SubjectConfigOut | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    optionalService
      .getSubjectConfig(slug)
      .then((cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Graceful: keep fallback features, never crash the shell.
        setConfig(null);
        setLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoaded, isSignedIn]);

  const features = new Set<string>(
    config ? config.features : (fallback as string[]),
  );

  return {
    features,
    loaded,
    has: (feature: string) => features.has(feature),
    config,
  };
}

/**
 * Render `children` only when `feature` is enabled for the subject (R11.2).
 * A config-driven mount point for subject-specific features.
 */
export function SubjectFeatureSlot({
  feature,
  features,
  children,
  fallback = null,
}: {
  feature: string;
  features: SubjectFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{features.has(feature) ? children : fallback}</>;
}

export default SubjectFeatureSlot;
