export const APP_CONFIG = {
  name: 'EduPlay',
  tagline: 'Interactive Classroom Quiz Studio',
  defaultQuestionTimer: 30, // seconds
  defaultPoints: 100,
  storageBuckets: {
    quizMedia: 'quiz-media',
  },
  soundKeys: {
    click: 'click',
    correct: 'correct',
    wrong: 'wrong',
    fanfare: 'fanfare',
  },
} as const;

