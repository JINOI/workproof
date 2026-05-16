import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeLanguages, parseGeneratedSop } from './ai.ts'

const validPayload = {
  title: 'Forklift Safety',
  description: 'Daily forklift operation training.',
  summary: {
    sourceLanguage: 'ko',
    documentSummary: 'A short source summary.',
    cards: [
      {
        position: 2,
        title: 'Do not carry passengers',
        content: 'Only the operator may ride the forklift.',
        icon: 'prohibited',
      },
      {
        position: 1,
        title: 'Inspect first',
        content: 'Inspect the forklift before use.',
        icon: 'safety',
      },
    ],
    workSteps: ['Inspect the forklift.'],
    hazards: ['Collision risk.'],
    protectiveEquipment: ['Safety shoes.'],
    prohibitedActions: ['Do not carry passengers.'],
  },
  educationCards: [
    {
      language: 'ko',
      position: 1,
      title: 'Check first',
      content: 'Inspect the forklift before use.',
      icon: 'safety',
    },
    {
      language: 'ko',
      position: 2,
      title: 'No passengers',
      content: 'Do not carry passengers on a forklift.',
      icon: 'prohibited',
    },
  ],
  quizQuestions: [
    {
      language: 'ko',
      position: 1,
      type: 'multiple',
      prompt: 'What should you do first?',
      options: ['Drive immediately', 'Inspect the forklift'],
      correctAnswer: 1,
      explanation: 'Inspection comes first.',
    },
    {
      language: 'ko',
      position: 2,
      type: 'ox',
      prompt: 'Passengers are allowed on forklifts.',
      options: null,
      correctAnswer: false,
      explanation: 'Passengers are prohibited.',
    },
  ],
}

test('normalizes supported languages and falls back to Korean', () => {
  assert.deepEqual(normalizeLanguages(['vi', 'invalid', 'vi', 'ko']), ['vi', 'ko'])
  assert.deepEqual(normalizeLanguages(['invalid']), ['ko'])
})

test('parses fenced Gemini JSON and normalizes multiple-choice correct answers', () => {
  const parsed = parseGeneratedSop(`\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\``, ['ko'])

  assert.equal(parsed.title, 'Forklift Safety')
  assert.equal(parsed.summary.cards.length, 2)
  assert.equal(parsed.summary.cards[0].title, 'Inspect first')
  assert.equal(parsed.educationCards[0].position, 1)
  assert.equal(parsed.quizQuestions[0].correctAnswer, 'Inspect the forklift')
  assert.equal(parsed.quizQuestions[1].correctAnswer, false)
})

test('caps summary and translated education cards at ten cards', () => {
  const manyCards = Array.from({ length: 12 }, (_, index) => ({
    position: index + 1,
    title: `Card ${index + 1}`,
    content: `Content ${index + 1}`,
    icon: 'safety',
  }))
  const payload = {
    ...validPayload,
    summary: {
      ...validPayload.summary,
      cards: manyCards,
    },
    educationCards: manyCards.map((card) => ({
      ...card,
      language: 'ko',
    })),
  }

  const parsed = parseGeneratedSop(JSON.stringify(payload), ['ko'])

  assert.equal(parsed.summary.cards.length, 10)
  assert.equal(parsed.educationCards.length, 10)
})
