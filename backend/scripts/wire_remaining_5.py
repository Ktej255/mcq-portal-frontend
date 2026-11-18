#!/usr/bin/env python3
import json
import os

HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, "..", "backend", "app", "core", "gs_lms", "data")
if not os.path.exists(DATA):
    DATA = os.path.join(HERE, "..", "app", "core", "gs_lms", "data")
SEED = os.path.join(DATA, "gs_geography_syllabus.json")
UPGRADED_DIR = os.path.join(DATA, "upgraded_topics")

LEAF_FIELDS = (
    "title", "node_type", "weight", "content_sections", "pyqs",
    "mcq_questions", "concept_checklist", "ordering_justification", "video_url",
)

def make_leaf(path, order):
    up = json.load(open(path, encoding="utf-8"))
    leaf = {"display_order": order}
    for f in LEAF_FIELDS:
        if f in up:
            leaf[f] = up[f]
    leaf["node_type"] = "LEAF_TOPIC"
    leaf["review_status"] = "REVIEWED"
    return leaf


def append_leaf_if_missing(children, path):
    """Append a leaf once, matching existing children by their stable title."""
    up = json.load(open(path, encoding="utf-8"))
    title = up["title"]
    if any(child.get("title") == title for child in children):
        print(f"Skipped existing child: {title}")
        return False

    # Preserve the existing sibling-order behavior for genuinely new leaves.
    children.append(make_leaf(path, len(children) + 1))
    return True


def main():
    print(f"Reading seed: {SEED}")
    seed = json.load(open(SEED, encoding="utf-8"))
    
    geo = next(n for n in seed["tree"] if n.get("title") == "Geomorphology")
    subs = geo.setdefault("children", [])
    
    # 1. Wire under "Landforms"
    landforms_sub = next((s for s in subs if s.get("title") == "Landforms"), None)
    if landforms_sub:
        lf_children = landforms_sub.setdefault("children", [])
        # Add the reviewed canonical Topic 24 candidate only. The alternate
        # candidate is preserved in the quarantine directory for content-owner
        # review and must not be reintroduced by this maintenance script.
        for filename in (
            "23_glacial_landforms.json",
            "24_aeolian_desert_landforms.json",
            "25_coastal_landforms.json",
        ):
            append_leaf_if_missing(lf_children, os.path.join(UPGRADED_DIR, filename))
        print("Wired 23, canonical 24, and 25 into 'Landforms' subtopic.")
        
    # 2. Wire 26 (Isostasy) under "Geomorphic Processes"
    geomorphic_sub = next((s for s in subs if s.get("title") == "Geomorphic Processes"), None)
    if geomorphic_sub:
        gp_children = geomorphic_sub.setdefault("children", [])
        append_leaf_if_missing(
            gp_children, os.path.join(UPGRADED_DIR, "26_isostasy.json")
        )
        print("Wired 26 (Isostasy) into 'Geomorphic Processes' subtopic.")
        
    # Save the updated syllabus
    json.dump(seed, open(SEED, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Syllabus wiring complete.")

if __name__ == "__main__":
    main()
