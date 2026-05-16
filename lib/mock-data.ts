// Mock data for WorkProof application
// This will be replaced with Supabase integration later

export interface SOP {
  id: string
  title: string
  description: string
  createdAt: string
  totalWorkers: number
  completedWorkers: number
  completionRate: number
  languages: string[]
}

export interface Worker {
  id: string
  name: string
  birthDate: string
  status: 'safe' | 'warning' | 'pending'
  attempts: number
  completedAt?: string
  wrongAnswers?: number[]
}

export interface QuizQuestion {
  id: number
  type: 'ox' | 'multiple'
  question: string
  options?: string[]
  correctAnswer: number | boolean
  explanation?: string
}

export interface EducationCard {
  id: number
  title: string
  content: string
  icon: 'warning' | 'safety' | 'prohibited' | 'equipment'
}

export const mockSOPs: SOP[] = [
  {
    id: '1',
    title: '지게차 운전 안전 작업 절차',
    description: '지게차 안전 운전에 관한 표준 작업 절차서',
    createdAt: '2026-05-10',
    totalWorkers: 9,
    completedWorkers: 7,
    completionRate: 87,
    languages: ['ko', 'vi', 'zh'],
  },
  {
    id: '2',
    title: '새로운 SOP',
    description: '등록 안내 - 아래 버튼을 클릭하여 새 문서를 등록하세요',
    createdAt: '',
    totalWorkers: 0,
    completedWorkers: 0,
    completionRate: 0,
    languages: [],
  },
  {
    id: '3',
    title: '교수학업과 새를 만든 가이드',
    description: '교수학업과 새를 만든 가이드에 대한 안내서',
    createdAt: '2026-04-15',
    totalWorkers: 15,
    completedWorkers: 13,
    completionRate: 86,
    languages: ['ko', 'vi'],
  },
  {
    id: '4',
    title: '프레스 기계 작업 안전 수칙',
    description: '프레스 기계 작업 시 안전 수칙',
    createdAt: '2026-04-01',
    totalWorkers: 12,
    completedWorkers: 10,
    completionRate: 87,
    languages: ['ko', 'zh'],
  },
]

export const mockWorkers: Worker[] = [
  {
    id: '1',
    name: 'Nguyen Van A',
    birthDate: '1995-03-15',
    status: 'safe',
    attempts: 1,
    completedAt: '2026-05-10 14:30',
  },
  {
    id: '2',
    name: 'Li Wei',
    birthDate: '1992-07-22',
    status: 'warning',
    attempts: 5,
    completedAt: '2026-05-10 15:45',
    wrongAnswers: [3, 7],
  },
  {
    id: '3',
    name: 'Tran Thi B',
    birthDate: '1998-11-08',
    status: 'safe',
    attempts: 2,
    completedAt: '2026-05-10 11:20',
  },
  {
    id: '4',
    name: 'Somchai K.',
    birthDate: '1990-05-30',
    status: 'warning',
    attempts: 4,
    completedAt: '2026-05-10 16:00',
    wrongAnswers: [5],
  },
]

export const mockEducationCards: EducationCard[] = [
  {
    id: 1,
    title: '작업 단계',
    content: '지게차 운전 전 안전 점검 사항을 확인하세요. 브레이크, 조향장치, 경적, 후방 경보장치의 정상 작동 여부를 점검합니다.',
    icon: 'safety',
  },
  {
    id: 2,
    title: '위험 요소',
    content: '지게차 전복, 충돌, 적재물 낙하 등의 위험이 있습니다. 과속, 급회전, 과적재를 피하세요.',
    icon: 'warning',
  },
  {
    id: 3,
    title: '금지 행동',
    content: '음주 후 운전은 절대 금지입니다. 작업 시 핸드폰 사용, 음악 청취 등은 금지됩니다. 위반 시 처벌 대상이 됩니다.',
    icon: 'prohibited',
  },
  {
    id: 4,
    title: '보호구',
    content: '안전화, 안전모, 안전조끼를 반드시 착용하세요. 보호구 미착용 시 작업 참여가 불가합니다.',
    icon: 'equipment',
  },
]

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    type: 'ox',
    question: '음주 후 지게차 운전이 가능하다.',
    correctAnswer: false,
    explanation: '음주 후 지게차 운전은 절대 금지입니다.',
  },
  {
    id: 2,
    type: 'ox',
    question: '지게차 운전 전 브레이크 점검은 필수이다.',
    correctAnswer: true,
    explanation: '운전 전 브레이크, 조향장치 등의 점검은 필수입니다.',
  },
  {
    id: 3,
    type: 'multiple',
    question: '보호구를 착용하지 않은 동료를 보면?',
    options: ['작동을 관찰한다', '무시한다', '바꾼다', '사진을 찍는다'],
    correctAnswer: 0,
    explanation: '보호구 미착용 시 즉시 작동을 관찰하고 착용을 권유해야 합니다.',
  },
  {
    id: 4,
    type: 'ox',
    question: '적재물을 높이 들고 이동해도 된다.',
    correctAnswer: false,
    explanation: '적재물은 낮게 들고 이동해야 전복 위험을 줄일 수 있습니다.',
  },
  {
    id: 5,
    type: 'multiple',
    question: '지게차 작업 중 가장 위험한 행동은?',
    options: ['급회전', '저속 운행', '경적 사용', '안전띠 착용'],
    correctAnswer: 0,
    explanation: '급회전은 전복의 주요 원인입니다.',
  },
  {
    id: 6,
    type: 'ox',
    question: '안전모 착용은 선택사항이다.',
    correctAnswer: false,
    explanation: '안전모 착용은 필수입니다.',
  },
  {
    id: 7,
    type: 'ox',
    question: '지게차 후진 시 후방 확인이 필요하다.',
    correctAnswer: true,
    explanation: '후진 시 반드시 후방 확인을 해야 합니다.',
  },
  {
    id: 8,
    type: 'multiple',
    question: '지게차 운전 중 핸드폰 사용은?',
    options: ['절대 금지', '잠시 허용', '통화만 가능', '문자만 가능'],
    correctAnswer: 0,
    explanation: '운전 중 핸드폰 사용은 절대 금지입니다.',
  },
  {
    id: 9,
    type: 'ox',
    question: '적재량 초과 시에도 작업을 계속해도 된다.',
    correctAnswer: false,
    explanation: '과적재는 전복 위험을 크게 증가시킵니다.',
  },
  {
    id: 10,
    type: 'ox',
    question: '작업장 내 제한속도를 준수해야 한다.',
    correctAnswer: true,
    explanation: '제한속도 준수는 기본적인 안전 수칙입니다.',
  },
]

export const dashboardStats = {
  activeSOPs: 3,
  totalWorkers: 47,
  completionRate: 81,
  pendingWorkers: 7,
}
