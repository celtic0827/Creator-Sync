
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
*   **Data Safety**:
    *   **Undo System**: Revert accidental moves or deletions with `Ctrl+Z` or the toolbar button.
    *   **Backup & Restore**: Export your workspace to JSON for safekeeping or transfer.
*   **Catalogue Editor**: Fully customizable category system.
    *   Choose from 24 curated theme colors (Bright/Dark variants).
    *   Select from 27 professional icons.
    *   Live preview of category styles.
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