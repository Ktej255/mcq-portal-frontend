import os
import sys
import stat

def install_hook():
    hook_path = ".git/hooks/pre-commit"
    
    if not os.path.exists(".git"):
        print("Error: .git directory not found. Are you in the repository root?")
        return

    hook_content = """#!/bin/bash
# Institutional Governance Pre-Commit Hook

echo "--- [GOVERNANCE] Initiating Mandatory Pre-Commit Audit ---"

# 1. Mutation Diff Analysis
git diff --cached | python backend/scripts/governance/mutation_diff_analyzer.py
if [ $? -ne 0 ]; then
    echo "[BLOCK] Mutation Audit Failed. Commit aborted."
    exit 1
fi

# 2. Auto Governance (Locks & Graphify)
# We pass the list of staged files to auto_governance
STAGED_FILES=$(git diff --cached --name-only)
python backend/scripts/governance/auto_governance.py $STAGED_FILES
if [ $? -ne 0 ]; then
    echo "[BLOCK] Auto-Governance Enforcement Failed. Commit aborted."
    exit 1
fi

# 3. Release Check (Only if protected files are modified)
PROTECTED_MODIFIED=$(echo "$STAGED_FILES" | grep -E "scoring_engine.py|report_service.py|domain.py|reliability_engine.py")
if [ ! -z "$PROTECTED_MODIFIED" ]; then
    echo "[CRITICAL] Protected files modified. Running full release check..."
    python institutional_release_check.py
    if [ $? -ne 0 ]; then
        echo "[BLOCK] Institutional Release Check Failed. Commit aborted."
        exit 1
    fi
fi

echo "[SUCCESS] All governance gates passed. Proceeding with commit."
exit 0
"""

    try:
        with open(hook_path, "w") as f:
            f.write(hook_content)
        
        # Make executable
        st = os.stat(hook_path)
        os.chmod(hook_path, st.st_mode | stat.S_IEXEC)
        
        print(f"Institutional Pre-Commit Hook installed at: {hook_path}")
    except Exception as e:
        print(f"Failed to install hook: {e}")

if __name__ == "__main__":
    install_hook()
