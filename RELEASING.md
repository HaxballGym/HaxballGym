# Releasing

How to publish HaxballGym to PyPI. Two packages ship: **`haxball_core`** (the Rust
engine, compiled wheels) and **`haxballgym`** (pure-Python env). `haxballgym-examples`
(`rl/`) is `package = false` and is never published.

Publishing is automated by `.github/workflows/release.yml` using **PyPI Trusted
Publishing** (OIDC) — no API tokens are stored anywhere.

---

## One-time setup (do this once)

Trusted publishing must be registered per project on PyPI. For **each** of
`haxball-core` and `haxballgym`:

1. `haxball_core` does not exist on PyPI yet → create it as a *pending* publisher:
   PyPI → Your projects → **Publishing** → *Add a pending publisher*.
   `haxballgym` already exists (you own it) → its project → *Settings → Publishing →
   Add a trusted publisher*.
2. Fill in:
   - **Owner:** `HaxballGym`
   - **Repository:** `HaxballGym`
   - **Workflow name:** `release.yml`
   - **Environment:** `pypi`
3. In the GitHub repo, create an Environment named **`pypi`**
   (Settings → Environments). Optionally add a required reviewer so a human approves
   each publish.

---

## Cutting a release

Pre-flight is already done for 1.0.0: versions bumped, `LICENSE` (MIT) added,
metadata filled, both packages build locally (`uv build --package haxballgym`,
`maturin build --release` in `rust/haxball_core`).

1. Make sure `master` is green and the working tree is committed.
2. (Optional) Dry-run the build matrix without publishing:
   GitHub → Actions → **Release** → *Run workflow*. The build jobs run; the publish
   jobs are skipped (they only run on tag pushes).
3. Tag and push — this triggers the real publish:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   `publish-core` runs first; `publish-gym` waits for it so the `haxball-core`
   dependency exists before `haxballgym` goes live.
4. Verify: <https://pypi.org/project/haxball-core/> and
   <https://pypi.org/project/haxballgym/>, then in a clean venv:
   ```bash
   pip install haxballgym && python -c "import haxballgym; print(haxballgym.__version__)"
   ```

### TestPyPI first (recommended for the very first run)

Register the same trusted publishers on <https://test.pypi.org>, temporarily point the
`pypa/gh-action-pypi-publish` steps at TestPyPI with
`repository-url: https://test.pypi.org/legacy/`, push a pre-release tag (e.g.
`v1.0.0rc1`), confirm both upload, then revert.

---

## Deprecating the superseded packages

Source changes are already staged in the sibling repos (deprecation warning on import,
README banner, `Development Status :: 7 - Inactive` classifier, version bump). These are
Poetry projects, so publish each final release manually:

```bash
# ../Ursinaxball  -> 0.2.5
cd ../Ursinaxball && poetry build && poetry publish

# ../haxballgym-tools  -> 1.1.2
cd ../haxballgym-tools && poetry build && poetry publish
```

(`poetry config pypi-token.pypi <token>` first, or use `poetry publish --username __token__`.)

---

## Yanking the old `haxballgym` 0.x line

The 1.0.0 rewrite has a new, incompatible API. To stop new installs from silently
getting the old `0.2.0`–`0.5.8` releases, **yank** them (yanked releases stay
downloadable for anyone who pins an exact version, but `pip install haxballgym`
skips them):

- **Web UI:** PyPI → `haxballgym` → *Manage* → *Releases* → for each of
  `0.2.0 … 0.5.8`, open the release → **Options → Yank**. Give a reason, e.g.
  *"Superseded by 1.0.0 (rewritten API). Pin `haxballgym==0.5.8` for the legacy
  version."*

Do this **after** 1.0.0 is live, so there is always a current release to install.
