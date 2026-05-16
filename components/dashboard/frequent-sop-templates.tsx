'use client'

import { useState } from 'react'
import { BookOpenCheck, Check, LoaderCircle, PlusCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Json } from '@/lib/supabase/database.types'
import { SUPPORTED_LANGUAGES } from '@/lib/workproof/languages'

export type FrequentSopTemplate = {
  id: string
  template_key: string
  title: string
  description: string | null
  ai_summary: Json
  languages: string[]
  display_order: number
  addedSopId: string | null
}

interface FrequentSopTemplatesProps {
  templates: FrequentSopTemplate[]
  isLoading?: boolean
  addingTemplateKey?: string | null
  onAddTemplate?: (templateKey: string) => void
}

type SummaryCard = {
  position: number
  title: string
  content: string
}

type TemplateSummary = {
  documentSummary: string | null
  cards: SummaryCard[]
  workSteps: string[]
  hazards: string[]
  protectiveEquipment: string[]
  prohibitedActions: string[]
}

function formatLanguages(languages: string[]) {
  return languages
    .map((code) => SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code)
    .join(', ')
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
        },
      ]
    })
    .sort((left, right) => left.position - right.position)
    .slice(0, 6)
}

function parseTemplateSummary(value: Json): TemplateSummary {
  if (!isRecord(value)) {
    return {
      documentSummary: null,
      cards: [],
      workSteps: [],
      hazards: [],
      protectiveEquipment: [],
      prohibitedActions: [],
    }
  }

  return {
    documentSummary: typeof value.documentSummary === 'string' ? value.documentSummary : null,
    cards: parseSummaryCards(value.cards),
    workSteps: getStringArray(value.workSteps),
    hazards: getStringArray(value.hazards),
    protectiveEquipment: getStringArray(value.protectiveEquipment),
    prohibitedActions: getStringArray(value.prohibitedActions),
  }
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-[#e5e8eb] bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-[#333d4b]">{title}</h4>
      <ul className="space-y-2 text-sm leading-6 text-[#4e5968]">
        {items.slice(0, 4).map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3182f6]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FrequentSopTemplates({
  templates,
  isLoading = false,
  addingTemplateKey,
  onAddTemplate,
}: FrequentSopTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FrequentSopTemplate | null>(null)
  const selectedSummary = selectedTemplate ? parseTemplateSummary(selectedTemplate.ai_summary) : null

  return (
    <>
      <section className="space-y-4 rounded-2xl border border-[#dbe7ff] bg-gradient-to-br from-[#f7fbff] via-white to-[#eef6ff] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f3ff] text-[#3182f6]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-[#1f2d3d]">자주 찾는 안전 관리 가이드</h2>
            </div>
            <p className="text-sm text-[#6b7684]">기본 안전교육 가이드를 현재 관리자 목록에 바로 추가할 수 있습니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }, (_, index) => (
              <Card key={index} className="border border-[#dbe7ff] bg-white/80">
                <CardContent className="flex min-h-[180px] items-center justify-center p-5 text-sm text-[#6b7684]">
                  불러오는 중입니다...
                </CardContent>
              </Card>
            ))}

          {!isLoading &&
            templates.map((template) => {
              const isAdding = addingTemplateKey === template.template_key
              const isAdded = Boolean(template.addedSopId)

              return (
                <Card
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${template.title} 요약 보기`}
                  className="cursor-pointer border border-[#dbe7ff] bg-white/90 shadow-xs transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182f6]"
                  onClick={() => setSelectedTemplate(template)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedTemplate(template)
                    }
                  }}
                >
                  <CardContent className="flex h-full min-h-[205px] flex-col p-5">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ff]">
                        <BookOpenCheck className="h-5 w-5 text-[#3182f6]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#253142]">{template.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6b7684]">
                          {template.description ?? '현장에서 자주 사용하는 기본 안전 관리 가이드입니다.'}
                        </p>
                        <p className="mt-2 text-xs font-medium text-[#3182f6]">→ 자세히 보기</p>
                      </div>
                    </div>

                    <p className="mb-4 text-xs text-[#8b95a1]">지원 언어: {formatLanguages(template.languages)}</p>

                    <div className="mt-auto" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <Button
                        type="button"
                        className="w-full border border-[#cfe5ff] bg-[#e8f3ff] text-[#3182f6] hover:bg-[#d9ecff] disabled:border-transparent disabled:bg-[#d1d6db] disabled:text-white"
                        disabled={isAdded || isAdding || !onAddTemplate}
                        onClick={() => onAddTemplate?.(template.template_key)}
                      >
                        {isAdding && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {!isAdding && isAdded && <Check className="mr-2 h-4 w-4" />}
                        {!isAdding && !isAdded && <PlusCircle className="mr-2 h-4 w-4" />}
                        {isAdded ? '이미 추가됨' : '안전 관리 가이드 목록에 추가'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

          {!isLoading && templates.length === 0 && (
            <Card className="border border-[#dbe7ff] bg-white/80 lg:col-span-3">
              <CardContent className="flex min-h-[140px] items-center justify-center p-5 text-sm text-[#6b7684]">
                자주 찾는 안전 관리 가이드 템플릿이 아직 준비되지 않았습니다.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Dialog open={Boolean(selectedTemplate)} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-8 text-[#1f2d3d]">{selectedTemplate?.title ?? '요약본'}</DialogTitle>
            <DialogDescription>자주 찾는 안전 관리 가이드의 핵심 요약입니다.</DialogDescription>
          </DialogHeader>

          {selectedTemplate && selectedSummary && (
            <div className="max-h-[calc(90vh-8rem)] space-y-5 overflow-y-auto pr-1">
              <section className="rounded-xl bg-[#f7fbff] p-4">
                <h3 className="mb-2 text-sm font-semibold text-[#333d4b]">문서 요약</h3>
                <p className="text-sm leading-6 text-[#4e5968]">
                  {selectedSummary.documentSummary ?? selectedTemplate.description ?? '등록된 요약 설명이 없습니다.'}
                </p>
              </section>

              {selectedSummary.cards.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#333d4b]">교육 카드 요약</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedSummary.cards.map((card) => (
                      <article key={`${card.position}-${card.title}`} className="rounded-lg border border-[#e5e8eb] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f3ff] text-xs font-semibold text-[#3182f6]">
                            {card.position}
                          </span>
                          <h4 className="text-sm font-semibold text-[#333d4b]">{card.title}</h4>
                        </div>
                        <p className="text-sm leading-6 text-[#4e5968]">{card.content}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SummaryList title="작업 순서" items={selectedSummary.workSteps} />
                <SummaryList title="위험 요소" items={selectedSummary.hazards} />
                <SummaryList title="보호구" items={selectedSummary.protectiveEquipment} />
                <SummaryList title="금지 행동" items={selectedSummary.prohibitedActions} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
