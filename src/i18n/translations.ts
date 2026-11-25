import { AppLanguage } from '../types';

export interface UIStrings {
  languageName: string;
  nativeLabel: string;
  navHome: string;
  navMaterials: string;
  navAudio: string;
  navSubtitles: string;
  navAiTutor: string;
  studentLogin: string;
  modeSelectTitle: string;
  visualModeTitle: string;
  visualModeDesc: string;
  hearingModeTitle: string;
  hearingModeDesc: string;
  balancedModeTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  selectModeBtn: string;
  browseMaterialsBtn: string;
  listenIntroBtn: string;
  workflowHeading: string;
  destinationsHeading: string;
  readPage: string;
  stopAudio: string;
  voiceNav: string;
  stopListening: string;
  askMicHeading: string;
  askMicSub: string;
  startMicAsk: string;
  stopMicSend: string;
  typeQuestionPlaceholder: string;
  askAiButton: string;
  hearAnswer: string;
  translateLessonBtn: string;
  translatingLabel: string;
  generateAiQuizBtn: string;
  quizHubTitle: string;
  materialsTitle: string;
  audioStudioTitle: string;
  progressTitle: string;
}

export const TRANSLATIONS: Record<AppLanguage, UIStrings> = {
  en: {
    languageName: 'English',
    nativeLabel: 'English',
    navHome: 'Home',
    navMaterials: 'Materials',
    navAudio: 'Audio',
    navSubtitles: 'Subtitles',
    navAiTutor: 'AI Tutor',
    studentLogin: 'Student Login',
    modeSelectTitle: 'Select Accessibility Mode',
    visualModeTitle: 'Visual Impairment Mode',
    visualModeDesc: 'Audio lessons, text-to-speech study reader, high contrast, large text, and voice navigation.',
    hearingModeTitle: 'Hearing Impairment Mode',
    hearingModeDesc: 'Video lessons with large subtitles, sign language interpreter, text transcripts, and visual diagrams.',
    balancedModeTitle: 'Balanced Multi-Sensory Mode',
    heroTitle: 'Accessible Education Tailored to Every Student’s Sensory Needs',
    heroSubtitle:
      'Access audio lessons, text-to-speech, and microphone AI Q&A in English, Kannada, or Hindi—alongside video subtitles, sign language videos, diagrams, and interactive quizzes.',
    selectModeBtn: 'Select Accessibility Mode',
    browseMaterialsBtn: 'Browse Learning Materials',
    listenIntroBtn: 'Listen to Introduction',
    workflowHeading: 'How This Learning Tool Works',
    destinationsHeading: 'Learning Destinations',
    readPage: 'Read Page',
    stopAudio: 'Stop Audio',
    voiceNav: 'Voice Nav',
    stopListening: 'Stop Listening',
    askMicHeading: 'Ask & Hear AI Voice Tutor',
    askMicSub: 'Press the microphone to ask any question aloud, or type below. The AI tutor responds in your selected language and reads the answer aloud.',
    startMicAsk: 'Tap Microphone & Ask',
    stopMicSend: 'Stop & Send Voice Question',
    typeQuestionPlaceholder: 'Ask any study question in English, Kannada, or Hindi...',
    askAiButton: 'Ask AI Tutor',
    hearAnswer: 'Hear Answer Aloud',
    translateLessonBtn: 'Translate Lesson',
    translatingLabel: 'Translating lesson...',
    generateAiQuizBtn: 'Generate AI Practice Questions',
    quizHubTitle: 'Quiz & Assessment Hub',
    materialsTitle: 'Learning Materials Library',
    audioStudioTitle: 'Audio Learning Studio',
    progressTitle: 'Learning Progress Tracker',
  },
  kn: {
    languageName: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    navHome: 'ಮುಖಪುಟ',
    navMaterials: 'ಪಠ್ಯಗಳು',
    navAudio: 'ಆಡಿಯೋ',
    navSubtitles: 'ಉಪಶೀರ್ಷಿಕೆ',
    navAiTutor: 'AI ಶಿಕ್ಷಕ',
    studentLogin: 'ವಿದ್ಯಾರ್ಥಿ ಲಾಗಿನ್',
    modeSelectTitle: 'ಪ್ರವೇಶಿಸುವಿಕೆ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    visualModeTitle: 'ದೃಷ್ಟಿ ದೋಷ ವಿಧಾನ',
    visualModeDesc: 'ಆಡಿಯೋ ಪಾಠಗಳು, ಪಠ್ಯದಿಂದ ಧ್ವನಿ, ಅಧಿಕ ಕಾಂಟ್ರಾಸ್ಟ್, ದೊಡ್ಡ ಅಕ್ಷರಗಳು ಮತ್ತು ಧ್ವನಿ ನ್ಯಾವಿಗೇಷನ್.',
    hearingModeTitle: 'ಶ್ರವಣ ದೋಷ ವಿಧಾನ',
    hearingModeDesc: 'ದೊಡ್ಡ ಉಪಶೀರ್ಷಿಕೆಗಳೊಂದಿಗೆ ವೀಡಿಯೊ ಪಾಠಗಳು, ಸಂಕೇತ ಭಾಷೆ, ಲಿಖಿತ ಪ್ರತಿ ಮತ್ತು ದೃಶ್ಯ ಚಿತ್ರಗಳು.',
    balancedModeTitle: 'ಸಮತೋಲಿತ ಬಹು-ಸಂವೇದಿ ವಿಧಾನ',
    heroTitle: 'ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿಯ ಅಗತ್ಯಗಳಿಗೆ ತಕ್ಕಂತೆ ಸುಲಭ ಕಲಿಕಾ ಸಾಧನ',
    heroSubtitle:
      'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಹಿಂದಿಯಲ್ಲಿ ಆಡಿಯೋ ಪಾಠಗಳು, ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ, ಮೈಕ್ರೋಫೋನ್ AI ಪ್ರಶ್ನೋತ್ತರ, ವೀಡಿಯೊ ಉಪಶೀರ್ಷಿಕೆಗಳು ಮತ್ತು ಸಂಕೇತ ಭಾಷೆಯೊಂದಿಗೆ ಕಲಿಯಿರಿ.',
    selectModeBtn: 'ಪ್ರವೇಶಿಸುವಿಕೆ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ',
    browseMaterialsBtn: 'ಕಲಿಕಾ ಸಾಮಗ್ರಿಗಳನ್ನು ನೋಡಿ',
    listenIntroBtn: 'ಪರಿಚಯವನ್ನು ಕೇಳಿ',
    workflowHeading: 'ಈ ಕಲಿಕಾ ಸಾಧನ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    destinationsHeading: 'ಕಲಿಕಾ ವಿಭಾಗಗಳು',
    readPage: 'ಪುಟವನ್ನು ಓದಿ',
    stopAudio: 'ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ',
    voiceNav: 'ಧ್ವನಿ ನ್ಯಾವ್',
    stopListening: 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
    askMicHeading: 'ಕೇಳಿ ಮತ್ತು ಆಲಿಸಿ — AI ಧ್ವನಿ ಶಿಕ್ಷಕ',
    askMicSub: 'ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ. AI ಶಿಕ್ಷಕರು ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಹಿಂದಿಯಲ್ಲಿ ಉತ್ತರಿಸಿ ಓದಿ ಹೇಳುತ್ತಾರೆ.',
    startMicAsk: 'ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ ಕೇಳಿ',
    stopMicSend: 'ನಿಲ್ಲಿಸಿ ಮತ್ತು ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ',
    typeQuestionPlaceholder: 'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಹಿಂದಿಯಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ...',
    askAiButton: 'AI ಶಿಕ್ಷಕರನ್ನು ಕೇಳಿ',
    hearAnswer: 'ಉತ್ತರವನ್ನು ಕೇಳಿ',
    translateLessonBtn: 'ಪಾಠವನ್ನು ಅನುವಾದಿಸಿ',
    translatingLabel: 'ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...',
    generateAiQuizBtn: 'AI ಅಭ್ಯಾಸ ಪ್ರಶ್ನೆಗಳನ್ನು ರಚಿಸಿ',
    quizHubTitle: 'ರಸಪ್ರಶ್ನೆ ಮತ್ತು ಮೌಲ್ಯಮಾಪನ ಕೇಂದ್ರ',
    materialsTitle: 'ಕಲಿಕಾ ಸಾಮಗ್ರಿಗಳ ಗ್ರಂಥಾಲಯ',
    audioStudioTitle: 'ಆಡಿಯೋ ಕಲಿಕಾ ಸ್ಟುಡಿಯೋ',
    progressTitle: 'ಕಲಿಕಾ ಪ್ರಗತಿ ಟ್ರ್ಯಾಕರ್',
  },
  hi: {
    languageName: 'Hindi',
    nativeLabel: 'हिन्दी',
    navHome: 'होम',
    navMaterials: 'पाठ्य सामग्री',
    navAudio: 'ऑडियो',
    navSubtitles: 'सबटाइटल',
    navAiTutor: 'AI शिक्षक',
    studentLogin: 'छात्र लॉगिन',
    modeSelectTitle: 'एक्सेसिबिलिटी मोड चुनें',
    visualModeTitle: 'दृष्टिबाधित मोड',
    visualModeDesc: 'ऑडियो पाठ, टेक्स्ट-टू-स्पीच, हाई कंट्रास्ट, बड़े अक्षर और वॉइस नेविगेशन।',
    hearingModeTitle: 'श्रवणबाधित मोड',
    hearingModeDesc: 'बड़े सबटाइटल वाले वीडियो पाठ, सांकेतिक भाषा, टेक्स्ट ट्रांसक्रिप्ट और विज़ुअल चित्र।',
    balancedModeTitle: 'संतुलित मल्टी-सेंसरी मोड',
    heroTitle: 'हर छात्र की ज़रूरतों के अनुसार सुलभ शिक्षा',
    heroSubtitle:
      'हिन्दी, कन्नड़ या अंग्रेज़ी में ऑडियो पाठ, टेक्स्ट-टू-स्पीच, माइक्रोफ़ोन AI प्रश्नोत्तर, वीडियो सबटाइटल, सांकेतिक भाषा और क्विज़ के साथ स्वतंत्र रूप से सीखें।',
    selectModeBtn: 'एक्सेसिबिलिटी मोड चुनें',
    browseMaterialsBtn: 'अध्ययन सामग्री देखें',
    listenIntroBtn: 'परिचय सुनें',
    workflowHeading: 'यह लर्निंग टूल कैसे काम करता है',
    destinationsHeading: 'सीखने के अनुभाग',
    readPage: 'पेज सुनें',
    stopAudio: 'ऑडियो रोकें',
    voiceNav: 'वॉइस नैव',
    stopListening: 'सुनना रोकें',
    askMicHeading: 'पूछें और सुनें — AI वॉइस शिक्षक',
    askMicSub: 'माइक्रोफ़ोन दबाकर बोलें या नीचे लिखें। AI शिक्षक आपकी चुनी हुई भाषा में उत्तर देगा और उसे पढ़कर सुनाएगा।',
    startMicAsk: 'माइक्रोफ़ोन से पूछें',
    stopMicSend: 'रोकें और प्रश्न भेजें',
    typeQuestionPlaceholder: 'हिन्दी, कन्नड़ या अंग्रेज़ी में प्रश्न पूछें...',
    askAiButton: 'AI शिक्षक से पूछें',
    hearAnswer: 'उत्तर सुनें',
    translateLessonBtn: 'पाठ का अनुवाद करें',
    translatingLabel: 'अनुवाद हो रहा है...',
    generateAiQuizBtn: 'AI अभ्यास प्रश्न बनाएँ',
    quizHubTitle: 'क्विज़ और मूल्यांकन केंद्र',
    materialsTitle: 'अध्ययन सामग्री पुस्तकालय',
    audioStudioTitle: 'ऑडियो लर्निंग स्टूडियो',
    progressTitle: 'सीखने की प्रगति ट्रैकर',
  },
};
