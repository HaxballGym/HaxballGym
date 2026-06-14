# Reference: OpenAI / Codex harness engineering

Source: <https://github.com/celesteanders/harness/blob/main/docs/research/260211_openai_harness_engineering_codex.md>

The doc structure of this repo is modeled on the practices described there. The
principles we actually adopted:

- **Progressive disclosure.** A lean root map (`AGENTS.md`, ~120 lines) that points
  to deeper sources of truth rather than restating them. Detail lives in `docs/`.
- **Living documentation, code is the system of record.** Docs explain decisions the
  code can't; anything the code already states (structure, history) is not duplicated.
  Stale docs get pruned, not left to rot.
- **Layered architecture with enforced dependency direction.** `rl/` → `haxball_core`,
  one way (`ARCHITECTURE.md`). The fidelity test is a *mechanical* contract, not a
  guideline.
- **Continuous, incremental cleanup** over big-bang refactors — tech debt handled as
  garbage collection.

## How that maps to this repo

| Their artifact | Ours |
|---|---|
| `AGENTS.md` (lean map) | `AGENTS.md` |
| `ARCHITECTURE.md` | `ARCHITECTURE.md` |
| `docs/design-docs/` | `docs/design-docs/` (rationale, core beliefs) |
| `docs/exec-plans/{active,completed}/` | `docs/exec-plans/active/next-iteration.md` |
| `docs/references/` | this folder |
| Mechanical enforcement (linters/tests) | `rust/haxball_core/tests/test_fidelity.py` |

Not everything in the source article applies to a research/RL repo (e.g. frontend
and product-spec sections); we took the structure and the principles, not the
literal file list.
