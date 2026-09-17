-- ============================================================================
-- EduPlay Platform: Initial Database Migration & Infrastructure Setup
-- Target Database: PostgreSQL (Supabase)
-- Version: 20260101_init_eduplay
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type_enum') THEN
        CREATE TYPE public.question_type_enum AS ENUM (
            'crossword',
            'wordsearch',
            'spell_the_word',
            'anagram',
            'true_false',
            'labelled_diagram',
            'unjumble',
            'hangman'
        );
    END IF;
END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- 3.1 Profiles Table (Teacher / Creator)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    school_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.3 Questions Table (Polymorphic Payload via JSONB)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_type public.question_type_enum NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    title_prompt TEXT NOT NULL,
    media_url TEXT,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id ON public.quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON public.quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(quiz_id, order_index ASC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles Policies
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 5.2 Quizzes Policies
-- Teachers have full CRUD access to their own quizzes
CREATE POLICY "Teachers can view own quizzes"
    ON public.quizzes FOR SELECT
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own quizzes"
    ON public.quizzes FOR INSERT
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own quizzes"
    ON public.quizzes FOR UPDATE
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own quizzes"
    ON public.quizzes FOR DELETE
    USING (auth.uid() = teacher_id);

-- Public can view quizzes only when published (Pass-and-play classroom mode)
CREATE POLICY "Public can view published quizzes"
    ON public.quizzes FOR SELECT
    USING (is_published = true);

-- 5.3 Questions Policies
-- Teachers have full CRUD access to questions in their quizzes
CREATE POLICY "Teachers can view questions of own quizzes"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = questions.quiz_id
              AND quizzes.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can insert questions to own quizzes"
    ON public.questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = questions.quiz_id
              AND quizzes.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can update questions of own quizzes"
    ON public.questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = questions.quiz_id
              AND quizzes.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can delete questions of own quizzes"
    ON public.questions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = questions.quiz_id
              AND quizzes.teacher_id = auth.uid()
        )
    );

-- Public can view questions only when parent quiz is published
CREATE POLICY "Public can view questions of published quizzes"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = questions.quiz_id
              AND quizzes.is_published = true
        )
    );

-- ============================================================================
-- 6. TRIGGERS & FUNCTIONS
-- ============================================================================

-- 6.1 Automatically handle new user signup from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2 Automatically update updated_at timestamp on quizzes table
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER trg_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================================================
-- 7. STORAGE BUCKET: quiz-media
-- ============================================================================

-- Create public storage bucket for quiz images and diagrams
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'quiz-media',
    'quiz-media',
    true,
    5242880, -- 5 MB max per media item
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 7.1 Storage RLS Policies
-- Public Read Access for fast loading in classroom presentations
DROP POLICY IF EXISTS "Public Read Access for quiz-media" ON storage.objects;
CREATE POLICY "Public Read Access for quiz-media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'quiz-media');

-- Authenticated Teachers Upload Access
DROP POLICY IF EXISTS "Authenticated Users can upload quiz-media" ON storage.objects;
CREATE POLICY "Authenticated Users can upload quiz-media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'quiz-media'
        AND auth.role() = 'authenticated'
    );

-- Authenticated Teachers Update Access
DROP POLICY IF EXISTS "Authenticated Users can update quiz-media" ON storage.objects;
CREATE POLICY "Authenticated Users can update quiz-media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'quiz-media'
        AND auth.role() = 'authenticated'
    );

-- Authenticated Teachers Delete Access
DROP POLICY IF EXISTS "Authenticated Users can delete quiz-media" ON storage.objects;
CREATE POLICY "Authenticated Users can delete quiz-media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'quiz-media'
        AND auth.role() = 'authenticated'
    );

