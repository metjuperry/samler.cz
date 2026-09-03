import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * A talk. `date` is optional on purpose: several older community talks have no
 * confirmed date yet, and inventing one would be worse than omitting it. Undated
 * talks render in a compact secondary list rather than as full cards.
 */
const talks = defineCollection({
  loader: glob({ base: './src/content/talks', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /**
     * 'offered' = a talk on the menu, ordered by `order` to match the curated
     * order on Sessionize. 'delivered' = an actual outing, ordered by date.
     * Mirrors how the Sessionize profile is structured.
     */
    status: z.enum(['offered', 'delivered']).default('delivered'),
    /** Curated position among offered talks; lower sorts first. */
    order: z.number().int().default(100),
    /** Required for delivered talks; offered talks have no event yet. */
    event: z.string().optional(),
    eventUrl: z.string().url().optional(),
    location: z.string().optional(),
    date: z.coerce.date().optional(),
    // `year` covers talks where the edition is known but the exact day isn't.
    year: z.number().int().min(2000).max(2100).optional(),
    format: z.enum(['session', 'workshop', 'lab', 'panel']).default('session'),
    withSpeakers: z.array(z.string()).default([]),
    slidesUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    topics: z.array(z.string()).default([]),
    /** Organiser-facing detail, shown when known. */
    durationMinutes: z.number().int().positive().optional(),
    level: z.enum(['Introduction', 'Intermediate', 'Advanced', 'Expert']).optional(),
    track: z.string().optional(),
    featured: z.boolean().default(false),
    summary: z.string(),
  }).superRefine((t, ctx) => {
    if (t.status === 'delivered' && !t.event) {
      ctx.addIssue({ code: 'custom', message: 'delivered talks need an `event`', path: ['event'] });
    }
  }),
});

/**
 * A project. `role` is required so every card states Matěj's actual relationship
 * to the repo - author, maintainer, or contributor. See README for why.
 */
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    repo: z.string().url(),
    org: z.string(),
    language: z.string(),
    // 'team' = built by the TALXIS/NETWORG team; Matěj works with and teaches it
    // but is not a significant committer. Keeps the page checkable against GitHub.
    role: z.enum(['author', 'maintainer', 'contributor', 'team']),
    roleNote: z.string().optional(),
    stars: z.number().int().nonnegative().default(0),
    group: z.enum(['team', 'external', 'personal']),
    order: z.number().int().default(100),
    summary: z.string(),
  }),
});

export const collections = { talks, projects };
