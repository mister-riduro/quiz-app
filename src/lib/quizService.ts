import { supabase } from "./supabaseClient";
import { StoredQuiz } from "@/stores/quizStore";
import { BuilderQuestion } from "@/stores/builderStore";
import { QuestionTypeEnum } from "@/types/database";
import { generateUUID } from "@/utils/uuid";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Transforms database question row into frontend BuilderQuestion model
 */
function mapDatabaseQuestionToBuilder(q: any): BuilderQuestion {
  const content = q.content || {};
  const meta = content._meta || {};

  return {
    id: q.id,
    quizId: q.quiz_id,
    type: q.question_type as QuestionTypeEnum,
    orderIndex: q.order_index ?? 0,
    titlePrompt: q.title_prompt ?? "",
    mediaUrl: q.media_url || "",
    content,
    points: meta.points ?? content.points ?? 100,
    timeLimitSeconds: meta.timeLimitSeconds ?? content.timeLimitSeconds ?? 30,
  };
}

/**
 * Transforms database quiz row + questions into frontend StoredQuiz model
 */
function mapDatabaseQuizToStored(row: any): StoredQuiz {
  const questions: BuilderQuestion[] = Array.isArray(row.questions)
    ? row.questions
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map(mapDatabaseQuestionToBuilder)
    : [];

  const teacherProfile = row.profiles
    ? {
        full_name: row.profiles.full_name,
        school_name: row.profiles.school_name,
        avatar_url: row.profiles.avatar_url,
      }
    : undefined;

  let rawDesc = row.description || "";
  let cleanDesc = rawDesc;
  let timerMode: "global" | "per_question" = "global";
  let globalTimeLimitSeconds = 7200;

  try {
    if (rawDesc.startsWith("{") && rawDesc.includes('"timerMode"')) {
      const parsed = JSON.parse(rawDesc);
      cleanDesc = parsed.text ?? "";
      timerMode = parsed.timerMode ?? "global";
      globalTimeLimitSeconds = parsed.globalTimeLimitSeconds ?? 7200;
    }
  } catch (e) {
    // raw text fallback
  }

  return {
    id: row.id,
    teacherId: row.teacher_id,
    title: row.title,
    description: cleanDesc,
    coverImageUrl: row.cover_image_url || "",
    isPublished: !!row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    questionsCount: questions.length,
    category: "Umum",
    timerMode,
    globalTimeLimitSeconds,
    questions,
    teacherProfile,
  };
}

/**
 * Service for managing Quizzes and Questions synchronization with Supabase
 */
export const quizService = {
  /**
   * Fetch all quizzes created by a specific teacher
   */
  async fetchTeacherQuizzes(teacherId: string): Promise<StoredQuiz[]> {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        teacher_id,
        title,
        description,
        cover_image_url,
        is_published,
        created_at,
        updated_at,
        questions (
          id,
          quiz_id,
          question_type,
          order_index,
          title_prompt,
          media_url,
          content,
          created_at
        )
      `,
      )
      .eq("teacher_id", teacherId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[quizService] fetchTeacherQuizzes error:", error.message);
      throw error;
    }

    return (data || []).map(mapDatabaseQuizToStored);
  },

  /**
   * Fetch all published quizzes (accessible by kiosk/students without auth)
   */
  async fetchPublishedQuizzes(): Promise<StoredQuiz[]> {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        teacher_id,
        title,
        description,
        cover_image_url,
        is_published,
        created_at,
        updated_at,
        profiles (
          id,
          full_name,
          school_name,
          avatar_url
        ),
        questions (
          id,
          quiz_id,
          question_type,
          order_index,
          title_prompt,
          media_url,
          content,
          created_at
        )
      `,
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(
        "[quizService] fetchPublishedQuizzes error:",
        error.message,
      );
      throw error;
    }

    return (data || []).map(mapDatabaseQuizToStored);
  },

  /**
   * Upsert a quiz and its questions into Supabase
   */
  async saveQuizToCloud(
    quiz: StoredQuiz,
    teacherId: string,
  ): Promise<StoredQuiz> {
    const quizId = isValidUUID(quiz.id) ? quiz.id : generateUUID();

    // Encode timerMode and globalTimeLimitSeconds into description metadata
    let descriptionPayload = quiz.description || "";
    try {
      descriptionPayload = JSON.stringify({
        text: quiz.description || "",
        timerMode: quiz.timerMode || "global",
        globalTimeLimitSeconds: quiz.globalTimeLimitSeconds ?? 7200,
      });
    } catch (e) {
      descriptionPayload = quiz.description || "";
    }

    // 1. Upsert quiz record
    const { error: quizError } = await (supabase.from("quizzes") as any).upsert(
      {
        id: quizId,
        teacher_id: teacherId,
        title: quiz.title.trim() || "Kuis Tanpa Judul",
        description: descriptionPayload,
        cover_image_url: quiz.coverImageUrl || null,
        is_published: !!quiz.isPublished,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (quizError) {
      console.error("[quizService] saveQuizToCloud error:", quizError.message);
      throw quizError;
    }

    // 2. Sync questions
    // First remove existing questions for this quiz to prevent orphaned questions
    await supabase.from("questions").delete().eq("quiz_id", quizId);

    const questionsWithIds: BuilderQuestion[] = (quiz.questions || []).map(
      (q, idx) => ({
        ...q,
        id: isValidUUID(q.id) ? q.id : generateUUID(),
        quizId,
        orderIndex: idx,
      }),
    );

    if (questionsWithIds.length > 0) {
      const payload = questionsWithIds.map((q) => {
        let typeStr = q.type;
        if (typeStr === ("spell_word" as any)) {
          typeStr = "spell_the_word";
        }

        return {
          id: q.id,
          quiz_id: quizId,
          question_type: typeStr,
          order_index: q.orderIndex,
          title_prompt: q.titlePrompt || "Pertanyaan",
          media_url: q.mediaUrl || null,
          content: {
            ...(typeof q.content === "object" && q.content !== null
              ? q.content
              : {}),
            _meta: {
              points: q.points ?? 100,
              timeLimitSeconds: q.timeLimitSeconds ?? 30,
            },
          },
        };
      });

      const { error: questionsError } = await (
        supabase.from("questions") as any
      ).insert(payload);

      if (questionsError) {
        console.error(
          "[quizService] questions insert error:",
          questionsError.message,
        );
        throw questionsError;
      }
    }

    return {
      ...quiz,
      id: quizId,
      teacherId,
      questions: questionsWithIds,
      questionsCount: questionsWithIds.length,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete quiz and cascade delete its questions
   */
  async deleteQuizFromCloud(quizId: string): Promise<void> {
    if (!isValidUUID(quizId)) return;

    const { error } = await supabase.from("quizzes").delete().eq("id", quizId);

    if (error) {
      console.error("[quizService] delete error:", error.message);
      throw error;
    }
  },

  /**
   * Toggle publish status on Supabase
   */
  async togglePublishInCloud(
    quizId: string,
    isPublished: boolean,
  ): Promise<void> {
    if (!isValidUUID(quizId)) return;

    const { error } = await (supabase.from("quizzes") as any)
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId);

    if (error) {
      console.error("[quizService] togglePublish error:", error.message);
      throw error;
    }
  },
};
