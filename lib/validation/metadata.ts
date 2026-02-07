import { z } from "zod";

const AttributeSchema = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number()]),
  display_type: z.string().optional(),
});

const MediaSchema = z.object({
  images: z.array(z.string().url()),
  videos: z.array(z.string().url()).optional(),
  floor_plans: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),
});

const PropertiesSchema = z.object({
  auction: z.object({
    phase: z.number().min(0).max(3),
    started: z.boolean(),
    ended: z.boolean(),
  }),
  revealed: z.number().min(0).max(100),
  next_reveal: z.string().optional(),
});

export const MetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image: z.string().url(),
  attributes: z.array(AttributeSchema),
  media: MediaSchema,
  properties: PropertiesSchema,
});

export type Metadata = z.infer<typeof MetadataSchema>;
export type Attribute = z.infer<typeof AttributeSchema>;

export function validateMetadata(data: unknown): Metadata {
  return MetadataSchema.parse(data);
}
