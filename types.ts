
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED'
}

export type ProjectType = 'VIDEO' | 'ART' | 'WRITING' | 'AUDIO' | '3D' | 'OTHER';

export interface CategoryDefinition {
  label: string;
  color: string;
  iconKey: string;
}

export type CategoryConfig = Record<ProjectType, CategoryDefinition>;

export type Language = 'en' | 'zh-TW';

export interface AppSettings {
  warningDays: number;
  criticalDays: number;
  language: Language;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[]; // Sub-category tags
  status: ProjectStatus;
  type: ProjectType;
  color: string; // Legacy support, generally derived from config now
}

export interface ScheduleItem {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  projectId: string;
  note?: string;
}

export type DragType = 'PROJECT_SOURCE' | 'SCHEDULE_ITEM';

export interface DragData {
  type: DragType;
  projectId: string;
  scheduleId?: string; // Only if moving an existing schedule item
  originDate?: string; // Only if moving an existing schedule item
}

export type SortMode = 'DEFAULT' | 'ALPHA' | 'CATEGORY' | 'DATE';
