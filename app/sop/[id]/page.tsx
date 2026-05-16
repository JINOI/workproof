'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, BookOpenCheck, CheckCircle, Clock, Download, Share2 } from 'lucide-react'

import { CompanyQrDialogButton } from '@/components/dashboard/company-qr'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { type WorkerDetail, WorkerDetailModal } from '@/components/dashboard/worker-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Json } from '@/lib/supabase/database.types'
import { SUPPORTED_LANGUAGES } from '@/lib/workproof/languages'

type EducationLog = {
  id: string
  worker_name: string
  worker_birth_date: string
  status: 'pending' | 'safe' | 'warning' | 'failed'
  attempts: number
  completed_at: string | null
  wrong_question_ids: string[]
}

type SummaryCard = {
  position: number
  title: string
  content: string
  icon?: string
}

type AiSummary = {
  sourceLanguage: string | null
  documentSummary: string | null
  cards: SummaryCard[]
  workSteps: string[]
  hazards: string[]
  protectiveEquipment: string[]
  prohibitedActions: string[]
}

type QuizQuestion = {
  id: string
  language: string
  position: number
  type: 'ox' | 'multiple'
  prompt: string
  options: Json | null
  correct_answer: Json
  explanation: string | null
}

type ApiSopDetail = {
  id: string
  title: string
  description: string | null
  created_at: string
  ai_summary: Json
  education_cards: Json
  languages: string[]
  public_token: string
  status: 'draft' | 'active' | 'archived'
  quiz_questions: QuizQuestion[]
  education_logs: EducationLog[]
}

