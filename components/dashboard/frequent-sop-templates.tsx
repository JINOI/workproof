'use client'

import { BookOpenCheck, Check, LoaderCircle, PlusCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SUPPORTED_LANGUAGES } from '@/lib/workproof/languages'

export type FrequentSopTemplate = {
  id: string
  template_key: string
  title: string
  description: string | null
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

function formatLanguages(languages: string[]) {
  return languages
    .map((code) => SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code)
    .join(', ')
}

export function FrequentSopTemplates({
  templates,
  isLoading = false,
  addingTemplateKey,
  onAddTemplate,
}: FrequentSopTemplatesProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#dbe7ff] bg-gradient-to-br from-[#f7fbff] via-white to-[#eef6ff] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3182f6] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-[#1f2d3d]">자주 찾는 SOP</h2>
          </div>
          <p className="text-sm text-[#6b7684]">기본 안전교육 SOP를 현재 관리자 목록에 바로 추가할 수 있습니다.</p>
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
              <Card key={template.id} className="border border-[#dbe7ff] bg-white/90 shadow-xs transition-shadow hover:shadow-md">
                <CardContent className="flex h-full min-h-[190px] flex-col p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ff]">
                      <BookOpenCheck className="h-5 w-5 text-[#3182f6]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#253142]">{template.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#6b7684]">
                        {template.description ?? '현장에서 자주 사용하는 기본 SOP입니다.'}
                      </p>
                    </div>
                  </div>

                  <p className="mb-4 text-xs text-[#8b95a1]">지원 언어: {formatLanguages(template.languages)}</p>

                  <Button
                    type="button"
                    className="mt-auto w-full bg-[#3182f6] text-white hover:bg-[#1b64da] disabled:bg-[#d1d6db]"
                    disabled={isAdded || isAdding || !onAddTemplate}
                    onClick={() => onAddTemplate?.(template.template_key)}
                  >
                    {isAdding && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {!isAdding && isAdded && <Check className="mr-2 h-4 w-4" />}
                    {!isAdding && !isAdded && <PlusCircle className="mr-2 h-4 w-4" />}
                    {isAdded ? '이미 추가됨' : 'SOP 목록에 추가'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}

        {!isLoading && templates.length === 0 && (
          <Card className="border border-[#dbe7ff] bg-white/80 lg:col-span-3">
            <CardContent className="flex min-h-[140px] items-center justify-center p-5 text-sm text-[#6b7684]">
              자주 찾는 SOP 템플릿이 아직 준비되지 않았습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
