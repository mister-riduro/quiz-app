-- ============================================================================
-- EduPlay Platform: Add 'multiple_choice' to question_type_enum
-- Version: 20260921_add_multiple_choice
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'question_type_enum'
          AND pg_enum.enumlabel = 'multiple_choice'
    ) THEN
        ALTER TYPE public.question_type_enum ADD VALUE 'multiple_choice';
    END IF;
END $$;

