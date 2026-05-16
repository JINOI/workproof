import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeLanguages, parseGeneratedSop } from './ai.ts'

const validPayload = {
  title: 'Forklift Safety',
  description: 'Daily forklift operation training.',
  summary: {
    workSteps: ['Inspect the forklift.'],
    hazards: ['Collision risk.'],
    protectiveEquipment: ['Safety shoes.'],
    prohibitedActions: ['Do not carry passengers.'],
  },
  educationCards: [
    {
      language: 'ko',
      title: 'Check first',
      content: 'Inspect the forklift before use.',
      icon: 'safety',
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
  assert.equal(parsed.quizQuestions[0].correctAnswer, 'Inspect the forklift')
  assert.equal(parsed.quizQuestions[1].correctAnswer, false)
})
