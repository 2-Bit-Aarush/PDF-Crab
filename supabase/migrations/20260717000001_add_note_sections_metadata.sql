-- Migration: Add metadata JSONB column to note_sections
ALTER TABLE public.note_sections ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
