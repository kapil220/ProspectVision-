import type { CRMStage } from '@/types'

export type CRMStageConfig = {
  id: CRMStage
  label: string
  color: string
  bg: string
}

export const CRM_STAGES: CRMStageConfig[] = [
  { id: 'postcard_sent', label: 'Postcard Sent', color: '#64748B', bg: '#F8FAFC' },
  { id: 'delivered', label: 'Delivered', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'page_viewed', label: 'Page Viewed', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'responded', label: 'Responded', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'appointment_set', label: 'Appointment Set', color: '#F97316', bg: '#FFF7ED' },
  { id: 'quoted', label: 'Quoted', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'closed_won', label: 'Won ✓', color: '#16A34A', bg: '#F0FDF4' },
  { id: 'closed_lost', label: 'Lost', color: '#DC2626', bg: '#FEF2F2' },
]

export const CRM_STAGE_MAP: Record<CRMStage, CRMStageConfig> = CRM_STAGES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<CRMStage, CRMStageConfig>,
)
