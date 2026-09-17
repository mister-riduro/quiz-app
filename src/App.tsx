import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { TactileButton } from "@/components/ui/TactileButton";
import { TileToken, TileTokenState } from "@/components/ui/TileToken";
import { DuoCard } from "@/components/ui/DuoCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BottomSheetFeedback } from "@/components/common/BottomSheetFeedback";
import { initializeQuestionPlugins } from "@/features/questions/plugins";
import { pluginRegistry } from "@/plugins/core/registry";
import { sampleQuestionPlugin } from "@/plugins/questions/_sample";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { useAuthStore } from "@/stores/authStore";
import { AuthModal } from "@/features/auth";
import { QuizDashboardPage } from "@/features/dashboard";
import { QuizBuilderPage } from "@/features/builder";
import { PresenterKioskPage } from "@/features/presenter";
import { Quiz } from "@/types/quiz";
import { useBuilderStore, BuilderQuestion } from "@/stores/builderStore";
import { useQuizStore } from "@/stores/quizStore";
import { ImageUploader } from "@/components/common/ImageUploader";
import {
  Trophy,
  Flame,
  Layers,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  Volume2,
  VolumeX,
  Music,
  PartyPopper,
  Puzzle,
  Box,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Gamepad2,
} from "lucide-react";

