import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // source: Almanca kaynak · machine: AI/makine çevirisi · reviewed: anadil kontrolünden geçti
        translated: z.enum(['source', 'machine', 'reviewed']).default('source'),
        sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
        lernfeld: z.array(z.number().int().min(1).max(13)).optional(),
        // Drei Stufen (12 Eyl 2026): einstieg = Lehrling/Neugierige · geselle = Geselle/erfahren · meister = Meister/Obermeister
        stufe: z.enum(['einstieg', 'geselle', 'meister']).default('einstieg'),
        // Blog: Serie (z. B. „Fehler des Tages“) und Datum für die Liste
        serie: z.string().optional(),
        datum: z.coerce.date().optional(),
      }),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
