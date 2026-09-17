/**
 * Browser-native Speech Recognition utility for Pravedā adaptive voice input.
 *
 * Uses window.SpeechRecognition || window.webkitSpeechRecognition.
 * No external APIs, no audio uploads, no paid services.
 */

export const isSpeechRecognitionSupported = () => {
  try {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  } catch {
    return false;
  }
};

const LOCALE_MAP = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN'
};

const FALLBACK_MAP = {
  en: 'en',
  te: 'te',
  hi: 'hi'
};

/**
 * Resolve the recognition locale for the patient's selected language.
 * Primary: en-IN / te-IN / hi-IN. Fallback handled by caller if not supported.
 */
export const getSpeechRecognitionLocale = (language = 'en') => {
  return LOCALE_MAP[language] || 'en-IN';
};

export const getSpeechRecognitionFallbackLocale = (language = 'en') => {
  return FALLBACK_MAP[language] || 'en';
};

const getRecognitionConstructor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * Create a configured SpeechRecognition instance.
 * Returns null when unsupported.
 */
export const createSpeechRecognition = ({ language = 'en', interim = true, continuous = false } = {}) => {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = getSpeechRecognitionLocale(language);
  recognition.interimResults = interim;
  recognition.continuous = continuous;
  recognition.maxAlternatives = 1;
  return recognition;
};
