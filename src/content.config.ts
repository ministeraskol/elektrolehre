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
        // Stufen (Spec Neuaufbau §3.3): einstieg = Start · azubi = Ausbildung · profi = Fachkraft (Geselle/Meistervorbereitung/Praxis, Rückmeldung R2, 14.09.).
        // Kein Default: Hubs, Rechtliches, Glossar, Über tragen keine Stufe; Inhaltsseiten müssen eine tragen (Test).
        stufe: z.enum(['einstieg', 'azubi', 'profi']).optional(),
        // Geselle-Kasten in der Seitenleiste: ein Satz je Seite (optional, sonst Standard je Bereich)
        geselle: z.string().max(140).optional(),
        // Blog: Serie (z. B. „Fehler des Tages“) und Datum für die Liste
        serie: z.string().optional(),
        datum: z.coerce.date().optional(),
      }),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
