# Creator Sync 系統架構與技術維護文件 (System Architecture & Maintenance Guide)

本文件詳述 **Creator Sync** 專案管理工具的軟體架構、設計模式、資料結構流轉，以及模組化元件階層。此文件旨在為未來的維護者提供清晰的代碼藍圖與功能擴充指南。

---

## 1. 系統架構概覽 (System Architecture Overview)

Creator Sync 採用 **離線優先 (Offline-first)**、**單頁應用程式 (SPA)** 的架構設計，結合 React 19 與 Vite 構建，並使用 Tailwind CSS 進行精準的高對比度視覺排版（預設為深色/日曆聚焦風格）。

其架構骨幹由以下三個主要層次組成：
```
+-----------------------------------------------------------------+
|                       用戶介面層 (UI Layer)                      |
|  - App.tsx (主框架、DndContext、日曆格點)                        |
|  - Components (Sidebar, CalendarCell, ProjectCard, Modals)      |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                  狀態與商務邏輯層 (Business Logic)                |
|  - useAppStore.ts (自訂 React Hook, 負責狀態與本地持久化)        |
|  - @dnd-kit/core (拖曳感應與位置碰撞運算)                         |
+-----------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                    資料與外部服務層 (Data & Services)            |
|  - LocalStorage (本地儲存 JSON、匯入/匯出)                        |
|  - geminiService.ts (Gemini AI API 串接，用以輔助產生文案或分析) |
+-----------------------------------------------------------------+
```

---

## 2. 核心資料結構定義 (Core Data Schemas - `types.ts`)

核心領域模型與配置資料皆定義於 `/types.ts`。主要實體結構如下：

### 2.1 專案實體 (Project)
代表創作者所建立的每一個獨立企劃案：
```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  categoryId: string;          // 關聯至特定的 Category Slot
  status: string;              // 狀態 ID (如 'planning', 'in_progress', 'completed')
  tags: string[];              // 標籤，便於搜尋與分類
  checklist: ChecklistItem[];  // 子任務清單，用於追蹤內部進度
  createdAt: string;
}
```

### 2.2 排程實體 (ScheduleItem)
定義專案與日曆上日期格子的映射關係：
```typescript
export interface ScheduleItem {
  id: string;
  projectId: string;           // 對應專案 ID
  date: string;                // 排程目標日期格式: 'YYYY-MM-DD'
  notes?: string;              // 該日期的發布備忘錄
}
```

### 2.3 狀態定義 (StatusDefinition)
描述管線狀態的行為與視覺表現。此結構已於近期擴展，**支援多種虛線與特殊邊框風格**：
```typescript
export interface StatusDefinition {
  id: string;
  label: string;
  isCompleted?: boolean;       // 是否為完成狀態（用於自動收納至 Published 頁籤）
  color: string;               // 對應的 Tailwind 色系前綴 (例如 'indigo', 'emerald')
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double'; // 客製化邊線風格
}
```

---

## 3. 狀態管理機制與資料流 (State Management & Data Flow)

Creator Sync 所有的應用程式全域狀態皆由 `/hooks/useAppStore.ts` 進行集中封裝與調度。

### 3.1 本地儲存與變更追蹤 (LocalStorage & History Log)
*   **讀取與初始化**：應用程式啟動時，從 `localStorage` 讀取並解析 `creator_sync_projects`、`creator_sync_schedule` 與 `creator_sync_settings`。
*   **深拷貝與遷移補強**：如果載入歷史舊版數據，系統將自動進行 **Migration 補強**，確保所有專案狀態均有合法的 borderStyle (預設為 `solid`)，防止 undefined runtime error。
*   **歷史變更堆疊 (Undo/Redo)**：每次發生核心修改（新增、編輯、拖曳排程、刪除）時，皆會觸發 `saveHistory()` 函數。系統會維護一個雙向環狀歷史堆疊（最大上限 30 步），支援用戶隨時按下 **Undo (復原)** 按鈕，實現無痛操作。

### 3.2 資料快速索引設計 (Performance Optimization)
為了避免在大容量數據或拖曳碰撞時，在 render 週期反覆對陣列調用 `.find()` 或 `.filter()`，`useAppStore` 內部使用了快取檢索設計：
*   **scheduleLookup** (由 `useMemo` 計算)：將 `ScheduleItem` 以 `date` 為 key 進行雜湊映射 (`{ [dateStr]: ScheduleItem[] }`)。
*   日曆儲存格 `CalendarCell` 渲染時，可直接透過 `scheduleLookup[dateStr]` 以 $O(1)$ 的複雜度獲取當天排程專案，極大提升大型日曆畫面的流暢度。

---

## 4. 拖曳與排程物理引擎 (Drag-and-Drop System)

本專案使用 `@dnd-kit/core` 作為拖曳交互基底。核心邏輯集中在 `App.tsx` 中的 `<DndContext>` 配置。

### 4.1 指標與觸控感應器 (Sensors)
*   **PointerSensor**：滑鼠拖曳，啟動約束距離為 `5px`，以防與卡片點擊與雙擊編輯衝突。
*   **TouchSensor**：行動端觸控，啟動延遲設為 `250ms`（容差 `5px`），避免在手機或平板滾動日曆時誤觸拖曳。

