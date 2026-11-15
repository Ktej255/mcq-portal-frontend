import subprocess
import sys
import os
import time

def run_command(command, description, cwd=None):
    print(f"\n--- [RELEASE CHECK] {description} ---")
    start_time = time.time()
    env = os.environ.copy()
    root = os.getcwd()
    backend = os.path.join(root, "backend")
    env["PYTHONPATH"] = root + os.pathsep + backend
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, env=env, cwd=cwd)
        duration = time.time() - start_time
        if result.returncode == 0:
            print(f"[PASSED] ({duration:.2f}s)")
            return True, result.stdout
        else:
            print(f"[FAILED] ({duration:.2f}s)")
            if result.stderr:
                print(f"Error: {result.stderr}")
            if result.stdout:
                print(f"Output: {result.stdout}")
            return False, result.stderr or result.stdout
    except Exception as e:
        print(f"[ERROR] Execution failed: {e}")
        return False, str(e)

def main():
    print("====================================================")
    print("      INSTITUTIONAL RELEASE VERIFICATION (PHASE 1)    ")
    print("====================================================")
    
    all_passed = True
    results = []

    # 1. Graphify Audit
    passed, out = run_command(
        "python backend/scripts/governance/graphify_audit.py backend/app/services/scoring_engine.py backend/app/services/report_service.py",
        "Architecture & Dependency Audit"
    )
    results.append(("Graphify Audit", passed))
    if not passed: all_passed = False

    # 2. Runtime Flow Verification
    passed, out = run_command(
        "python backend/scripts/governance/runtime_flow_verifier.py",
        "Runtime Interaction Tracing"
    )
    results.append(("Runtime Flow", passed))
    if not passed: all_passed = False

    # 3. Educational Truth
    passed, out = run_command(
        "python backend/tests/educational_truth.py",
        "Mathematical & Pedagogical Invariants"
    )
    results.append(("Educational Truth", passed))
    if not passed: all_passed = False

    # 4. Schema Integrity
    passed, out = run_command(
        "python backend/tests/operational/test_schema_integrity.py",
        "API Contract Integrity"
    )
    results.append(("Schema Integrity", passed))
    if not passed: all_passed = False

    # 5. Migration Sync
    passed, out = run_command(
        "python -m alembic current",
        "Database Migration Status",
        cwd="backend"
    )
    if passed and "head" not in out:
        print("[CRITICAL] Database is NOT at head. Migration required.")
        passed = False
    results.append(("Migration Sync", passed))
    if not passed: all_passed = False

    # 6. Frontend Build Verification (Optional/Slow)
    # Note: Using lint for now as build is extremely slow for a check script
    # The repository root is the Next.js frontend.
    print("\n[NOTE] Running frontend build check. This may take a minute...")
    passed, out = run_command(
        "npm run build",
        "Frontend Production Build",
        cwd="."
    )
    results.append(("Frontend Build", passed))
    if not passed: all_passed = False

    print("\n" + "="*52)
    print("                FINAL RELEASE REPORT                  ")
    print("="*52)
    for name, passed in results:
        status = "PASSED" if passed else "FAILED"
        print(f"{name:<30} | {status}")
    print("="*52)

    if all_passed:
        print("\n[SUCCESS] RELEASE APPROVED. System is institutionally stable.")
        sys.exit(0)
    else:
        print("\n[BLOCK] RELEASE REJECTED. Fix operational failures.")
        sys.exit(1)

if __name__ == "__main__":
    main()
