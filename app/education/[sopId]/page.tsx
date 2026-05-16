'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Ban, Check, ChevronRight, HardHat, Heart, Shield, ShieldCheck, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import type { Json } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

type Step = 'info' | 'education' | 'quiz' | 'result' | 'failed'

type EducationCardPayload = {
  title: string
  content: string
  icon: 'warning' | 'safety' | 'prohibited' | 'equipment'
}

type QuizQuestionPayload = {
  id: string
  position: number
  type: 'ox' | 'multiple'
  prompt: string
  options: Json | null
  correct_answer: Json
  explanation: string | null
}

type EducationPayload = {
  id: string
  title: string
  description: string | null
  education_cards: Json
  languages: string[]
  quiz_questions: QuizQuestionPayload[]
}

type AnswerState = {
  questionId: string
  selectedAnswer: Json
  isCorrect: boolean
}

function isEducationCard(value: Json): value is EducationCardPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return (
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    (value.icon === 'warning' || value.icon === 'safety' || value.icon === 'prohibited' || value.icon === 'equipment')
  )
}

function parseEducationCards(value: Json): EducationCardPayload[] {
  if (!Array.isArray(value)) return []
  return value.filter(isEducationCard)
}

function parseOptions(value: Json | null): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((option): option is string => typeof option === 'string')
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]]
  }
  return shuffled
}

function getCardIcon(iconType: EducationCardPayload['icon']) {
  switch (iconType) {
    case 'safety':
      return ShieldCheck
    case 'warning':
      return AlertTriangle
    case 'prohibited':
      return Ban
    case 'equipment':
      return HardHat
    default:
      return Shield
  }
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60
  return `${minutes}분 ${restSeconds}초`
}