### 4.2 拖曳碰撞策略 (Collision & Interaction)
拖曳數據承載物件為 `DragData`：
*   **Sidebar ProjectCard 拖出**：型態為 `NEW_PROJECT_DRAG`，攜帶 `projectId`。
*   **日曆排程物件移動**：型態為 `SCHEDULE_ITEM`，攜帶 `scheduleId`、`projectId` 與 `originDate`。
*   **碰撞放置 (onDragEnd)**：
    *   放置於日曆儲存格：解析 `over.id`（日期字串），更新 `schedule`。如果是 `NEW_PROJECT_DRAG`，則建立新的 `ScheduleItem`；如果是既有排程，則更新其 `date`。
    *   放置於狀態收集區 (Status Zone) 或垃圾桶 (Trash Drop Zone)：自動清除該日期排程，或將專案移入資源回收狀態。

---

## 5. 客製化狀態邊線風格系統 (Feature Showcase: Custom Border Styles)

為了改善專案看板中，純靠顏色聯想度過低的問題，本系統支援**對不同專案狀態進行「邊線風格」切選**。

### 5.1 設計細節與技術實現
當用戶至 `設定 (Settings) -> 管線設定 (Pipeline Settings) -> 客制模式` 中變更狀態的邊線樣式時：
*   系統提供了四種樣式：**實線 (Solid)**、**虛線 (Dashed)**、**點線 (Dotted)**、**雙實線 (Double)**。
*   其狀態資料會更新至 `AppSettings.customStatuses` 中。

### 5.2 渲染適配 (Renderer Implementation)
對應的兩個視覺渲染元件：
1.  **專案卡片**：`/components/ProjectCard.tsx`
2.  **日曆排程條**：`/components/DraggableScheduleItem.tsx`

它們根據 `borderStyle` 動態套用對應的 Tailwind 樣式：
*   `solid` -> `border-solid`
*   `dashed` -> `border-dashed`
*   `double` -> `border-double border-2`
*   **`dotted` (加大點點間距特調)**：
    由於標準瀏覽器的 `border-style: dotted` 點點非常小且難以控制間距。為了解決此痛點，我們採用了 **SVG Overlay 的高階向量圖渲染技術**。
    當 borderStyle 為 `dotted` 時，元件內層會動態疊加一個 `absolute` 定位的 SVG `<rect>`：
    ```xml
    <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-md overflow-hidden z-10">
      <rect
        x="0.5"
        y="0.5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        fill="none"
        rx="6"
        ry="6"
        className="stroke-your-color"
        strokeWidth="1.5"
        strokeDasharray="1 8" <!-- 巧妙將間距拉寬至 8 像素，形成優雅、對比清晰的加寬點點線 -->
        strokeLinecap="round"
      />
    </svg>
    ```

---

## 6. 重要輔助模組 (Utility & Helper Modules)

### 6.1 全域搜尋與聯動導航 (GlobalSearch)
位於 `/components/GlobalSearch.tsx`。
*   能搜尋專案名稱、描述、分類標籤或子任務。
*   **聯動定位設計**：
    *   若專案「已排程」，點擊搜尋結果會調用 `handleJumpToProject` 自動將行事曆切換至該排程月份，並觸發 2 秒鐘的專案高亮 (glowing border)。
    *   若專案「未排程」，點擊會調用 `scrollToSidebarProject` 函數。它會自動在 React 狀態中切換側邊欄的頁籤為 `Pipeline`，計算目標 ProjectCard 的 DOM 高度與相對位移，並調用 `container.scrollTo({ behavior: 'smooth' })` 進行平滑置中對齊，顯著優化長列表的查找效率。

### 6.2 智慧截止日警示 (Urgency Alerts)
*   如果專案已排程且尚未完成，系統會使用 `differenceInDays` 計算排程日期與當前本機日期的天數差：
    *   **剩餘 $\le 1$ 天**：判定為 `CRITICAL` 臨界（顯示紅色微光，高亮警示）。
    *   **剩餘 $\le 3$ 天**：判定為 `WARNING` 警告（顯示黃色微光）。
    *   這讓創作者一目了然有哪些影片或企劃正處於交片邊緣。

---

## 7. 維護與未來擴充建議 (Maintenance & Extension Guidelines)

若未來需要為 Creator Sync 增加新功能，請遵循以下模式：

### 7.1 新增或修改專案屬性 (Adding a Project Property)
1.  **型態定義**：在 `/types.ts` 中的 `Project` 介面新增該屬性（例如 `priority?: 'low' | 'high'`）。
2.  **預設值填充**：在 `/components/modals/ProjectFormModal.tsx` 的表單初始化中，確保新屬性有合理的預設值。
3.  **狀態同步**：更新 `/hooks/useAppStore.ts` 中新增專案、更新專案的相關 action，確保新屬性能正確保存至 LocalStorage。

### 7.2 增加全新的邊線或視覺樣式
1.  在 `/types.ts` 的 `borderStyle` 聯集型態中加入新名稱（例如 `'wavy'`）。
2.  在 `/translations.ts` 中的多國語系物件加入對應的中文與英文翻譯。
3.  在 `/components/modals/SettingsModal.tsx` 中，找到 `select` 標籤並新增一筆對應的 `<option>`。
4.  在 `ProjectCard.tsx` 與 `DraggableScheduleItem.tsx` 內加入對應的樣式解碼邏輯（例如，若使用 CSS Wave 或進階 SVG，可在對應分支進行渲染）。

---

本架構經過精心模組化劃分，資料流嚴格遵循「**狀態下發 (Props) 與事件回傳 (Callbacks / Store Actions)**」之 React 單向資料流準則。良好的代碼分離確保了未來在面對多端同步、雲端資料庫（如 Firebase Firestore）擴充時，僅需重構 `useAppStore.ts` 本地持久化代碼，而完全無需更動 UI 元件層，具備優秀的水平擴充彈性。
