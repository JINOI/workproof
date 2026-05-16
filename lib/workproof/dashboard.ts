export function formatDashboardTitle(organizationName: string | null | undefined) {
  const companyName = organizationName?.trim()

  return companyName ? `${companyName}의 대시보드` : '회사의 대시보드'
}
