"""Run the v3 delivery gates sequentially; preserve every command's output."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "ui-qa"
RUN = OUTPUT / "v3-verification"
NPM = shutil.which("npm.cmd") or shutil.which("npm")
NPX = shutil.which("npx.cmd") or shutil.which("npx")
NODE = shutil.which("node")
if not all((NPM, NPX, NODE)):
    raise SystemExit("Node, npm and npx must be available")
RUN.mkdir(exist_ok=False)
results = []


def run_gate(name, command, environment=None, timeout=600):
    started = datetime.now(timezone.utc).isoformat()
    environment_values = os.environ.copy()
    for key in ("QA_BROWSER", "QA_PROFILE", "QA_FLOW", "QA_PAGE", "QA_DIALOG"):
        environment_values.pop(key, None)
    environment_values.update(environment or {})
    log_path = RUN / f"{name}.log"
    print(json.dumps({"gate": name, "status": "running"}), flush=True)
    with log_path.open("w", encoding="utf-8") as log:
        process = subprocess.Popen(command, cwd=ROOT, env=environment_values, stdout=log, stderr=subprocess.STDOUT)
        try:
            code = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise RuntimeError(f"Gate timed out: {name}") from None
    record = {"name": name, "command": command, "environment": environment or {}, "started": started,
              "finished": datetime.now(timezone.utc).isoformat(), "exitCode": code, "log": str(log_path)}
    results.append(record)
    with (RUN / "gates.jsonl").open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(record, ensure_ascii=False) + "\n")
    (RUN / "gates.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"gate": name, "exitCode": code, "log": str(log_path)}), flush=True)
    if code:
        raise SystemExit(code)


run_gate("tests", [NPM, "test", "--", "--reporter=json", "--outputFile=output/ui-qa/v3-verification/unit-tests.json"])
run_gate("production-build", [NPM, "run", "build"])
run_gate("lint", [NPM, "run", "lint"])
run_gate("design-lint", [NPM, "run", "design:lint"])
run_gate("contrast-typecheck", [NPX, "tsc", "--ignoreConfig", "--noEmit", "--allowJs", "--checkJs", "--target", "ES2023", "--module", "NodeNext", "--skipLibCheck", "--lib", "ES2023,DOM,DOM.Iterable", "qa/rendered-contrast.mjs", "qa/rendered-contrast.test.ts"])
run_gate("fixture-build", [NPM, "run", "qa:build"])
run_gate("layout-regressions", [NPM, "run", "qa:regressions"])
run_gate("brand-regressions", [NODE, "qa/brand.mjs", "v3-brand-verified"])
for engine in ("chromium", "firefox", "webkit"):
    run_gate(f"{engine}-dialogs", [NODE, "qa/dialogs.mjs", f"v3-{engine}-dialogs-verified"], {"QA_BROWSER": engine})
    run_gate(f"{engine}-flows", [NODE, "qa/flows.mjs", f"v3-{engine}-flows-verified"], {"QA_BROWSER": engine})
run_gate("diff-check", [shutil.which("git") or "git", "diff", "--check"])
print(json.dumps({"completedGates": len(results), "failed": sum(item["exitCode"] != 0 for item in results), "report": str(RUN / "gates.json")}), flush=True)
