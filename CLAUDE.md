# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing landing page for the "AI Developers 16" course at the Hebrew University (מפתחי AI, מחזור 16). Goal: drive visitors to course sign-up.

## Commands

No build, lint, or test tooling. To view: `open index.html`.

## Architecture

- Everything is in a single `index.html` with an inline `<style>`; no JS, no dependencies. Only external resource is the Heebo font from Google Fonts.
- Page is Hebrew, RTL (`lang="he" dir="rtl"`). Use logical CSS properties (`margin-inline-start`, etc.) and keep RTL in mind for any layout change.
- Colors and sizes are CSS custom properties on `:root`; change theme there.
- Sections are anchored by id (`#what`, `#syllabus`, `#team`, `#faq`, `#signup`) and linked from the sticky nav; keep the nav in sync when adding/removing sections.
- Placeholder content is marked with `TODO` (course facts, syllabus, lecturers, FAQ answers, sign-up form link which is currently `#`). Course copy is unverified placeholder text — don't present it as fact.
- Do not add the official Hebrew University logo/branding unless the user provides it with permission.

## Workflow (required, in this order)

1. **Models:** when a task needs planning, plan with Opus 5.5 (`claude-opus-5-5`) and execute the implementation with Sonnet 5.5 (`claude-sonnet-5-5`, e.g. via a subagent with `model: sonnet`).
2. **Tests:** after writing code, test the change and run regression checks on the rest of the page. There is no test suite; at minimum: every nav `href="#..."` has a matching section id, the HTML has no broken tags, and the page renders correctly at desktop and mobile widths in RTL.
3. **Security:** after tests pass, run the `security-review` skill.
4. **Commit:** after every code change, commit. Work on `dev`; `main` changes only by merging `dev` when the user asks.
5. **Document:** at the end of every agent run, record every update in Obsidian (see below).

## Git

Local repo with branches `main` and `dev`, remote on GitHub (`origin`). Push `dev` after committing.

## Documentation (Obsidian)

Project docs live in the Obsidian vault folder `אתר מפתחי AI 16/`:
- `README.md` — overview, decisions, page structure, open tasks. Keep it current.
- `Action Log.md` — dated log of actions; append an entry for every update.
