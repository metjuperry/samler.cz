# samler.cz

Personal site - talks, projects and writing. Astro, static output, deployed to Azure
Static Web Apps on push to `master`.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
npm run assets   # regenerate favicon.ico, apple-touch-icon.png and og.png
```

## Where the content lives

Nothing is hardcoded in markup. To change what the site says, edit data:

| What | Where |
|---|---|
| Name, title, bios, links, speaking topics and formats | `src/data/profile.json` |
| Blog posts | `src/data/posts.json` |
| Talks - one file each | `src/content/talks/*.md` |
| Projects - one file each | `src/content/projects/*.md` |

Both collections are validated by a Zod schema in `src/content.config.ts`. A missing
required field or a bad enum value **fails the build** rather than rendering something
broken - that's deliberate.

### Adding a talk

Drop a new `.md` in `src/content/talks/`:

```yaml
---
title: Your talk title            # quote it if it contains a colon
event: Some Conference 2027
eventUrl: https://…               # optional, must be a valid URL
location: Prague, Czechia         # optional
date: 2027-06-14                  # optional - use `year: 2027` if only the year is known
format: session                   # session | workshop | lab | panel
language: en                      # en | cs
withSpeakers: ["Co Presenter"]    # optional
slidesUrl: https://…              # optional
videoUrl: https://…               # optional
summary: >-
  One paragraph. Required.
---
```

Talks with a `date` sort first, then those with only a `year`. A talk with **neither**
renders in the compact "also presented" list instead of as a full card, so undated
entries can't pad out the main list.

### Adding a project

`role` is required and is the honest one: `author`, `maintainer`, `contributor`, or
`team` (built by the team, not primarily by me). It renders as a badge on the card, so
anything claimed here can be checked against the repo's commit history. Keep it that way.

`group` decides which section a card lands in: `team` (the TALXIS stack), `external`
(merged PRs to projects I don't maintain - point `repo` at the PR itself, not the repo
root, since that's the actual evidence), or `personal` (things I built and maintain
myself). A group with no entries doesn't render its section.

## Generated assets

`npm run assets` writes `public/favicon.ico`, `public/apple-touch-icon.png` and
`public/og.png`. They're committed rather than generated in CI - the inputs change about
once a year, and the SWA build container is a bad place to discover a font problem. Re-run
it after changing the headshot, `public/favicon.svg`, or the name/title/tagline in
`profile.json`.

The OG image is what LinkedIn and Slack show when the site is shared, so check it after
regenerating.

`src/assets/headshot.jpg` is a 1000×1000 square cut from the full-frame studio portrait
(`R5JM0459.jpg`, 4669×7000) with `extract({left: 217, top: 340, width: 4102, height: 4102})`
- head-and-shoulders with enough headroom to survive the circular mask. Recrop from the
original if you need a different framing; the master isn't committed.

## Before deploying

```bash
npm run build
npx linkinator ./dist --recurse --skip "linkedin.com" --skip "sessionize.com"
```

LinkedIn returns `999` to bots and Sessionize rate-limits - both are skipped, not broken.
Absolute `https://samler.cz/...` URLs from the canonical and OG tags will 404 until the
change is actually live; everything else must be 200.
