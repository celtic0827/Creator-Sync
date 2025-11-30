
import { Language, ProjectStatus } from './types';

type TranslationKey = 
  | 'pipeline' | 'published' | 'settings' | 'help' | 'newProject'
  | 'noPending' | 'archiveEmpty' | 'dropToDelete' | 'dropHere'
  | 'undo' | 'today' | 'restore' | 'archive' | 'edit' | 'jumpToDate'
  | 'status_PLANNING' | 'status_IN_PROGRESS' | 'status_COMPLETED' | 'status_PAUSED' | 'status_ARCHIVED'
  | 'modal_createTitle' | 'modal_editTitle' | 'modal_name' | 'modal_desc' | 'modal_tags'
  | 'modal_category' | 'modal_status' | 'modal_delete' | 'modal_reallyDelete' | 'modal_save' | 'modal_cancel'
  | 'settings_system' | 'settings_catalogue' | 'settings_data' | 'settings_pref'
  | 'settings_lang' | 'settings_alerts' | 'settings_export' | 'settings_import'
  | 'settings_export_desc' | 'settings_import_desc' | 'settings_warning' | 'settings_critical'
  | 'settings_close' | 'settings_save'
  | 'cat_label' | 'cat_preview' | 'cat_color' | 'cat_icon'
  | 'sort_default' | 'sort_alpha' | 'sort_category' | 'sort_date';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    pipeline: 'Pipeline',
    published: 'Published',
    settings: 'Settings',
    help: 'Help',
    newProject: 'New Project',
    noPending: 'No pending projects',
    archiveEmpty: 'Archive is empty',
    dropToDelete: 'Drop to Delete',
    dropHere: 'Drop items here',
    undo: 'Undo',
    today: 'Today',
    restore: 'Restore to Pipeline',
    archive: 'Archive Project',
    edit: 'Edit Project',
    jumpToDate: 'Jump to date',
    status_PLANNING: 'PLANNING',
    status_IN_PROGRESS: 'IN PROGRESS',
    status_COMPLETED: 'COMPLETED',
    status_PAUSED: 'PAUSED',
    status_ARCHIVED: 'ARCHIVED',
    modal_createTitle: 'Create New Project',
    modal_editTitle: 'Edit Project',
    modal_name: 'Project Name',
    modal_desc: 'Description',
    modal_tags: 'Tags (Comma separated)',
    modal_category: 'Category Type',
    modal_status: 'Status',
    modal_delete: 'Delete Project',
    modal_reallyDelete: 'Really Delete?',
    modal_save: 'Save',
    modal_cancel: 'Cancel',
    settings_system: 'System',
    settings_catalogue: 'Catalogue',
    settings_data: 'Data Management',
    settings_pref: 'Preferences',
    settings_lang: 'Language / 語言',
    settings_alerts: 'Deadline Alerts',
    settings_export: 'Export JSON',
    settings_import: 'Import JSON',
    settings_export_desc: 'Download a backup of your data.',
    settings_import_desc: 'Restore from backup. Overwrites current data.',
    settings_warning: 'Warning Threshold',
    settings_critical: 'Critical Threshold',
    settings_close: 'Close',
    settings_save: 'Save',
    cat_label: 'Label Name',
    cat_preview: 'Preview',
    cat_color: 'Color Theme',
    cat_icon: 'Icon Symbol',
    sort_default: 'Default Order',
    sort_alpha: 'Name (A-Z)',
    sort_category: 'Category',
    sort_date: 'Scheduled Date',
  },
  'zh-TW': {
    pipeline: '專案管線',
    published: '已發布/封存',
    settings: '設定',
    help: '說明',
    newProject: '新增專案',
    noPending: '目前沒有待辦專案',
    archiveEmpty: '封存區是空的',
    dropToDelete: '拖曳至此刪除',
    dropHere: '拖曳項目至此',
    undo: '復原',
    today: '今天',
    restore: '還原至管線',
    archive: '封存專案',
    edit: '編輯專案',
    jumpToDate: '跳轉至日期',
    status_PLANNING: '規劃中',
    status_IN_PROGRESS: '進行中',
    status_COMPLETED: '已完成',
    status_PAUSED: '暫停',
    status_ARCHIVED: '已封存',
    modal_createTitle: '新增專案',
    modal_editTitle: '編輯專案',
    modal_name: '專案名稱',
    modal_desc: '描述',
    modal_tags: '標籤 (用逗號分隔)',
    modal_category: '類別',
    modal_status: '狀態',
    modal_delete: '刪除專案',
    modal_reallyDelete: '確定刪除？',
    modal_save: '儲存',
    modal_cancel: '取消',
    settings_system: '系統設定',
    settings_catalogue: '類別目錄',
    settings_data: '資料管理',
    settings_pref: '偏好設定',
    settings_lang: '語言 / Language',
    settings_alerts: '截止日警示',
    settings_export: '匯出 JSON',
    settings_import: '匯入 JSON',
    settings_export_desc: '下載資料備份檔。',
    settings_import_desc: '從備份還原。警告：將覆蓋目前資料。',
    settings_warning: '黃色警示 (天)',
    settings_critical: '紅色緊急 (天)',
    settings_close: '關閉',
    settings_save: '儲存',
    cat_label: '標籤名稱',
    cat_preview: '預覽',
    cat_color: '色彩主題',
    cat_icon: '圖示符號',
    sort_default: '預設排序',
    sort_alpha: '名稱 (A-Z)',
    sort_category: '依類別',
    sort_date: '排程日期',
  }
};

export const t = (key: string, lang: Language): string => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
};

export const getStatusText = (status: ProjectStatus, lang: Language): string => {
  return t(`status_${status}`, lang);
};