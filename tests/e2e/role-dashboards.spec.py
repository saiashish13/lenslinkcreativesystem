"""
E2E: Role selection → dashboard load smoke tests.

Verifies that a signed-in user can:
  1. Pick "Creator" from /onboarding and land on /pro with no RLS/permission errors.
  2. Pick "Editor" from /onboarding and land on /editor with no RLS/permission errors.

Requires a signed-in preview session:
  - LOVABLE_BROWSER_AUTH_STATUS=injected
  - LOVABLE_BROWSER_SUPABASE_STORAGE_KEY
  - LOVABLE_BROWSER_SUPABASE_SESSION_JSON
  - LOVABLE_BROWSER_SUPABASE_COOKIES_JSON (optional)

Run:  python tests/e2e/role-dashboards.spec.py
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
SHOTS = Path("/tmp/browser/role-dashboards"); SHOTS.mkdir(parents=True, exist_ok=True)

RLS_MARKERS = ("row-level security", "row level security", "permission denied",
               "violates row-level", "unauthorized", "42501")

def is_rls_error(text: str) -> bool:
    t = text.lower()
    return any(m in t for m in RLS_MARKERS)

async def inject_session(context, page):
    sk = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    sj = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cj = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cj:
        cookies = json.loads(cj)
        for c in cookies:
            c["url"] = BASE
        await context.add_cookies(cookies)
    await page.goto(BASE)
    if sk and sj:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(sk)}, {json.dumps(sj)})"
        )

async def reset_role_to_customer(page):
    """Best-effort: call chooseOwnRole('customer') via app fetch to keep tests idempotent."""
    try:
        await page.evaluate("""
          async () => {
            try {
              const mod = await import('/src/lib/roles.functions.ts');
              await mod.chooseOwnRole({ data: { role: 'customer' } });
            } catch (e) { /* ignore */ }
          }
        """)
    except Exception:
        pass

async def run_role(page, role_label: str, expected_path: str, tag: str):
    errors = []
    console_errs = []
    page.on("pageerror", lambda e: errors.append(f"PAGEERROR {e}"))
    page.on("console", lambda m: console_errs.append(m.text) if m.type == "error" else None)

    await reset_role_to_customer(page)
    await page.goto(f"{BASE}/onboarding", wait_until="networkidle")
    await page.screenshot(path=str(SHOTS / f"{tag}_before.png"))

    await page.get_by_role("button", name=role_label).click(timeout=8000)
    # wait for navigation to the expected dashboard
    try:
        await page.wait_for_url(f"**{expected_path}", timeout=10_000)
    except Exception:
        pass
    await page.wait_for_load_state("networkidle")
    await page.screenshot(path=str(SHOTS / f"{tag}_after.png"))

    ok_url = page.url.endswith(expected_path)
    rls_hits = [e for e in errors + console_errs if is_rls_error(e)]
    body_text = (await page.locator("body").inner_text()).strip()[:400]
    rls_in_body = is_rls_error(body_text)

    return {
        "role": role_label,
        "expected": expected_path,
        "final_url": page.url,
        "reached": ok_url,
        "rls_errors": rls_hits,
        "rls_in_page_body": rls_in_body,
        "page_errors_sample": errors[:3],
    }

async def main() -> int:
    if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") != "injected":
        print("SKIP: no injected session (LOVABLE_BROWSER_AUTH_STATUS != 'injected').")
        print("Sign in via the preview and re-run.")
        return 0  # skip, don't fail CI when no session

    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for role_label, path, tag in [
            ("I'm a Creator", "/pro", "creator"),
            ("I'm an Editor", "/editor", "editor"),
        ]:
            ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
            page = await ctx.new_page()
            await inject_session(ctx, page)
            res = await run_role(page, role_label, path, tag)
            results.append(res)
            await ctx.close()
        await browser.close()

    print(json.dumps(results, indent=2))

    failed = False
    for r in results:
        if not r["reached"]:
            print(f"FAIL: {r['role']} did not reach {r['expected']} (got {r['final_url']})")
            failed = True
        if r["rls_errors"] or r["rls_in_page_body"]:
            print(f"FAIL: {r['role']} produced RLS/permission errors: {r['rls_errors'][:2]}")
            failed = True

    if failed:
        return 1
    print("PASS: creator and editor dashboards load with no RLS errors.")
    return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
