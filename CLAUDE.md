# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing landing page for the "AI Developers 16" course at the Hebrew University (מפתחי AI, מחזור 16). Goal: drive visitors to course sign-up.

## Commands

No build, lint, or test tooling. To view: `open index.html`.

## Architecture

- The page is `index.html` plus `assets/css/main.css` and deferred local scripts: GSAP 3.15.1 in `vendor/gsap/` and `assets/js/main.js`. Heebo (weights 400, 700, and 800, Hebrew and Latin) is self-hosted in `assets/fonts/` under the OFL. No CDN and no runtime network requests to other origins.
- The script drives the hero effects: a canvas "agent network" (node positions are fractions of the hero size, placed to stay clear of the console card; hidden under 720px; nodes light one by one, then the console types) and a typing `agents.run` console. Both pause offscreen and honor `prefers-reduced-motion`. DOM is built with `textContent` only — keep it that way.
- Sign-up hrefs come from one place: `<body data-signup-url>`. The script copies it onto every `a[data-signup]`.
- `#team` and `a[data-nav-team]` stay in the markup but are hidden until `SHOW_LECTURERS` in the page script is set to `true`. Lecturer photos are `img.person-photo` (width, height, alt, loading=lazy); remove `hidden` and set `src` when a real photo exists.
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

Local repo with branches `main` and `dev`, remote on GitHub (`origin`, public). Push `dev` after committing.

GitHub Pages serves `main` (root) at https://yossitamim.github.io/newwebsite/ — anything merged to `main` goes live.

## Documentation (Obsidian)

Project docs live in the Obsidian vault folder `אתר מפתחי AI 16/`:
- `README.md` — overview, decisions, page structure, open tasks. Keep it current.
- `Action Log.md` — dated log of actions; append an entry for every update.