function formatDateTime(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function toWorkerDetail(log: EducationLog): WorkerDetail {
  return {
    id: log.id,
    name: log.worker_name,
    birthDate: log.worker_birth_date,
    status: log.status,
    attempts: log.attempts,
    completedAt: formatDateTime(log.completed_at),
    wrongAnswers: log.wrong_question_ids,
  }
}

function StatusBadge({ status }: { status: WorkerDetail['status'] }) {
  const config = {
    safe: { label: '안전', className: 'bg-[#e6f9f1] text-[#00d082] hover:bg-[#e6f9f1]' },
    warning: { label: '주의', className: 'bg-[#fff4d6] text-[#b88600] hover:bg-[#fff4d6]' },
    failed: { label: '실패', className: 'bg-[#fff0f0] text-[#f04452] hover:bg-[#fff0f0]' },
    pending: { label: '대기', className: 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#f2f4f6]' },
  }

  return <Badge className={config[status].className}>{config[status].label}</Badge>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function parseSummaryCards(value: unknown): SummaryCard[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .flatMap((item, index): SummaryCard[] => {
      if (!isRecord(item) || typeof item.title !== 'string' || typeof item.content !== 'string') {
        return []
      }

      return [
        {
          position: typeof item.position === 'number' ? item.position : index + 1,
          title: item.title,
          content: item.content,
          icon: typeof item.icon === 'string' ? item.icon : undefined,
        },
      ]
    })
    .sort((left, right) => left.position - right.position)
    .slice(0, 10)
}

function parseAiSummary(value: Json): AiSummary {
  if (!isRecord(value)) {
    return {
      sourceLanguage: null,
      documentSummary: null,
      cards: [],
      workSteps: [],
      hazards: [],
      protectiveEquipment: [],
      prohibitedActions: [],
    }
  }

  return {
    sourceLanguage: typeof value.sourceLanguage === 'string' ? value.sourceLanguage : null,
    documentSummary: typeof value.documentSummary === 'string' ? value.documentSummary : null,
    cards: parseSummaryCards(value.cards),
    workSteps: getStringArray(value.workSteps),
    hazards: getStringArray(value.hazards),
    protectiveEquipment: getStringArray(value.protectiveEquipment),
    prohibitedActions: getStringArray(value.prohibitedActions),
  }
}

function parseFallbackEducationCards(value: Json): SummaryCard[] {
  return parseSummaryCards(
    Array.isArray(value)
      ? value.filter((card) => isRecord(card) && (!('language' in card) || card.language === 'ko'))
      : [],
  )
}

function formatJsonValue(value: Json): string {
  if (typeof value === 'boolean') {
    return value ? 'O' : 'X'
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value === null) {
    return '-'
  }

  return JSON.stringify(value)
}

function getQuestionOptions(question: QuizQuestion) {
  return Array.isArray(question.options) ? question.options.map(formatJsonValue) : []
}

function getLanguageLabel(code: string) {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-[#e5e8eb] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#333d4b]">{title}</h3>
      <ul className="space-y-2 text-sm text-[#4e5968]">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3182f6]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TrainingContentDialog({
  sop,
  open,
  onOpenChange,
}: {
  sop: ApiSopDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const summary = sop ? parseAiSummary(sop.ai_summary) : null
  const summaryCards = sop && summary ? (summary.cards.length > 0 ? summary.cards : parseFallbackEducationCards(sop.education_cards)) : []
  const quizQuestions = [...(sop?.quiz_questions ?? [])].sort((left, right) => {
    const languageOrder = left.language.localeCompare(right.language)
    return languageOrder === 0 ? left.position - right.position : languageOrder
  })
  const questionLanguages = Array.from(new Set(quizQuestions.map((question) => question.language)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>교육자료 및 퀴즈</DialogTitle>
          <DialogDescription>{sop ? `${sop.title}에서 생성된 요약자료와 퀴즈 정답입니다.` : '안전 관리 가이드 생성 내용을 불러오지 못했습니다.'}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-8rem)] space-y-6 overflow-y-auto pr-1">
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-[#333d4b]">요약 내용</h2>
              {summary?.sourceLanguage && <p className="mt-1 text-xs text-[#8b95a1]">원문 언어: {summary.sourceLanguage}</p>}
            </div>

            {summary?.documentSummary && <p className="rounded-lg bg-[#f2f4f6] p-4 text-sm leading-6 text-[#4e5968]">{summary.documentSummary}</p>}

            {summaryCards.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {summaryCards.map((card) => (
                  <article key={`${card.position}-${card.title}`} className="rounded-lg border border-[#e5e8eb] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f3ff] text-xs font-semibold text-[#3182f6]">
                        {card.position}
                      </span>
                      <h3 className="min-w-0 text-sm font-semibold text-[#333d4b]">{card.title}</h3>
                    </div>
                    <p className="text-sm leading-6 text-[#4e5968]">{card.content}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#e5e8eb] p-6 text-center text-sm text-[#6b7684]">
                저장된 요약 카드가 없습니다.
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SummaryList title="작업 순서" items={summary.workSteps} />
                <SummaryList title="위험 요소" items={summary.hazards} />
                <SummaryList title="보호구" items={summary.protectiveEquipment} />
                <SummaryList title="금지 행동" items={summary.prohibitedActions} />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-[#333d4b]">퀴즈 및 정답</h2>
              <p className="mt-1 text-xs text-[#8b95a1]">근로자에게 출제되는 문항과 정답을 언어별로 확인합니다.</p>
            </div>

            {quizQuestions.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#e5e8eb] p-6 text-center text-sm text-[#6b7684]">
                생성된 퀴즈가 없습니다.
              </div>
            )}

            {questionLanguages.map((language) => (
              <div key={language} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#e8f3ff] text-[#3182f6]">
                    {getLanguageLabel(language)}
                  </Badge>
                  <span className="text-xs text-[#8b95a1]">
                    {quizQuestions.filter((question) => question.language === language).length}문항
                  </span>
                </div>

                {quizQuestions
                  .filter((question) => question.language === language)
                  .map((question) => {
                    const correctAnswer = formatJsonValue(question.correct_answer)
                    const options = getQuestionOptions(question)

                    return (
                      <article key={question.id} className="rounded-lg border border-[#e5e8eb] p-4">
                        <div className="mb-3 flex items-start gap-2">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2f4f6] text-xs font-semibold text-[#4e5968]">
                            {question.position}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="bg-[#f2f4f6] text-[#4e5968]">
                                {question.type === 'ox' ? 'O/X' : '객관식'}
                              </Badge>
                              <span className="text-xs font-medium text-[#00a661]">정답: {correctAnswer}</span>
                            </div>
                            <p className="text-sm font-medium leading-6 text-[#333d4b]">{question.prompt}</p>
                          </div>
                        </div>

                        {options.length > 0 && (
                          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {options.map((option, index) => (
                              <div
                                key={`${question.id}-${option}-${index}`}
                                className={
                                  option === correctAnswer
                                    ? 'rounded-md border border-[#00d082] bg-[#e6f9f1] px-3 py-2 text-sm text-[#007a4d]'
                                    : 'rounded-md border border-[#e5e8eb] px-3 py-2 text-sm text-[#4e5968]'
                                }
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.explanation && <p className="rounded-md bg-[#f2f4f6] px-3 py-2 text-sm leading-6 text-[#4e5968]">{question.explanation}</p>}
                      </article>
                    )
                  })}
              </div>
            ))}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SOPDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<WorkerDetail | null>(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [sop, setSop] = useState<ApiSopDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showTrainingContent, setShowTrainingContent] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSop() {
      try {
        const response = await fetch(`/api/sops/${params.id}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })

        if (response.status === 404) {
          router.replace('/dashboard')
          return
        }

        if (!response.ok) {
          throw new Error('안전 관리 가이드 상세 정보를 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as { sop: ApiSopDetail }

        if (isMounted) {
          setSop(payload.sop)
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : '안전 관리 가이드 상세 정보를 불러오지 못했습니다.')
          setSop(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSop()

    return () => {
      isMounted = false
    }
  }, [params.id, router])

  const workers = useMemo(() => sop?.education_logs.map(toWorkerDetail) ?? [], [sop])
  const filteredWorkers = useMemo(
    () => workers.filter((worker) => worker.name.toLowerCase().includes(searchValue.toLowerCase())),
    [searchValue, workers],
  )
  const safeWorkers = workers.filter((worker) => worker.status === 'safe')
  const warningWorkers = workers.filter((worker) => worker.status === 'warning' || worker.status === 'failed')
  const pendingWorkers = workers.filter((worker) => worker.status === 'pending')

  const handleWorkerClick = (worker: WorkerDetail) => {
    setSelectedWorker(worker)
    setShowWorkerModal(true)
  }

  return (
    <DashboardLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      placeholder="작업자를 검색하세요"
      headerActions={<CompanyQrDialogButton />}
    >
        <main className="flex-1 space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <Link href="/sop" className="mb-4 flex items-center gap-1 text-sm text-[#6b7684] hover:text-[#333d4b]">
                <ArrowLeft className="h-4 w-4" />
                안전 관리 가이드 목록으로
              </Link>
              <Badge variant="secondary" className="mb-2 bg-[#e8f3ff] text-[#3182f6]">
                안전 관리 가이드 상세
              </Badge>
              <h1 className="mb-1 text-2xl font-bold text-[#333d4b]">
                {isLoading ? '불러오는 중...' : sop?.title ?? '안전 관리 가이드를 찾을 수 없습니다'}
              </h1>
              {sop && (
                <p className="text-[#6b7684]">
                  생성일 {formatDate(sop.created_at)} · 언어 {sop.languages.join(', ')} · 상태 {sop.status}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-[#e5e8eb]" disabled={!sop} onClick={() => setShowTrainingContent(true)}>
                <BookOpenCheck className="mr-2 h-4 w-4" />
                교육자료/퀴즈 보기
              </Button>
              <Button variant="outline" className="border-[#e5e8eb]" disabled={!sop}>
                <Download className="mr-2 h-4 w-4" />
                리포트 다운로드
              </Button>
              <CompanyQrDialogButton disabled={!sop} />
              <Button className="bg-[#3182f6] text-white hover:bg-[#1b64da]" disabled={!sop}>
                <Share2 className="mr-2 h-4 w-4" />
                공유
              </Button>
            </div>
          </div>

          {loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6f9f1]">
                  <CheckCircle className="h-5 w-5 text-[#00d082]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">안전 완료</p>
                  <p className="text-xl font-bold text-[#333d4b]">{safeWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff4d6]">
                  <AlertTriangle className="h-5 w-5 text-[#b88600]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">주의/실패</p>
                  <p className="text-xl font-bold text-[#333d4b]">{warningWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2f4f6]">
                  <Clock className="h-5 w-5 text-[#6b7684]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">대기</p>
                  <p className="text-xl font-bold text-[#333d4b]">{pendingWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">작업자 이수 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isLoading && filteredWorkers.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#e5e8eb] p-8 text-center text-sm text-[#6b7684]">
                  이 안전 관리 가이드에 등록된 작업자 이수 기록이 없습니다.
                </div>
              )}

              {filteredWorkers.map((worker) => (
                <button
                  key={worker.id}
                  type="button"
                  onClick={() => handleWorkerClick(worker)}
                  className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-[#f2f4f6]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f3ff] font-medium text-[#3182f6]">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[#333d4b]">{worker.name}</p>
                      <p className="text-xs text-[#8b95a1]">
                        {worker.completedAt ? `완료: ${worker.completedAt}` : '아직 완료되지 않음'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={worker.status} />
                </button>
              ))}
            </CardContent>
          </Card>
        </main>

      <WorkerDetailModal worker={selectedWorker} open={showWorkerModal} onOpenChange={setShowWorkerModal} />
      <TrainingContentDialog sop={sop} open={showTrainingContent} onOpenChange={setShowTrainingContent} />
    </DashboardLayout>
  )
}
