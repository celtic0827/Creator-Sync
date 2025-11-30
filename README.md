
# Creator Sync - Pro Scheduler

**Creator Sync** is a specialized project management and content scheduling tool designed for Patreon creators, YouTubers, and digital artists. It bridges the gap between project planning and release scheduling with a drag-and-drop interface.

![App Screenshot](https://upload.cc/i1/2025/11/30/XGaPS0.jpg)

## 🚀 Key Features

*   **Drag-and-Drop Scheduling**: Seamlessly move projects from your pipeline onto a monthly calendar.
*   **Kanban-style Pipeline**: Track projects through phases: `Planning`, `In Progress`, `Completed`, and `Paused`.
*   **Dual View Workflow**:
    *   **Pipeline Tab**: Focus on active development.
    *   **Published Tab**: View release history and completed archives.
*   **Smart Calendar**:
    *   Drag items between dates.
    *   Click calendar items to locate the original project card.
    *   "Remove from Calendar" without deleting the project.
*   **Deadline Alerts**:
    *   Visual feedback (Yellow/Red glowing borders) for projects approaching their release date.
    *   Configurable thresholds for "Warning" and "Critical" days.
*   **Data Safety**:
    *   **Undo System**: Revert accidental moves or deletions with `Ctrl+Z` or the toolbar button.
    *   **Backup & Restore**: Export your workspace to JSON for safekeeping or transfer.
*   **Catalogue Editor**: Fully customizable category system.
    *   Choose from 24 curated theme colors (Bright/Dark variants).
    *   Select from 27 professional icons.
    *   Live preview of category styles.
*   **Localization**: Native support for **English** and **Traditional Chinese (繁體中文)**.
*   **Tagging System**: Organize content with sub-category tags (e.g., `NSFW`, `Bonus`, `Public`).
*   **Trash Zone**: Drag projects or schedule items to the trash bin for deletion.

## 🛠️ Tech Stack

*   **Framework**: [React 19](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Drag & Drop**: [@dnd-kit/core](https://dndkit.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Date Management**: [date-fns](https://date-fns.org/)
*   **AI Integration**: Google Gemini API (Service layer included for future auto-scheduling features).

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/creator-sync.git
    cd creator-sync
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory if you plan to use the AI features:
    ```env
    API_KEY=your_google_gemini_api_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 🎨 Customization

The app comes with a built-in **Catalogue Editor** (Settings icon in the sidebar). You can customize:
*   Category Labels (e.g., Video, Art, Writing)
*   Color Themes
*   Iconography

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

# Creator Sync - 專業創作者排程工具 (中文說明)

**Creator Sync** 是一款專為 Patreon 創作者、YouTuber 和數位藝術家設計的專業專案管理與內容排程工具。透過直覺的拖放介面，將您的專案製作管線與發布行事曆無縫連結。

## 🚀 主要功能

*   **拖放式排程**：輕鬆將側邊欄的專案拖曳至月曆上進行排程。
*   **看板式管線**：追蹤專案生命週期：`規劃中`、`進行中`、`已完成` 和 `暫停`。
*   **雙視圖工作流**：
    *   **管線分頁 (Pipeline)**：專注於目前開發與待辦的項目。
    *   **已發布分頁 (Published)**：檢視發布歷史與已完成的封存檔案。
*   **智慧月曆**：
    *   在日期之間自由拖曳項目以更改時程。
    *   點擊月曆上的項目，自動定位回側邊欄的原始專案卡片。
    *   支援「從月曆移除」功能，僅取消排程而不刪除專案本身。
*   **截止日警示 (Deadline Alerts)**：
    *   **智慧監控**：針對已排程但尚未完成的專案提供視覺回饋。
    *   **視覺提示**：接近發布日時顯示黃色警示，緊急或過期時顯示紅色發光邊框。
    *   **可自訂**：在設定中自由調整「警示」與「緊急」的天數閾值。
*   **資料安全**：
    *   **復原系統 (Undo)**：操作失誤？使用 `Ctrl+Z` 或工具列按鈕一鍵復原移動或刪除動作。
    *   **備份與還原**：將完整工作區匯出為 JSON 檔案，方便備份或轉移至其他裝置。
*   **目錄編輯器 (Catalogue Editor)**：完全可自訂的分類系統。
    *   內建 24 種精選主題配色（包含亮色與深色變體）。
    *   提供 27 種專業圖示供選擇。
    *   編輯時可即時預覽類別樣式。
*   **在地化支援**：原生支援 **英文 (English)** 與 **繁體中文 (Traditional Chinese)**，介面字體大小會針對中文優化。
*   **標籤系統**：使用子類別標籤（如 `NSFW`、`Bonus`、`Public`）來細分與組織內容。
*   **垃圾桶功能**：將專案或排程項目拖曳至頂部垃圾桶即可刪除。

## 🛠️ 技術堆疊

*   **框架**: [React 19](https://react.dev/)
*   **語言**: [TypeScript](https://www.typescriptlang.org/)
*   **建置工具**: [Vite](https://vitejs.dev/)
*   **樣式**: [Tailwind CSS](https://tailwindcss.com/)
*   **拖放核心**: [@dnd-kit/core](https://dndkit.com/)
*   **圖示庫**: [Lucide React](https://lucide.dev/)
*   **日期處理**: [date-fns](https://date-fns.org/)
*   **AI 整合**: Google Gemini API (已包含服務層，可擴充自動排程功能)。

## 📦 安裝與設定

1.  **複製專案 (Clone)**
    ```bash
    git clone https://github.com/yourusername/creator-sync.git
    cd creator-sync
    ```

2.  **安裝依賴套件**
    ```bash
    npm install
    ```

3.  **設定環境變數**
    若您計畫使用 AI 功能，請在根目錄建立 `.env` 檔案：
    ```env
    API_KEY=your_google_gemini_api_key
    ```

4.  **啟動開發伺服器**
    ```bash
    npm run dev
    ```

## 🎨 自訂化

應用程式內建強大的 **目錄編輯器**（點擊側邊欄底部的設定圖示）。您可以自訂：
*   類別名稱（例如：影片、繪圖、寫作）
*   顏色主題
*   代表圖示

## 🤝 參與貢獻

歡迎提交 Pull Request 或回報問題來協助改進此專案。

## 📄 授權

本專案採用 [MIT License](LICENSE) 開源授權。
