
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED'
}

export type ProjectType = 'VIDEO' | 'ART' | 'WRITING' | 'AUDIO' | '3D' | 'LIVE' | 'SOCIAL' | 'OTHER';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CategoryDefinition {
  label: string;
  color: string;
  iconKey: string;
}

export type CategoryConfig = Record<ProjectType, CategoryDefinition>;

export type Language = 'en' | 'zh-TW';
export type Theme = 'light' | 'dark';
export type CalendarViewMode = 'COMPACT' | 'BLOCK';

export interface StatusDefinition {
  id: string;
  label: string;
  isCompleted?: boolean; // Marks this status as the "Done" state for logic purposes
}

export interface AppSettings {
  warningDays: number;
  criticalDays: number;
  language: Language;
  theme: Theme;
  statusMode: 'DEFAULT' | 'CUSTOM';
  customStatuses: StatusDefinition[];
  calendarViewMode: CalendarViewMode;
  categoryOrder: ProjectType[]; // New field for storing the sort order
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[]; // Sub-category tags
  status: string; // Changed from ProjectStatus enum to string to support custom statuses
  type: ProjectType;
  color: string; // Legacy support, generally derived from config now
  checklist?: ChecklistItem[];
  priority?: Priority;
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
  status?: string; // For dropping into status zones
}

export type SortMode = 'DEFAULT' | 'ALPHA' | 'CATEGORY' | 'DATE';
export type SidebarTab = 'pipeline' | 'published';
