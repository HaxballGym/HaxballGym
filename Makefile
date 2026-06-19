# HaxballGym dev tasks. Python via uv (ruff + ty); Rust via cargo (fmt + clippy).
# Run `make` (or `make help`) to list targets.
.DEFAULT_GOAL := help
RUST := rust/haxball_core/Cargo.toml

.PHONY: help format lint typecheck test check

help:  ## List targets
	@grep -hE '^[a-z-]+:.*##' $(MAKEFILE_LIST) | sed -E 's/:.*## /\t- /' | sort

format:  ## Auto-format the code (ruff + cargo fmt)
	uv run ruff format .
	uv run ruff check --fix .
	cargo fmt --manifest-path $(RUST)

lint:  ## Lint without modifying (ruff + rustfmt check + clippy)
	uv run ruff check .
	uv run ruff format --check .
	cargo fmt --check --manifest-path $(RUST)
	cargo clippy --manifest-path $(RUST) --quiet

typecheck:  ## Type-check the haxballgym library (ty)
	uv run ty check haxballgym/haxballgym

test:  ## Run the test suite (physics fidelity + stadium-driven env)
	uv run rust/haxball_core/tests/test_fidelity.py
	uv run haxballgym/tests/test_stadium_geometry.py
	uv run haxballgym/tests/test_stadium_loader.py
	uv run haxballgym/tests/test_env.py
	uv run haxballgym/tests/test_real_engine.py

check: lint typecheck test  ## Everything CI runs (lint + typecheck + test)
