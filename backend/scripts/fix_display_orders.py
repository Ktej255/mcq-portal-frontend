import json
import glob
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "..", "app", "core", "gs_lms", "data")
SEED_PATH = os.path.join(DATA_DIR, "gs_geography_syllabus.json")
LECTURES_DIR = os.path.join(HERE, "generated_lectures")

def normalize(t):
    return re.sub(r'[^a-z0-9]', '', t.lower())

def main():
    print("Building title to lecture mapping...")
    title_to_lec = {}
    for path in glob.glob(os.path.join(LECTURES_DIR, "lecture_*.json")):
        filename = os.path.basename(path)
        m = re.match(r"lecture_(\d+)\.json", filename)
        if m:
            lec_num = int(m.group(1))
            try:
                data = json.load(open(path, encoding="utf-8"))
                title = data.get("title", "")
                # Clean title prefix
                title_clean = re.sub(r"^\s*Lecture\s+\d+\s*[:\-–]\s*", "", title, flags=re.IGNORECASE).strip()
                title_to_lec[normalize(title_clean)] = lec_num
                title_to_lec[normalize(title)] = lec_num
            except Exception as e:
                print(f"Error loading {path}: {e}")

    # Add manual fallbacks for upgraded topics that might differ slightly
    fallbacks = {
        "structureandcompositionofatmosphere": 23,
        "structureandcompositionoftheatmosphere": 23,
        "karsttopographyandlimestonelandforms": 20,
        "weatheringphysicalchemicalandbiological": 19,
        "masswastingandlandslides": 17,
        "fluviallandformsandthecycleoferosion": 21,
    }
    for k, v in fallbacks.items():
        title_to_lec[k] = v

    print(f"Loaded {len(title_to_lec)} title mappings.")

    if not os.path.exists(SEED_PATH):
        print(f"Seed file not found: {SEED_PATH}")
        return

    seed = json.load(open(SEED_PATH, encoding="utf-8"))
    
    stats = {"updated": 0, "not_found": []}
    
    def process_node(node):
        if node.get("node_type") == "LEAF_TOPIC":
            title = node.get("title", "")
            norm = normalize(title)
            lec_num = title_to_lec.get(norm)
            if lec_num is not None:
                node["display_order"] = lec_num
                stats["updated"] += 1
            else:
                stats["not_found"].append(title)
        
        children = node.get("children") or []
        for child in children:
            process_node(child)

    for root in seed.get("tree", []):
        process_node(root)

    print(f"Updated {stats['updated']} leaf nodes.")
    if stats["not_found"]:
        print("WARNING: Lecture numbers not found for these titles:")
        for t in stats["not_found"]:
            print(f"  - {t}")

    with open(SEED_PATH, "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=2, ensure_ascii=False)
    print("Saved updated seed JSON.")

if __name__ == "__main__":
    main()
