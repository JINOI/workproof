'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Shield, HardHat, AlertTriangle, Ban, ShieldCheck, ArrowLeft, Heart, ChevronRight, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { mockEducationCards, mockQuizQuestions, type QuizQuestion, type EducationCard } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Step = 'info' | 'education' | 'quiz' | 'result' | 'failed'

interface AnswerState {
  questionId: number
  selectedAnswer: number | boolean | null
  isCorrect: boolean | null
}

export default function EducationPage() {
  const params = useParams()
  const router = useRouter()
  
  // User info
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  
  // Flow control
  const [step, setStep] = useState<Step>('info')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [canProceed, setCanProceed] = useState(false)
  const [countdown, setCountdown] = useState(5)
  
  // Quiz state
  const [answers, setAnswers] = useState<AnswerState[]>([])
  const [attempts, setAttempts] = useState(1)
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lives, setLives] = useState(3)
  
  // Shuffle questions for retry
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const initQuiz = useCallback(() => {
    setShuffledQuestions(shuffleArray(mockQuizQuestions))
    setCurrentQuestionIndex(0)
    setAnswers([])
    setSelectedAnswer(null)
    setShowFeedback(false)
    setStartTime(Date.now())
  }, [])

  // 5 second delay for education cards
  useEffect(() => {
    if (step === 'education') {
      setCanProceed(false)
      setCountdown(5)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanProceed(true)
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, currentCardIndex])

  // Track elapsed time during quiz
  useEffect(() => {
    if (step === 'quiz' && startTime > 0) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, startTime])

  const handleStartEducation = () => {
    if (name && birthDate) {
      setStep('education')
    }
  }

  const handleNextCard = () => {
    if (currentCardIndex < mockEducationCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
    } else {
      initQuiz()
      setStep('quiz')
    }
  }

  const handleSelectAnswer = (answer: number | boolean) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    const currentQuestion = shuffledQuestions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    
    setShowFeedback(true)
    
    const newAnswer: AnswerState = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect
    }
    setAnswers(prev => [...prev, newAnswer])

    if (!isCorrect) {
      setLives(prev => prev - 1)
    }
  }

  const handleNextQuestion = () => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    if (!isCorrect && lives <= 1) {
      // Failed - no more lives
      setStep('failed')
      return
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      // All questions answered - check if passed
      const wrongAnswers = answers.filter(a => !a.isCorrect).length + (!isCorrect ? 1 : 0)
      if (wrongAnswers > 0) {
        setStep('failed')
      } else {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
        setStep('result')
      }
    }
  }

  const handleRetry = () => {
    setAttempts(prev => prev + 1)
    setLives(3)
    initQuiz()
    setStep('quiz')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  const getCardIcon = (iconType: EducationCard['icon']) => {
    switch (iconType) {
      case 'safety': return ShieldCheck
      case 'warning': return AlertTriangle
      case 'prohibited': return Ban
      case 'equipment': return HardHat
      default: return Shield
    }
  }

  const currentCard = mockEducationCards[currentCardIndex]
  const currentQuestion = shuffledQuestions[currentQuestionIndex]
  const progress = step === 'education' 
    ? ((currentCardIndex + 1) / mockEducationCards.length) * 100
    : ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      {/* Header */}
      {step !== 'info' && (
        <header className="bg-white border-b border-[#e5e8eb] px-4 py-3">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button 
              onClick={() => step === 'education' ? setStep('info') : null}
              className="text-[#6b7684]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 mx-4">
              <Progress value={progress} className="h-2" />
            </div>
            {step === 'quiz' && (
              <div className="flex items-center gap-1">
                <Heart className={cn("h-5 w-5", lives >= 1 ? "text-[#f04452] fill-[#f04452]" : "text-[#d1d6db]")} />
                <span className="text-sm text-[#333d4b]">{lives}</span>
              </div>
            )}
            {step === 'education' && (
              <span className="text-sm text-[#6b7684]">
                {currentCardIndex + 1}/{mockEducationCards.length}
              </span>
            )}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Step: Info Input */}
          {step === 'info' && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-[#e8f3ff] mx-auto flex items-center justify-center mb-4">
                    <HardHat className="h-8 w-8 text-[#3182f6]" />
                  </div>
                  <h1 className="text-xl font-bold text-[#333d4b] mb-2">안전 교육을 시작합니다</h1>
                  <p className="text-[#6b7684] text-sm">본인 확인을 위해 정보를 입력해주세요</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#333d4b]">이름 (Name)</Label>
                    <Input
                      id="name"
                      placeholder="김민준"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 border-[#e5e8eb]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className="text-[#333d4b]">생년월일 (Birth)</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-12 border-[#e5e8eb]"
                    />
                  </div>
                  <Button
                    onClick={handleStartEducation}
                    disabled={!name || !birthDate}
                    className="w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white mt-4"
                  >
                    시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Education Cards */}
          {step === 'education' && currentCard && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className={cn(
                  "p-8 text-center",
                  currentCard.icon === 'prohibited' ? "bg-[#fff0f0]" : "bg-[#e8f3ff]"
                )}>
                  {(() => {
                    const IconComponent = getCardIcon(currentCard.icon)
                    return (
                      <div className={cn(
                        "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4",
                        currentCard.icon === 'prohibited' ? "bg-[#f04452]" : "bg-white"
                      )}>
                        <IconComponent className={cn(
                          "h-10 w-10",
                          currentCard.icon === 'prohibited' ? "text-white" : "text-[#3182f6]"
                        )} />
                      </div>
                    )
                  })()}
                  <h2 className={cn(
                    "text-xl font-bold mb-2",
                    currentCard.icon === 'prohibited' ? "text-[#f04452]" : "text-[#333d4b]"
                  )}>
                    {currentCard.title}
                  </h2>
                </div>
                <CardContent className="p-6">
                  <p className="text-[#6b7684] leading-relaxed text-center">
                    {currentCard.content}
                  </p>
                </CardContent>
              </Card>

              <Button
                onClick={handleNextCard}
                disabled={!canProceed}
                className="w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white disabled:bg-[#d1d6db]"
              >
                {canProceed ? (
                  <>
                    다음 학습하기
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  `${countdown}초 후 다음으로`
                )}
              </Button>
            </div>
          )}

          {/* Step: Quiz */}
          {step === 'quiz' && currentQuestion && (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <span className="text-sm text-[#3182f6] font-medium">O / X 문제</span>
                <h2 className="text-lg font-bold text-[#333d4b] mt-2 px-4">
                  {currentQuestion.question}
                </h2>
              </div>

              {currentQuestion.type === 'ox' ? (
                <div className="grid grid-cols-2 gap-4">
                  {[false, true].map((answer) => {
                    const isSelected = selectedAnswer === answer
                    const isCorrect = currentQuestion.correctAnswer === answer
                    
                    let buttonClass = "h-24 text-2xl font-bold border-2 transition-all "
                    if (showFeedback) {
                      if (isCorrect) {
                        buttonClass += "border-[#00d082] bg-[#e6f9f1] text-[#00d082]"
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-[#f04452] bg-[#fff0f0] text-[#f04452]"
                      } else {
                        buttonClass += "border-[#e5e8eb] text-[#d1d6db]"
                      }
                    } else if (isSelected) {
                      buttonClass += "border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]"
                    } else {
                      buttonClass += "border-[#e5e8eb] hover:border-[#3182f6] text-[#333d4b]"
                    }

                    return (
                      <button
                        key={answer.toString()}
                        onClick={() => handleSelectAnswer(answer)}
                        disabled={showFeedback}
                        className={cn("rounded-xl flex items-center justify-center", buttonClass)}
                      >
                        {answer ? 'O' : 'X'}
                        {showFeedback && isSelected && isCorrect && (
                          <Check className="h-6 w-6 ml-2" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrect = currentQuestion.correctAnswer === index
                    
                    let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all "
                    if (showFeedback) {
                      if (isCorrect) {
                        buttonClass += "border-[#00d082] bg-[#e6f9f1] text-[#00d082]"
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-[#f04452] bg-[#fff0f0] text-[#f04452]"
                      } else {
                        buttonClass += "border-[#e5e8eb] text-[#d1d6db]"
                      }
                    } else if (isSelected) {
                      buttonClass += "border-[#3182f6] bg-[#e8f3ff] text-[#3182f6]"
                    } else {
                      buttonClass += "border-[#e5e8eb] hover:border-[#3182f6] text-[#333d4b]"
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={showFeedback}
                        className={buttonClass}
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

              {/* Feedback */}
              {showFeedback && (
                <div className={cn(
                  "p-4 rounded-xl flex items-center gap-3",
                  selectedAnswer === currentQuestion.correctAnswer 
                    ? "bg-[#e6f9f1]" 
                    : "bg-[#fff0f0]"
                )}>
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    <>
                      <Check className="h-5 w-5 text-[#00d082]" />
                      <span className="text-[#00d082] font-medium">정답입니다!</span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-[#f04452]" />
                      <span className="text-[#f04452] font-medium">오답입니다. {currentQuestion.explanation}</span>
                    </>
                  )}
                </div>
              )}

              {!showFeedback ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white disabled:bg-[#d1d6db]"
                >
                  확인
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white"
                >
                  계속
                </Button>
              )}

              <p className="text-xs text-center text-[#8b95a1]">
                이 응답 내용, 한 문제라도 틀리면 퀴즈처리되어 다시 해야 합니다
              </p>
            </div>
          )}

          {/* Step: Failed */}
          {step === 'failed' && (
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 rounded-full bg-[#fff0f0] mx-auto flex items-center justify-center mb-6">
                  <X className="h-10 w-10 text-[#f04452]" />
                </div>
                <h2 className="text-xl font-bold text-[#333d4b] mb-2">오답이 있습니다</h2>
                <p className="text-[#6b7684] mb-2">
                  틀린 문제를 위해 처음부터 다시 풀어주세요.<br />
                  문제의 복기 단계별시민다시 확인해주세요.
                </p>
                <p className="text-sm text-[#8b95a1] mb-6">
                  현재 시도: <span className="font-medium text-[#333d4b]">{attempts}회</span>
                </p>
                <Button
                  onClick={handleRetry}
                  className="w-full h-12 bg-[#f04452] hover:bg-[#d63841] text-white"
                >
                  다시 풀기
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step: Success Result */}
          {step === 'result' && (
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 rounded-full bg-[#e6f9f1] mx-auto flex items-center justify-center mb-6">
                  <Check className="h-10 w-10 text-[#00d082]" />
                </div>
                <h2 className="text-xl font-bold text-[#333d4b] mb-2">수고하셨습니다!</h2>
                <p className="text-[#6b7684] mb-6">
                  안전 교육을 성공적으로 완료했습니다.
                </p>
                
                <div className="bg-[#f2f4f6] rounded-xl p-4 space-y-3 mb-6">
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
                    <span className={cn(
                      "font-medium",
                      attempts <= 3 ? "text-[#00d082]" : "text-[#b88600]"
                    )}>
                      {attempts <= 3 ? '안전' : '경고'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#8b95a1]">
                  이 결과는 관리자에게 자동 전송됩니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
