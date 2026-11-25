export type SubjectId = 'languages' | 'science' | 'math' | 'sign' | 'astronomy';

export type ContrastMode = 'standard' | 'hc-dark' | 'hc-light';

export type FontScale = 14 | 16 | 19 | 22;

export type CaptionSize = 'medium' | 'large' | 'xlarge';

export type AppLanguage = 'en' | 'kn' | 'hi';

export type AccessibilityProfileMode = 'visual' | 'hearing' | 'balanced';

export type NavView =
  | 'home'
  | 'login'
  | 'mode-select'
  | 'materials'
  | 'audio-learning'
  | 'lesson'
  | 'sign-studio'
  | 'ai-tutor'
  | 'quiz-hub'
  | 'progress';

export interface StudentProfile {
  name: string;
  studentId: string;
  gradeLevel: string;
  preferredMode: AccessibilityProfileMode;
  preferredLanguage: AppLanguage;
  signedInAt: string;
}

export type SignPoseId =
  | 'welcome'
  | 'sunlight'
  | 'water'
  | 'leaf'
  | 'oxygen'
  | 'soundwave'
  | 'ear'
  | 'fraction'
  | 'angle'
  | 'circle'
  | 'orbit'
  | 'earth'
  | 'cloud'
  | 'hello'
  | 'thankyou'
  | 'question'
  | 'learn'
  | 'happy'
  | 'understand'
  | 'yes'
  | 'no'
  | 'help';

export type VisualSceneId =
  | 'lang-kannada-vowels'
  | 'lang-kannada-phrases'
  | 'lang-english-grammar'
  | 'lang-english-reading'
  | 'lang-hindi-vowels'
  | 'lang-hindi-phrases'
  | 'photosynthesis-light'
  | 'photosynthesis-roots'
  | 'photosynthesis-chloroplast'
  | 'photosynthesis-oxygen'
  | 'sound-vibration'
  | 'sound-waves'
  | 'sound-ear'
  | 'sound-pitch'
  | 'fraction-whole'
  | 'fraction-halves'
  | 'fraction-quarters'
  | 'fraction-compare'
  | 'angle-acute'
  | 'angle-right'
  | 'angle-obtuse'
  | 'angle-circle'
  | 'sign-greeting'
  | 'sign-alphabet'
  | 'sign-expression'
  | 'sign-conversation'
  | 'solar-sun'
  | 'solar-inner'
  | 'solar-earth'
  | 'solar-orbit'
  | 'water-evaporation'
  | 'water-condensation'
  | 'water-precipitation'
  | 'water-collection';

export interface LessonCue {
  id: string;
  startSec: number;
  endSec: number;
  speaker: string;
  caption: string;
  signGloss: string;
  signPose: SignPoseId;
  signInstruction: string;
  visualScene: VisualSceneId;
  visualAltText: string;
}

export interface ReadingSection {
  id: string;
  heading: string;
  body: string;
  keyTakeaway: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  subjectId: SubjectId;
  numberLabel: string;
  title: string;
  subtitle: string;
  durationSec: number;
  level: string;
  objectives: string[];
  cues: LessonCue[];
  readingSections: ReadingSection[];
  quiz: QuizQuestion[];
}

export interface Subject {
  id: SubjectId;
  title: string;
  subtitle: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  lessonCount: number;
  accentLabel: string;
}

export interface SignDictionaryItem {
  id: string;
  word: string;
  category: 'Everyday' | 'Classroom' | 'Science & Math' | 'Emotions';
  pose: SignPoseId;
  handshape: string;
  movement: string;
  location: string;
  exampleSentence: string;
}

export interface AccessibilitySettings {
  language: AppLanguage;
  profileMode: AccessibilityProfileMode;
  contrastMode: ContrastMode;
  fontSize: FontScale;
  extraSpacing: boolean;
  captionsEnabled: boolean;
  captionSize: CaptionSize;
  signInterpreterEnabled: boolean;
  ttsEnabled: boolean;
  ttsRate: number;
  ttsVoiceURI: string;
  reducedMotion: boolean;
}

export interface LessonProgressRecord {
  completed: boolean;
  completedAt?: string;
  lastPositionSec: number;
  bestQuizScore?: number;
  quizAttempts: number;
}

export interface ProgressState {
  lessons: Record<string, LessonProgressRecord>;
  totalMinutesSpent: number;
  lastVisitedLessonId?: string;
  activityLog: {
    id: string;
    label: string;
    detail: string;
    timestamp: string;
  }[];
}
