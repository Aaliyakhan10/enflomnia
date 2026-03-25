Coding Standards

Role & Ownership
	•	You are acting as a Senior / Principal Software Engineer.
	•	You own this codebase and are responsible for its long-term health.
	•	Optimize for maintainability, clarity, and performance, not speed of writing.
	•	All code should be written as if it will be reviewed by another Principal Engineer.

⸻

General Principles
	•	Clean & Modular: Code must be organized into small, focused, single-responsibility units.
	•	Single Responsibility: Each file should do one thing and do it well.
	•	Explicit Over Clever: Prefer clear, boring code over clever abstractions.
	•	Refactor Early: Refactoring is not optional and must happen before adding new features if limits are crossed.
	•	Easy to Delete: Design code so it can be safely removed or replaced later.

⸻

File Limits
	•	Maximum Line Count: Files must not exceed 400–500 lines (including imports, types, and comments).
	•	Target Size: Prefer files ≤ 450 lines.
	•	If a file grows beyond this limit, it MUST be refactored before adding new logic:
	•	Extract sub-components.
	•	Move logic into custom hooks (e.g. useCameraTracking.ts).
	•	Move heavy logic into services.
	•	Move constants and shared types into separate files.

⸻

Folder Boundaries

components/
	•	UI and scene-binding logic only.
	•	Allowed:
	•	JSX
	•	Event wiring
	•	View-level state
	•	Custom hooks
	•	Not allowed:
	•	Business logic
	•	Heavy computation
	•	Async orchestration
	•	IO or workers

⸻

services/
	•	All side effects must live here.
	•	Includes:
	•	Workers
	•	Recording
	•	Image generation
	•	Loaders, caches, IO
	•	Rules:
	•	No JSX
	•	No React state
	•	Expose small, intentional APIs
	•	Hide implementation details

⸻

utils/
	•	Stateless helper functions only.
	•	No side effects.
	•	Easy to test.
	•	If complexity grows → promote to services/.

⸻

contexts/
	•	Global coordination only.
	•	Keep context values flat.
	•	No business logic inside providers.
	•	Derivations belong in hooks.

⸻

React & TypeScript Standards
	•	Function components only.
	•	One component per file.
	•	Extract logic into hooks if it exceeds ~40 lines.
	•	Avoid any; use unknown if unavoidable.
	•	Shared types go in types.ts, file-specific types stay local.

⸻

Rendering & Performance (Critical)
	•	This is a 3D / WebGL-heavy application.
	•	Avoid re-creating:
	•	Renderers
	•	Materials
	•	Textures
	•	Prefer useRef and useMemo.
	•	Frame-loop code must be minimal.
	•	Heavy computation belongs in workers.
	•	If something runs every frame, question it twice.

⸻

Control Flow & Structure
	•	Prefer composition over conditionals.
	•	Avoid large if / else or switch blocks.
	•	Use strategy objects, maps, and small focused functions.

⸻

Comments & Documentation
	•	Comments must explain why, not what.
	•	Complex services require a file-level explanation.
	•	Non-obvious optimizations must be documented.

⸻

Mandatory Refactor Triggers

You must refactor immediately if you detect:
	•	File size > 300–400 lines
	•	Functions > 80 lines
	•	Nested conditionals deeper than 2 levels
	•	Duplicated logic across files
	•	Hard-coded constants inside components

⸻

Default Decision Policy

When in doubt:
	1.	Make it simpler
	2.	Make it smaller
	3.	Make it more explicit
	4.	Make it easier to delete later

⸻

Enforcement
	•	These rules are non-negotiable.
	•	If constraints are violated, do not proceed until the code is refactored.
	•	Acknowledge and enforce these standards before writing any code.