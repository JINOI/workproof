export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어', promptName: 'Korean' },
  { code: 'vi', label: 'Tiếng Việt', promptName: 'Vietnamese' },
  { code: 'zh', label: '中文', promptName: 'Simplified Chinese' },
  { code: 'th', label: 'ไทย', promptName: 'Thai' },
] as const

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((language) => language.code)