export default function EducationPage() {
  const params = useParams<{ sopId: string }>()
  const [education, setEducation] = useState<EducationPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [step, setStep] = useState<Step>('info')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [canProceed, setCanProceed] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [answers, setAnswers] = useState<AnswerState[]>([])
  const [attempts, setAttempts] = useState(1)
  const [startTime, setStartTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<Json | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lives, setLives] = useState(3)
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestionPayload[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEducation() {
      try {
        const response = await fetch(`/api/education/${params.sopId}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('교육 정보를 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as { education: EducationPayload }

        if (isMounted) {
          setEducation(payload.education)
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : '교육 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadEducation()

    return () => {
      isMounted = false
    }
  }, [params.sopId])

  const educationCards = useMemo(() => parseEducationCards(education?.education_cards ?? []), [education])

  const initQuiz = useCallback(() => {
    setShuffledQuestions(shuffleArray(education?.quiz_questions ?? []))
    setCurrentQuestionIndex(0)
    setAnswers([])
    setSelectedAnswer(null)
    setShowFeedback(false)
    setStartTime(Date.now())
    setSubmitError(null)
  }, [education])

  useEffect(() => {
    if (step !== 'education') return

    setCanProceed(false)
    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanProceed(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [step, currentCardIndex])

  useEffect(() => {
    if (step !== 'quiz' || startTime <= 0) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [step, startTime])

  const handleStartEducation = () => {
    if (!name || !birthDate || !education) return

    if (educationCards.length === 0) {
      initQuiz()
      setStep('quiz')
      return
    }

    setStep('education')
  }

  const handleNextCard = () => {
    if (currentCardIndex < educationCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1)
      return
    }

    initQuiz()
    setStep('quiz')
  }

  const handleSelectAnswer = (answer: Json) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const currentQuestion = shuffledQuestions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    setShowFeedback(true)
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
      },
    ])

    if (!isCorrect) {
      setLives((prev) => prev - 1)
    }
  }

  const submitResult = async (nextAnswers: AnswerState[]) => {
    if (!education) return

    try {
      const finalElapsedTime = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(finalElapsedTime)

      const response = await fetch('/api/education/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sopId: education.id,
          workerName: name,
          workerBirthDate: birthDate,
          language: education.languages[0] ?? 'ko',
          attempts,
          elapsedSeconds: finalElapsedTime,
          answers: nextAnswers,
        }),
      })

      if (!response.ok) {
        throw new Error('이수 결과를 저장하지 못했습니다.')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '이수 결과를 저장하지 못했습니다.')
    }
  }

  const handleNextQuestion = async () => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedAnswer: selectedAnswer as Json,
        isCorrect,
      },
    ]

    if (!isCorrect && lives <= 1) {
      await submitResult(nextAnswers)
      setStep('failed')
      return
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
      return
    }

    const wrongAnswers = nextAnswers.filter((answer) => !answer.isCorrect).length
    await submitResult(nextAnswers)
    setStep(wrongAnswers > 0 ? 'failed' : 'result')
  }

  const handleRetry = () => {
    setAttempts((prev) => prev + 1)
    setLives(3)
    initQuiz()
    setStep('quiz')
  }

  const currentCard = educationCards[currentCardIndex]
  const currentQuestion = shuffledQuestions[currentQuestionIndex]
  const progress =
    step === 'education'
      ? ((currentCardIndex + 1) / Math.max(educationCards.length, 1)) * 100
      : ((currentQuestionIndex + 1) / Math.max(shuffledQuestions.length, 1)) * 100

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] text-sm text-[#6b7684]">교육 정보를 불러오는 중입니다...</div>
  }

  if (loadError || !education) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <h1 className="mb-2 text-xl font-bold text-[#333d4b]">교육을 찾을 수 없습니다.</h1>
            <p className="text-sm text-[#6b7684]">{loadError ?? '유효하지 않은 교육 링크입니다.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb]">
      {step !== 'info' && (
        <header className="border-b border-[#e5e8eb] bg-white px-4 py-3">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <button type="button" onClick={() => (step === 'education' ? setStep('info') : null)} className="text-[#6b7684]">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="mx-4 flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            {step === 'quiz' && (
              <div className="flex items-center gap-1">
                <Heart className={cn('h-5 w-5', lives >= 1 ? 'fill-[#f04452] text-[#f04452]' : 'text-[#d1d6db]')} />
                <span className="text-sm text-[#333d4b]">{lives}</span>
              </div>
            )}
            {step === 'education' && <span className="text-sm text-[#6b7684]">{currentCardIndex + 1}/{educationCards.length}</span>}
          </div>
        </header>
      )}

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {step === 'info' && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f3ff]">
                    <HardHat className="h-8 w-8 text-[#3182f6]" />
                  </div>
                  <h1 className="mb-2 text-xl font-bold text-[#333d4b]">{education.title}</h1>
                  <p className="text-sm text-[#6b7684]">{education.description ?? '교육 이수를 위해 정보를 입력하세요.'}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#333d4b]">
                      이름
                    </Label>
                    <Input id="name" placeholder="이름 입력" value={name} onChange={(event) => setName(event.target.value)} className="h-12 border-[#e5e8eb]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className="text-[#333d4b]">
                      생년월일
                    </Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={birthDate}
                      onChange={(event) => setBirthDate(event.target.value)}
                      className="h-12 border-[#e5e8eb]"
                    />
                  </div>
                  <Button onClick={handleStartEducation} disabled={!name || !birthDate} className="mt-4 h-12 w-full bg-[#3182f6] text-white hover:bg-[#1b64da]">
                    교육 시작
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'education' && currentCard && (
            <div className="space-y-6">
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className={cn('p-8 text-center', currentCard.icon === 'prohibited' ? 'bg-[#fff0f0]' : 'bg-[#e8f3ff]')}>
                  {(() => {
                    const IconComponent = getCardIcon(currentCard.icon)
                    return (
                      <div className={cn('mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full', currentCard.icon === 'prohibited' ? 'bg-[#f04452]' : 'bg-white')}>
                        <IconComponent className={cn('h-10 w-10', currentCard.icon === 'prohibited' ? 'text-white' : 'text-[#3182f6]')} />
                      </div>
                    )
                  })()}
                  <h2 className={cn('mb-2 text-xl font-bold', currentCard.icon === 'prohibited' ? 'text-[#f04452]' : 'text-[#333d4b]')}>{currentCard.title}</h2>
                </div>
                <CardContent className="p-6">
                  <p className="text-center leading-relaxed text-[#6b7684]">{currentCard.content}</p>
                </CardContent>
              </Card>

              <Button onClick={handleNextCard} disabled={!canProceed} className="h-12 w-full bg-[#3182f6] text-white hover:bg-[#1b64da] disabled:bg-[#d1d6db]">
                {canProceed ? (
                  <>
                    다음으로
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  `${countdown}초 후 진행`
                )}
              </Button>
            </div>
          )}

          {step === 'quiz' && currentQuestion && (
            <div className="space-y-6">
              <div className="mb-2 text-center">
                <span className="text-sm font-medium text-[#3182f6]">{currentQuestion.type === 'ox' ? 'O / X 문제' : '객관식 문제'}</span>
                <h2 className="mt-2 px-4 text-lg font-bold text-[#333d4b]">{currentQuestion.prompt}</h2>
              </div>

              {currentQuestion.type === 'ox' ? (
                <div className="grid grid-cols-2 gap-4">
                  {[false, true].map((answer) => {
                    const isSelected = selectedAnswer === answer
                    const isCorrect = currentQuestion.correct_answer === answer

                    return (
                      <button
                        key={answer.toString()}
                        type="button"
                        onClick={() => handleSelectAnswer(answer)}
                        disabled={showFeedback}
                        className={cn(
                          'flex h-24 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all',
                          showFeedback && isCorrect && 'border-[#00d082] bg-[#e6f9f1] text-[#00d082]',
                          showFeedback && isSelected && !isCorrect && 'border-[#f04452] bg-[#fff0f0] text-[#f04452]',
                          showFeedback && !isSelected && !isCorrect && 'border-[#e5e8eb] text-[#d1d6db]',
                          !showFeedback && isSelected && 'border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]',
                          !showFeedback && !isSelected && 'border-[#e5e8eb] text-[#333d4b] hover:border-[#3182f6]',
                        )}
                      >
                        {answer ? 'O' : 'X'}
                        {showFeedback && isSelected && isCorrect && <Check className="ml-2 h-6 w-6" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {parseOptions(currentQuestion.options).map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrect = currentQuestion.correct_answer === index

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectAnswer(index)}
                        disabled={showFeedback}
                        className={cn(
                          'w-full rounded-xl border-2 p-4 text-left transition-all',
                          showFeedback && isCorrect && 'border-[#00d082] bg-[#e6f9f1] text-[#00d082]',
                          showFeedback && isSelected && !isCorrect && 'border-[#f04452] bg-[#fff0f0] text-[#f04452]',
                          showFeedback && !isSelected && !isCorrect && 'border-[#e5e8eb] text-[#d1d6db]',
                          !showFeedback && isSelected && 'border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]',
                          !showFeedback && !isSelected && 'border-[#e5e8eb] text-[#333d4b] hover:border-[#3182f6]',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showFeedback && isCorrect && <Check className="h-5 w-5" />}
                          {showFeedback && isSelected && !isCorrect && <X className="h-5 w-5" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {showFeedback && (
                <div className={cn('flex items-center gap-3 rounded-xl p-4', selectedAnswer === currentQuestion.correct_answer ? 'bg-[#e6f9f1]' : 'bg-[#fff0f0]')}>
                  {selectedAnswer === currentQuestion.correct_answer ? (
                    <>
                      <Check className="h-5 w-5 text-[#00d082]" />
                      <span className="font-medium text-[#00d082]">정답입니다.</span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-[#f04452]" />
                      <span className="font-medium text-[#f04452]">오답입니다. {currentQuestion.explanation}</span>
                    </>
                  )}
                </div>
              )}

              {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}

              {!showFeedback ? (
                <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null} className="h-12 w-full bg-[#3182f6] text-white hover:bg-[#1b64da] disabled:bg-[#d1d6db]">
                  제출
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="h-12 w-full bg-[#3182f6] text-white hover:bg-[#1b64da]">
                  계속
                </Button>
              )}
            </div>
          )}

          {step === 'failed' && (
            <Card className="border-0 text-center shadow-lg">
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f0]">
                  <X className="h-10 w-10 text-[#f04452]" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-[#333d4b]">교육을 통과하지 못했습니다.</h2>
                <p className="mb-6 text-[#6b7684]">틀린 문항을 다시 확인한 뒤 재시도하세요.</p>
                <Button onClick={handleRetry} className="h-12 w-full bg-[#f04452] text-white hover:bg-[#d63841]">
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'result' && (
            <Card className="border-0 text-center shadow-lg">
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f9f1]">
                  <Check className="h-10 w-10 text-[#00d082]" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-[#333d4b]">교육을 완료했습니다.</h2>
                <p className="mb-6 text-[#6b7684]">이수 결과가 저장되었습니다.</p>

                <div className="mb-6 space-y-3 rounded-xl bg-[#f2f4f6] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7684]">시도 횟수</span>
                    <span className="font-medium text-[#333d4b]">{attempts}회</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7684]">소요 시간</span>
                    <span className="font-medium text-[#333d4b]">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7684]">상태</span>
                    <span className={cn('font-medium', attempts <= 3 ? 'text-[#00d082]' : 'text-[#b88600]')}>{attempts <= 3 ? '안전' : '주의'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
