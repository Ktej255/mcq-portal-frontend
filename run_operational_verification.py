import subprocess
import sys
import os
import json
import time

def run_command(command, description, cwd=None):
    print(f"\n--- [VERIFICATION] {description} ---")
    start_time = time.time()
    env = os.environ.copy()
    # Ensure backend and root are in PYTHONPATH
    root = os.getcwd()
    backend = os.path.join(root, "backend")
    env["PYTHONPATH"] = root + os.pathsep + backend
    
    try:
        # Use shell=True for convenience, but keep commands simple
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
    print("      MCQ PORTAL OPERATIONAL VERIFICATION         ")
    print("====================================================")
    
    all_passed = True
    results = []

    # 1. Graphify Audit
    passed, out = run_command(
        "python backend/scripts/governance/graphify_audit.py backend/app/services/scoring_engine.py backend/app/services/report_service.py",
        "Graphify Dependency Audit"
    )
    results.append(("Graphify Audit", passed))
    if not passed: all_passed = False

    # 2. Educational Truth Invariants
    passed, out = run_command(
        "python backend/tests/educational_truth.py",
        "Educational Truth Invariants"
    )
    results.append(("Educational Truth", passed))
    if not passed: all_passed = False

    # 3. Runtime Flow Verification
    passed, out = run_command(
        "python backend/scripts/governance/runtime_flow_verifier.py",
        "Runtime Flow Verification"
    )
    results.append(("Runtime Flow", passed))
    if not passed: all_passed = False

    # 4. Behavioral Regression
    passed, out = run_command(
        "python backend/tests/governance/test_behavioral_regression.py",
        "Behavioral Regression Suite"
    )
    results.append(("Behavioral Regression", passed))
    if not passed: all_passed = False

    # 5. Schema Integrity
    passed, out = run_command(
        "python backend/tests/operational/test_schema_integrity.py",
        "API Schema Integrity"
    )
    results.append(("Schema Integrity", passed))
    if not passed: all_passed = False

    # 6. Database Migration Check
    passed, out = run_command(
        "python -m alembic current",
        "Database Migration Status",
        cwd="backend"
    )
    if passed and "head" not in out:
        print("[WARNING] Database is NOT at head. Migration required.")
        passed = False
    results.append(("Migration Check", passed))
    if not passed: all_passed = False

    # 7. Student Simulations (Optional/Warning only)
    passed, out = run_command(
        "python backend/tests/operational/student_simulations.py",
        "Student Lifecycle Simulations"
    )
    results.append(("Student Simulations", passed))

    print("\n" + "="*52)
    print("                FINAL VERIFICATION REPORT             ")
    print("="*52)
    for name, passed in results:
        status = "PASSED" if passed else "FAILED"
        print(f"{name:<30} | {status}")
    print("="*52)

    if all_passed:
        print("\n[SUCCESS] System is operationally STABLE.")
        sys.exit(0)
    else:
        print("\n[CRITICAL] Operational failures detected. Investigate immediately.")
        sys.exit(1)

if __name__ == "__main__":
    main()