export function App() {
  const [appMode, setAppMode] = useState<
    "dashboard" | "builder" | "showcase" | "presenter"
  >("dashboard");
  const [hostedQuiz, setHostedQuiz] = useState<Quiz | null>(null);
  const [hostedQuestions, setHostedQuestions] = useState<BuilderQuestion[]>([]);
  const [presenterOrigin, setPresenterOrigin] = useState<
    "dashboard" | "builder"
  >("dashboard");
  const [currentStep, setCurrentStep] = useState(3);
  const [totalSteps] = useState(6);
  const [streak] = useState(4);
  const [score, setScore] = useState(320);
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  const [registryErrorMsg, setRegistryErrorMsg] = useState<string | null>(null);

  // Auth studio tab/modal state
  const [authView, setAuthView] = useState<"none" | "login" | "register">(
    "none",
  );
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>(
    "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80",
  );

  // Audio system hook
  const {
    playTap,
    playPop,
    playCorrect,
    playWrong,
    playBalloonPop,
    playVictory,
    isMuted,
    toggleMute,
  } = useSoundEffect();

  // Auth store
  const { user, profile, signOut, initialize } = useAuthStore();

  // Interactive Tile Tokens State for "EDUPLAY" demo
  const [tiles, setTiles] = useState<
    { id: string; letter: string; state: TileTokenState }[]
  >([
    { id: "1", letter: "E", state: "correct" },
    { id: "2", letter: "D", state: "selected" },
    { id: "3", letter: "U", state: "idle" },
    { id: "4", letter: "P", state: "idle" },
    { id: "5", letter: "L", state: "wrong" },
    { id: "6", letter: "A", state: "disabled" },
    { id: "7", letter: "Y", state: "idle" },
  ]);

  const [feedbackState, setFeedbackState] = useState<{
    isOpen: boolean;
    isCorrect: boolean;
    message?: string;
  }>({
    isOpen: false,
    isCorrect: false,
  });

  useEffect(() => {
    initializeQuestionPlugins();
    initialize();
  }, [initialize]);

  const cycleTileState = (index: number) => {
    playPop();
    setTiles((prev) => {
      const next = [...prev];
      const current = next[index]?.state;
      const states: TileTokenState[] = [
        "idle",
        "selected",
        "correct",
        "wrong",
        "disabled",
      ];
      const nextIdx = (states.indexOf(current || "idle") + 1) % states.length;
      if (next[index]) {
        next[index] = { ...next[index]!, state: states[nextIdx]! };
      }
      return next;
    });
  };

  const handleSimulateAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      playCorrect();
      setScore((s) => s + 100);
      setFeedbackState({
        isOpen: true,
        isCorrect: true,
        message:
          "Luar biasa! Sound feedback chime & bottom sheet membal aktif.",
      });
    } else {
      playWrong();
      setFeedbackState({
        isOpen: true,
        isCorrect: false,
        message: "Kurang tepat! Dengarkan audio feedback buzzer non-punitif.",
      });
    }
  };

  const handleTestUnregisteredPlugin = () => {
    try {
      playTap();
      pluginRegistry.getPlugin("unknown_type" as any);
      setRegistryErrorMsg(null);
    } catch (err: unknown) {
      playWrong();
      if (err instanceof Error) {
        setRegistryErrorMsg(err.message);
      }
    }
  };

  const registeredPlugins = pluginRegistry.getAllPlugins();
  const SamplePlayerComp = sampleQuestionPlugin.PlayerComponent;

  // 1. FULL-SCREEN PRESENTER KIOSK VIEW
  if (appMode === "presenter") {
    return (
      <PresenterKioskPage
        quiz={hostedQuiz || undefined}
        questions={hostedQuestions.length > 0 ? hostedQuestions : undefined}
        onExit={() => {
          playTap();
          setAppMode(presenterOrigin === "builder" ? "builder" : "dashboard");
          setHostedQuiz(null);
          setHostedQuestions([]);
        }}
      />
    );
  }

  // 2. DEDICATED FULL-SCREEN QUIZ BUILDER STUDIO PAGE (NOT A TAB)
  if (appMode === "builder") {
    return (
      <div className="min-h-screen bg-duo-bg animate-in fade-in slide-in-from-right-4 duration-200">
        <QuizBuilderPage
          onBack={() => {
            playPop();
            setAppMode("dashboard");
          }}
          onPreview={(previewQuiz, previewQuestions) => {
            playVictory();
            setHostedQuiz({
              id: previewQuiz.id || "preview-quiz",
              teacherId: previewQuiz.teacherId || user?.id || "teacher-me",
              title: previewQuiz.title || "Pratinjau Kuis",
              description: previewQuiz.description,
              category: previewQuiz.category,
              isPublished: previewQuiz.isPublished ?? false,
              createdAt: previewQuiz.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              questionsCount: previewQuestions.length,
              timerMode: previewQuiz.timerMode,
              globalTimeLimitSeconds: previewQuiz.globalTimeLimitSeconds,
            });
            setHostedQuestions(previewQuestions);
            setPresenterOrigin("builder");
            setAppMode("presenter");
          }}
        />
      </div>
    );
  }

  // 3. MAIN DASHBOARD & SHOWCASE CONTAINER
  return (
    <div className="min-h-screen flex flex-col bg-duo-bg text-duo-dark selection:bg-duo-green-light selection:text-duo-green-border">
      {/* Top Header */}
      <Header />

      {/* Navigation Switcher Bar (Dashboard vs Lab Showcase) */}
      <div className="bg-white border-b-2 border-slate-200 sticky top-[73px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => {
                playPop();
                setAppMode("dashboard");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                appMode === "dashboard"
                  ? "bg-duo-green text-white shadow-sm border-b-2 border-b-duo-green-border"
                  : "text-[#777777] hover:text-duo-dark hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Guru
            </button>

            <button
              type="button"
              onClick={() => {
                playPop();
                setAppMode("showcase");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
                appMode === "showcase"
                  ? "bg-duo-blue text-white shadow-sm border-b-2 border-b-duo-blue-border"
                  : "text-[#777777] hover:text-duo-dark hover:bg-slate-100"
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Lab Showcase & Komponen
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <Badge variant="green" className="text-[10px]">
                {profile?.full_name || user.email}
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="gray" className="text-[10px]">
                  Siswa / Kiosk Mode
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setAuthView("login");
                  }}
                  className="text-xs font-black text-duo-green hover:underline cursor-pointer"
                >
                  Masuk Guru
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO APP MODE */}
      {appMode === "dashboard" && (
        <QuizDashboardPage
          onHostQuiz={(quiz) => {
            playVictory();
            const stored = useQuizStore.getState().getQuizById(quiz.id);
            const questions = stored?.questions || [];
            setHostedQuiz(quiz);
            setHostedQuestions(questions);
            setPresenterOrigin("dashboard");
            setAppMode("presenter");
          }}
          onCreateQuiz={(quizData) => {
            playTap();
            const newId = quizData?.id || `quiz-${Date.now()}`;
            useBuilderStore.getState().resetBuilder({
              id: newId,
              teacherId: user?.id || "teacher-me",
              title: quizData?.title || "Kuis Kelas Baru",
              description: quizData?.description || "",
              category: quizData?.category || "Umum",
              isPublished: false, // Starts as draft
            });
            setAppMode("builder");
          }}
          onEditQuiz={(quiz) => {
            playTap();
            const stored = useQuizStore.getState().getQuizById(quiz.id);
            useBuilderStore.getState().loadQuiz(
              {
                id: quiz.id,
                teacherId: quiz.teacherId,
                title: quiz.title,
                description: quiz.description,
                category: quiz.category,
                isPublished: quiz.isPublished,
                coverImageUrl: quiz.coverImageUrl,
                createdAt: quiz.createdAt,
                updatedAt: quiz.updatedAt,
                timerMode: quiz.timerMode,
                globalTimeLimitSeconds: quiz.globalTimeLimitSeconds,
              },
              stored?.questions,
            );
            setAppMode("builder");
          }}
        />
      )}

      {appMode === "showcase" && (
        /* Main Container for Showcase / Lab */
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
          {/* Progress & Stat Header */}
          <DuoCard elevated className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1 text-xs font-black uppercase text-[#777777]">
                <span>
                  Progres Sesi ({currentStep}/{totalSteps})
                </span>
                <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <ProgressBar current={currentStep} total={totalSteps} size="md" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-duo-orange font-black text-xs sm:text-sm px-3 py-1.5 bg-duo-orange-light rounded-xl border border-duo-orange-border">
                <Flame className="w-4 h-4 fill-current" />
                <span>{streak}</span>
              </div>
              <div className="flex items-center gap-1.5 text-duo-yellow-border font-black text-xs sm:text-sm px-3 py-1.5 bg-duo-yellow-light rounded-xl border border-duo-yellow-border">
                <Trophy className="w-4 h-4" />
                <span>{score}</span>
              </div>
            </div>
          </DuoCard>

          {/* Section 0: Teacher Authentication & Session Management */}
          <DuoCard elevated className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-duo-green" />
                <h3 className="text-lg font-black text-duo-dark">
                  Autentikasi & Manajemen Sesi Guru (Supabase Auth)
                </h3>
              </div>
              {user ? (
                <Badge variant="green">Terautentikasi</Badge>
              ) : (
                <Badge variant="gray">Siswa / Anonim</Badge>
              )}
            </div>

            {user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-duo-green-light/40 border-2 border-duo-green/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-duo-green text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {profile?.full_name
                      ? profile.full_name[0]?.toUpperCase()
                      : "G"}
                  </div>
                  <div>
                    <h4 className="font-black text-base text-duo-dark">
                      {profile?.full_name || user.email}
                    </h4>
                    <p className="text-xs font-semibold text-[#777777]">
                      {profile?.school_name || "EduPlay Teacher"} • {user.email}
                    </p>
                  </div>
                </div>

                <TactileButton
                  variant="red"
                  size="sm"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={() => {
                    playTap();
                    signOut();
                  }}
                >
                  Keluar (Sign Out)
                </TactileButton>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border-2 border-duo-gray rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-duo-dark">
                      Mode Presenter Kiosk Siswa (Tanpa Login)
                    </h4>
                    <p className="text-xs font-semibold text-[#777777] mt-0.5">
                      Siswa menjawab langsung di perangkat kelas. Guru dapat
                      masuk untuk membuat & mengedit kuis.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <TactileButton
                      variant="green"
                      size="sm"
                      onClick={() => {
                        playTap();
                        setAuthView("login");
                      }}
                    >
                      Buka Login
                    </TactileButton>
                    <TactileButton
                      variant="blue"
                      size="sm"
                      onClick={() => {
                        playTap();
                        setAuthView("register");
                      }}
                    >
                      Daftar Akun
                    </TactileButton>
                  </div>
                </div>
              </div>
            )}
          </DuoCard>

          {/* Section 1: Question Plugin Registry Architecture Showcase */}
          <DuoCard elevated className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Puzzle className="w-5 h-5 text-duo-blue" />
                <h3 className="text-lg font-black text-duo-dark">
                  Micro-Plugin Registry Architecture (PRD 6.1)
                </h3>
              </div>
              <Badge variant="blue">
                {registeredPlugins.length} Plugin Terdaftar
              </Badge>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#777777]">
              Setiap tipe soal mini-game diisolasi dalam satu modul plugin
              independen yang mengimplementasikan kontrak{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-bold text-duo-dark">
                QuestionPlugin&lt;TContent, TAnswer&gt;
              </code>
              .
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {registeredPlugins.map((plugin) => {
                const IconComp = plugin.icon;
                return (
                  <div
                    key={plugin.type}
                    className="flex items-center gap-3 p-3 bg-slate-50 border-2 border-duo-gray rounded-2xl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-duo-green-light border border-duo-green text-duo-green-border flex items-center justify-center shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-duo-dark truncate">
                        {plugin.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-400 truncate">
                        {plugin.description}
                      </p>
                    </div>
                    <Badge variant="green" className="text-[10px]">
                      Active
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400">
                  Uji Penanganan Error Registry (Unregistered Type):
                </span>
                <TactileButton
                  variant="outline"
                  size="sm"
                  onClick={handleTestUnregisteredPlugin}
                >
                  Coba Panggil 'unknown_type'
                </TactileButton>
              </div>
              {registryErrorMsg && (
                <div className="p-3 bg-duo-red-light border-2 border-duo-red rounded-xl text-xs font-bold text-duo-red-border">
                  {registryErrorMsg}
                </div>
              )}
            </div>
          </DuoCard>

          {/* Section 2: Sample Plugin Player Component Live Runner */}
          <DuoCard elevated className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Box className="w-5 h-5 text-duo-green" />
              <h3 className="text-lg font-black text-duo-dark">
                Live Runner: Sample Plugin ({sampleQuestionPlugin.type})
              </h3>
            </div>

            <SamplePlayerComp
              content={sampleQuestionPlugin.defaultContent}
              onAnswerSubmit={(ans) => {
                const validation = sampleQuestionPlugin.validateAnswer(
                  sampleQuestionPlugin.defaultContent,
                  ans,
                );
                handleSimulateAnswer(validation.isCorrect);
              }}
            />
          </DuoCard>

          {/* Section 2.5: ImageUploader with Auto WebP Compression */}
          <DuoCard elevated className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-duo-orange" />
                <h3 className="text-lg font-black text-duo-dark">
                  Media Uploader & Client-Side WebP Compressor (HTML5 Canvas)
                </h3>
              </div>
              <Badge variant="green">Auto 1200px • Quality 0.8</Badge>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#777777]">
              Gambar dioptimasi 100% di peramban pengguna sebelum push ke
              Supabase Storage (bucket{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-bold text-duo-dark">
                quiz-media
              </code>
              ).
            </p>

            <ImageUploader
              value={uploadedMediaUrl}
              onChange={(url) => setUploadedMediaUrl(url)}
              label="Unggah Gambar Kuis / Diagram Soal"
            />
          </DuoCard>

          {/* Section 3: Audio Feedback Pad Showcase */}
          <DuoCard elevated className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-duo-green" />
                <h3 className="text-lg font-black text-duo-dark">
                  Audio Feedback Pad (Duolingo SFX & Web Audio API Synthesis)
                </h3>
              </div>
              <TactileButton
                variant="outline"
                size="sm"
                icon={
                  isMuted ? (
                    <VolumeX className="w-4 h-4 text-duo-red" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-duo-green" />
                  )
                }
                onClick={() => toggleMute()}
                className="border-2 border-duo-gray"
              >
                {isMuted ? "Unmute" : "Mute"}
              </TactileButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <TactileButton
                variant="green"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                onClick={() => playCorrect()}
              >
                Correct
              </TactileButton>

              <TactileButton
                variant="red"
                size="sm"
                icon={<AlertCircle className="w-4 h-4" />}
                onClick={() => playWrong()}
              >
                Wrong
              </TactileButton>

              <TactileButton variant="blue" size="sm" onClick={() => playTap()}>
                Tap Click
              </TactileButton>

              <TactileButton
                variant="orange"
                size="sm"
                onClick={() => playPop()}
              >
                Bubble Pop
              </TactileButton>

              <TactileButton
                variant="yellow"
                size="sm"
                onClick={() => playBalloonPop()}
              >
                Balloon Pop
              </TactileButton>

              <TactileButton
                variant="green"
                size="sm"
                icon={<PartyPopper className="w-4 h-4" />}
                onClick={() => playVictory()}
              >
                Victory
              </TactileButton>
            </div>
          </DuoCard>

          {/* Section 4: DuoCard Container & TileToken Showcase */}
          <DuoCard
            elevated
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="flex items-center gap-2">
              <Badge variant="green">Komponen Atomik</Badge>
              <Badge variant="blue">TileToken.tsx</Badge>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-[#3C3C3C]">
              Ubin Huruf Interaktif (TileToken)
            </h2>
            <p className="text-sm font-semibold text-[#777777] max-w-md">
              Klik tiap balok huruf di bawah untuk mendengarkan audio pop dan
              menguji mikro-animasi pegas (*spring physics*).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-4">
              {tiles.map((tile, idx) => (
                <div key={tile.id} className="flex flex-col items-center gap-1">
                  <TileToken
                    label={tile.letter}
                    state={tile.state}
                    size="md"
                    onClick={() => cycleTileState(idx)}
                  />
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    {tile.state}
                  </span>
                </div>
              ))}
            </div>
          </DuoCard>

          {/* Section 5: TactileButton Showcase */}
          <DuoCard elevated className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-duo-blue" />
                <h3 className="text-lg font-black text-duo-dark">
                  TactileButton — 3D Bevel & Active Press
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setIsBtnLoading(!isBtnLoading);
                }}
                className="text-xs font-black text-duo-blue hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Toggle Loading: {isBtnLoading ? "ON" : "OFF"}
              </button>
            </div>

            {/* Varian Warna */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
                Varian Warna Duolingo:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <TactileButton
                  variant="green"
                  isLoading={isBtnLoading}
                  onClick={() => playTap()}
                >
                  Green
                </TactileButton>
                <TactileButton
                  variant="blue"
                  isLoading={isBtnLoading}
                  onClick={() => playTap()}
                >
                  Blue
                </TactileButton>
                <TactileButton
                  variant="orange"
                  isLoading={isBtnLoading}
                  onClick={() => playTap()}
                >
                  Orange
                </TactileButton>
                <TactileButton
                  variant="red"
                  isLoading={isBtnLoading}
                  onClick={() => playTap()}
                >
                  Red
                </TactileButton>
                <TactileButton
                  variant="yellow"
                  isLoading={isBtnLoading}
                  onClick={() => playTap()}
                >
                  Yellow
                </TactileButton>
                <TactileButton variant="gray" onClick={() => playTap()}>
                  Disabled
                </TactileButton>
              </div>
            </div>

            {/* Ukuran & Icon */}
            <div>
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
                Ukuran ('sm' | 'md' | 'lg' | 'icon') & Props Icon:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <TactileButton
                  variant="green"
                  size="sm"
                  onClick={() => playTap()}
                >
                  Small
                </TactileButton>
                <TactileButton
                  variant="blue"
                  size="md"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={() => playTap()}
                >
                  Medium Icon
                </TactileButton>
                <TactileButton
                  variant="orange"
                  size="lg"
                  icon={<Trophy className="w-5 h-5" />}
                  iconPosition="right"
                  onClick={() => playVictory()}
                >
                  Large Action
                </TactileButton>
                <TactileButton
                  variant="blue"
                  size="icon"
                  aria-label="Play Sound"
                  icon={<Volume2 className="w-5 h-5" />}
                  onClick={() => playPop()}
                />
                <TactileButton variant="green" size="md" disabled>
                  Disabled State
                </TactileButton>
              </div>
            </div>
          </DuoCard>
        </main>
      )}

      {/* Bottom Sheet Feedback */}
      <BottomSheetFeedback
        isOpen={feedbackState.isOpen}
        isCorrect={feedbackState.isCorrect}
        message={feedbackState.message}
        onAction={() => {
          playTap();
          setFeedbackState({ isOpen: false, isCorrect: false });
          setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        }}
      />

      {/* Auth Modal Dialog (Login & Register) */}
      <AuthModal
        isOpen={authView !== "none"}
        initialView={authView === "register" ? "register" : "login"}
        onClose={() => setAuthView("none")}
        onSuccess={() => {
          playVictory();
          setAuthView("none");
        }}
      />
    </div>
  );
}

export default App;
