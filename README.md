
# Creator Sync - Pro Scheduler

**Creator Sync** is a specialized project management tool designed for Patreon creators, YouTubers, and digital artists. It bridges the gap between production pipelines (Kanban) and release schedules (Calendar) with a seamless drag-and-drop workflow.

![App Screenshot](https://upload.cc/i1/2025/11/30/XGaPS0.jpg)

## 🚀 Key Features

*   **Pipeline-to-Calendar Sync**: Instantly turn your backlog into a release schedule. Drag projects from your "Pipeline" directly onto calendar dates.
*   **Smart Deadline Alerts**: Visual urgency indicators. Unfinished projects glow **Yellow** (Warning) or **Red** (Critical) as release dates approach.
*   **Catalogue Editor**: Fully customizable project taxonomy. Define your own content types (e.g., Video, Art, Lore) with 24 color themes and 27 icon options.
*   **Dual View Workflow**:
    *   **Pipeline**: Focus on active production (`Planning`, `In Progress`).
    *   **Published**: Auto-archives completed releases to keep your workspace clean.
*   **Privacy & Data Ownership**: Offline-first architecture. All data lives in your browser (LocalStorage) with JSON export/import capabilities for backups.
*   **Native Localization**: Optimized UI for **English** and **Traditional Chinese (繁體中文)**.

## 🛠️ Tech Stack

*   **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
*   **UI/UX**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/)
*   **Interactions**: [@dnd-kit/core](https://dndkit.com/)
*   **Logic**: [date-fns](https://date-fns.org/) + Google Gemini API (Service integration).

## 📦 Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/yourusername/creator-sync.git
    cd creator-sync
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📄 License

[MIT License](LICENSE)

---

# Creator Sync - 專業創作者排程工具

**Creator Sync** 是一款專為創作者設計的專案管理工具。透過直覺的介面，將您的「製作管線 (Kanban)」與「發布行事曆」完美整合。

## 🚀 核心特色

*   **管線與日曆同步**：將側邊欄的待辦事項直接拖曳至月曆，瞬間完成排程規劃。
*   **智慧截止日警示**：自動監控進度。當專案已排程但未完成時，系統會依據剩餘天數顯示 **黃色警示** 或 **紅色緊急** 訊號。
*   **高度客製化目錄**：內建「目錄編輯器」，讓您自由定義專案類型（如：影片、繪圖、音頻），並搭配 24 種主題色與 27 款圖示。
*   **雙視圖工作流**：
    *   **管線 (Pipeline)**：專注於當前的開發進度（規劃中、進行中）。
    *   **已發布 (Published)**：自動收納過期或已完成的專案，保持工作區整潔。
*   **隱私與資料自主**：離線優先設計，資料完全儲存於本地瀏覽器。支援 JSON 格式匯出備份，無需註冊帳號。
*   **完整中文化**：介面針對 **繁體中文** 優化，提供舒適的閱讀體驗。

## 🛠️ 技術堆疊

*   **核心**: React 19, TypeScript, Vite
*   **介面**: Tailwind CSS, Lucide Icons
*   **互動**: @dnd-kit
*   **邏輯**: date-fns, Google Gemini API

## 📦 安裝說明

1.  **複製與安裝**
    ```bash
    git clone https://github.com/yourusername/creator-sync.git
    cd creator-sync
    npm install
    ```

2.  **啟動開發環境**
    ```bash
    npm run dev
    ```
