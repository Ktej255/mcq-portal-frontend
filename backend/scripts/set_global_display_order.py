import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "..", "app", "core", "gs_lms", "data")
SEED_PATH = os.path.join(DATA_DIR, "gs_geography_syllabus.json")

def main():
    if not os.path.exists(SEED_PATH):
        print(f"Seed file not found: {SEED_PATH}")
        return

    seed = json.load(open(SEED_PATH, encoding="utf-8"))
    
    leaf_counter = 1
    
    def traverse_and_assign(node):
        nonlocal leaf_counter
        if node.get("node_type") == "LEAF_TOPIC":
            node["display_order"] = leaf_counter
            leaf_counter += 1
        
        # Sort children by their existing display_order and id to preserve hierarchy layout
        children = node.get("children") or []
        # Sort children to ensure deterministic traversal order
        children_sorted = sorted(
            children,
            key=lambda c: (c.get("display_order", 0), c.get("id", 0))
        )
        for child in children_sorted:
            traverse_and_assign(child)
            
    # Run the traversal starting from the root nodes
    root_nodes = seed.get("tree", [])
    root_nodes_sorted = sorted(
        root_nodes,
        key=lambda n: (n.get("display_order", 0), n.get("id", 0))
    )
    for root in root_nodes_sorted:
        traverse_and_assign(root)
        
    print(f"Assigned global display_orders from 1 to {leaf_counter - 1}.")
    
    with open(SEED_PATH, "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=2, ensure_ascii=False)
    print("Saved updated seed JSON with global display_orders.")

if __name__ == "__main__":
    main()
