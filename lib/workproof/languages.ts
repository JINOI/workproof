export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어', promptName: 'Korean' },
  { code: 'vi', label: '베트남어', promptName: 'Vietnamese' },
  { code: 'zh', label: '중국어', promptName: 'Simplified Chinese' },
  { code: 'th', label: '태국어', promptName: 'Thai' },
] as const

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((language) => language.code)
