
import { Language, ProjectStatus } from './types';

type TranslationKey = 
  | 'pipeline' | 'published' | 'settings' | 'help' | 'newProject'
  | 'noPending' | 'archiveEmpty' | 'dropToDelete' | 'dropHere'
  | 'undo' | 'today' | 'restore' | 'archive' | 'edit' | 'jumpToDate'
  | 'status_PLANNING' | 'status_IN_PROGRESS' | 'status_COMPLETED' | 'status_PAUSED' | 'status_ARCHIVED'
  | 'modal_createTitle' | 'modal_editTitle' | 'modal_name' | 'modal_desc' | 'modal_tags'
  | 'modal_category' | 'modal_status' | 'modal_priority' | 'modal_delete' | 'modal_reallyDelete' | 'modal_save' | 'modal_cancel'
  | 'priority_HIGH' | 'priority_MEDIUM' | 'priority_LOW'
  | 'settings_system' | 'settings_catalogue' | 'settings_pipeline' | 'settings_data' | 'settings_pref'
  | 'settings_lang' | 'settings_appearance' | 'settings_theme_light' | 'settings_theme_dark'
  | 'settings_alerts' | 'settings_export' | 'settings_import'
  | 'settings_export_desc' | 'settings_import_desc' | 'settings_warning' | 'settings_critical'
  | 'settings_close' | 'settings_save'
  | 'cat_label' | 'cat_preview' | 'cat_color' | 'cat_icon'
  | 'sort_default' | 'sort_alpha' | 'sort_category' | 'sort_date' | 'sort_priority'
  | 'pipeline_mode_default' | 'pipeline_mode_custom' | 'pipeline_add' | 'pipeline_max_limit' | 'pipeline_placeholder'
  | 'pipeline_set_completed'
  | 'checklist_title' | 'checklist_placeholder' | 'checklist_add' | 'checklist_empty'
  | 'view_compact' | 'view_block'
  | 'menu_duplicate' | 'menu_delete'
  | 'search_placeholder' | 'search_no_results' | 'search_scheduled' | 'search_unscheduled';

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
    modal_priority: 'Priority',
    modal_delete: 'Delete Project',
    modal_reallyDelete: 'Really Delete?',
    modal_save: 'Save',
    modal_cancel: 'Cancel',
    priority_HIGH: 'High',
    priority_MEDIUM: 'Medium',
    priority_LOW: 'Low',
    settings_system: 'System',
    settings_catalogue: 'Catalogue',
    settings_pipeline: 'Pipeline Config',
    settings_data: 'Data Management',
    settings_pref: 'Preferences',
    settings_lang: 'Language / 語言',
    settings_appearance: 'Appearance',
    settings_theme_light: 'Light Mode',
    settings_theme_dark: 'Dark Mode',
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
    sort_default: 'Default',
    sort_alpha: 'Name (A-Z)',
    sort_category: 'Category',
    sort_date: 'Scheduled Date',
    sort_priority: 'Priority',
    pipeline_mode_default: 'Default Mode',
    pipeline_mode_custom: 'Custom Mode',
    pipeline_add: 'Add Status',
    pipeline_max_limit: 'Max 8 statuses reached',
    pipeline_placeholder: 'Status Name',
    pipeline_set_completed: 'Select which status represents "Completed" to stop deadline alerts.',
    checklist_title: 'To-Do List',
    checklist_placeholder: 'Add a new task...',
    checklist_add: 'Add',
    checklist_empty: 'No tasks yet. Add one above!',
    view_compact: 'Compact View',
    view_block: 'Block View',
    menu_duplicate: 'Duplicate & Edit',
    menu_delete: 'Delete',
    search_placeholder: 'Search projects...',
    search_no_results: 'No projects found',
    search_scheduled: 'Scheduled',
    search_unscheduled: 'Unscheduled',
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
    modal_priority: '優先級',
    modal_delete: '刪除專案',
    modal_reallyDelete: '確定刪除？',
    modal_save: '儲存',
    modal_cancel: '取消',
    priority_HIGH: '高 (High)',
    priority_MEDIUM: '中 (Medium)',
    priority_LOW: '低 (Low)',
    settings_system: '系統設定',
    settings_catalogue: '類別目錄',
    settings_pipeline: '管線設定',
    settings_data: '資料管理',
    settings_pref: '偏好設定',
    settings_lang: '語言 / Language',
    settings_appearance: '外觀 / Appearance',
    settings_theme_light: '亮色模式',
    settings_theme_dark: '暗色模式',
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
    sort_category: '類別目錄',
    sort_date: '排程日期',
    sort_priority: '優先級',
    pipeline_mode_default: '預設模式',
    pipeline_mode_custom: '客製模式',
    pipeline_add: '新增狀態',
    pipeline_max_limit: '最多只能有 8 個狀態',
    pipeline_placeholder: '狀態名稱',
    pipeline_set_completed: '請選擇代表「已完成」的狀態，以停止過期警示。',
    checklist_title: '待辦清單',
    checklist_placeholder: '新增子任務...',
    checklist_add: '新增',
    checklist_empty: '尚無任務，請從上方新增！',
    view_compact: '簡約模式',
    view_block: '色塊模式',
    menu_duplicate: '複製並編輯',
    menu_delete: '刪除',
    search_placeholder: '搜尋專案...',
    search_no_results: '找不到符合的專案',
    search_scheduled: '已排程',
    search_unscheduled: '未排程',
  }
};

export const t = (key: string, lang: Language): string => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
};

export const getStatusText = (status: string, lang: Language, defaultLabel?: string): string => {
  const key = `status_${status}`;
  const translation = t(key, lang);
  if (translation === key && defaultLabel) return defaultLabel;
  return translation;
};
