console.log("[Mentari Helper] Script diinjeksikan secara reaktif.");

// Inject Outfit Font
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap';
document.head.appendChild(fontLink);

// Global Variables
let authToken = null;
let userData = null;
let isDragging = false;
let startX = 0, startY = 0;
let initialLeft = 0, initialTop = 0;
let hideCompleted = true;
let allProcessedCourses = [];
let allAttendanceData = [];

// Determine current domain
const isMyUnpam = window.location.host === 'my.unpam.ac.id';

// Academic Schedule data
const weekRanges = [
  { week: 1, start: '2026-03-02', end: '2026-03-07' },
  { week: 2, start: '2026-03-09', end: '2026-03-14' },
  { week: 3, start: '2026-03-30', end: '2026-04-04' },
  { week: 4, start: '2026-04-06', end: '2026-04-11' },
  { week: 5, start: '2026-04-13', end: '2026-04-18' },
  { week: 6, start: '2026-04-20', end: '2026-04-25' },
  { week: 7, start: '2026-04-27', end: '2026-05-02' },
  { week: 8, start: '2026-05-04', end: '2026-05-09' },
  { week: 9, start: '2026-05-11', end: '2026-05-16' },
  { week: 10, start: '2026-05-18', end: '2026-05-23' },
  { week: 11, start: '2026-05-25', end: '2026-05-30' },
  { week: 12, start: '2026-06-01', end: '2026-06-06' },
  { week: 13, start: '2026-06-08', end: '2026-06-13' },
  { week: 14, start: '2026-06-15', end: '2026-06-20' },
  { week: 15, start: '2026-06-22', end: '2026-06-27' },
  { week: 16, start: '2026-06-29', end: '2026-07-04' }
];

const scheduleMapping = {
  1: { "E-1": { 1: [1], 2: [1], 3: [1], 4: [1, 2] }, "E-2": { 1: [1], 2: [1], 3: [1], 4: [1, 2] } },
  2: { "E-1": { 1: [2], 2: [2], 3: [2, 3], 4: [3, 4] }, "E-2": { 1: [2], 2: [2], 3: [2, 3], 4: [3, 4] } },
  3: { "E-1": { 1: [3], 2: [3], 3: [4], 4: [5, 6] }, "E-2": { 1: [3], 2: [3], 3: [4], 4: [5, 6] } },
  4: { "E-1": { 1: [4], 2: [4], 3: [5, 6], 4: [7, 8] }, "E-2": { 1: [4], 2: [4], 3: [5, 6], 4: [7, 8] } },
  5: { "E-1": { 1: [5], 2: [5], 3: [7], 4: [9, 10] }, "E-2": { 1: [5], 2: [5], 3: [7], 4: [9, 10] } },
  6: { "E-1": { 1: [6], 2: [6], 3: [8, 9], 4: [11, 12] }, "E-2": { 1: [6], 2: [6], 3: [8, 9], 4: [11, 12] } },
  7: { "E-1": { 1: [7], 2: [7], 3: [10], 4: [13, 14] }, "E-2": { 1: [7], 2: [7], 3: [10], 4: [13, 14] } },
  8: { "E-1": { 1: [], 2: [], 3: [], 4: [] }, "E-2": { 1: [], 2: [], 3: [], 4: [] } },
  9: { "E-1": { 1: [8], 2: [8], 3: [11, 12], 4: [15, 16] }, "E-2": { 1: [1], 2: [8], 3: [11, 12], 4: [15, 16] } },
  10: { "E-1": { 1: [9], 2: [9], 3: [13], 4: [17, 18] }, "E-2": { 1: [2], 2: [9], 3: [13], 4: [17, 18] } },
  11: { "E-1": { 1: [10], 2: [10], 3: [14, 15], 4: [19, 20] }, "E-2": { 1: [3], 2: [10], 3: [14, 15], 4: [19, 20] } },
  12: { "E-1": { 1: [11], 2: [11], 3: [16], 4: [21, 22] }, "E-2": { 1: [4], 2: [11], 3: [16], 4: [21, 22] } },
  13: { "E-1": { 1: [12], 2: [12], 3: [17, 18], 4: [23, 24] }, "E-2": { 1: [5], 2: [12], 3: [17, 18], 4: [23, 24] } },
  14: { "E-1": { 1: [13], 2: [13], 3: [19], 4: [25, 26] }, "E-2": { 1: [6], 2: [13], 3: [19], 4: [25, 26] } },
  15: { "E-1": { 1: [14], 2: [14], 3: [20, 21], 4: [27, 28] }, "E-2": { 1: [7], 2: [14], 3: [20, 21], 4: [27, 28] } },
  16: { "E-1": { 1: [], 2: [], 3: [], 4: [] }, "E-2": { 1: [], 2: [], 3: [], 4: [] } }
};

function getCurrentWeekNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  for (const range of weekRanges) {
    if (todayStr >= range.start && todayStr <= range.end) {
      return range.week;
    }
  }
  
  // Sunday or holiday fallback
  for (const range of weekRanges) {
    const start = new Date(range.start);
    const end = new Date(range.end);
    end.setDate(end.getDate() + 1); // include Sunday
    if (today >= start && today <= end) {
      return range.week;
    }
  }
  
  return 15;
}

function isExtensionValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
}

// CSS for Floating Widget (Cyber-Dark Glassmorphism)
const styleElement = document.createElement('style');
styleElement.textContent = `
  :root {
    --mh-bg: rgba(13, 27, 42, 0.88);
    --mh-border: rgba(255, 255, 255, 0.08);
    --mh-accent: #3b82f6;
    --mh-accent-glow: rgba(59, 130, 246, 0.4);
    --mh-success: #10b981;
    --mh-warning: #f59e0b;
    --mh-text-main: #f3f4f6;
    --mh-text-muted: #9ca3af;
    --mh-font: 'Outfit', sans-serif;
  }

  /* Main Container */
  #mentari-helper-root {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    font-family: var(--mh-font);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: none;
  }

  /* Floating Toggle Button */
  .mh-toggle-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(13, 27, 42, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid var(--mh-border);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    user-select: none;
  }

  .mh-toggle-btn:hover {
    transform: scale(1.08) translateY(-2px);
    border-color: var(--mh-accent);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.6), 0 0 25px var(--mh-accent-glow);
  }

  .mh-toggle-btn svg {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: var(--mh-text-main);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.3s ease;
  }

  .mh-toggle-btn.active svg {
    transform: rotate(45deg);
  }

  /* Dashboard Panel (Centered 70% Modal) */
  .mh-panel {
    width: 70vw;
    height: 70vh;
    background: rgba(13, 27, 42, 0.88);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translate(-50%, -50%) scale(0.9);
    transform-origin: center;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    pointer-events: auto;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: none; /* Hidden by default */
  }

  .mh-panel.active {
    display: flex;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  /* Title Bar (Hacker-style window header) */
  .mh-title-bar {
    height: 38px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    user-select: none;
    cursor: default;
  }
  
  .mh-window-dots {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .mh-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .mh-dot:hover {
    transform: scale(1.15);
  }
  
  .mh-dot.red { background: #ff5f56; }
  .mh-dot.yellow { background: #ffbd2e; }
  .mh-dot.green { background: #27c93f; }
  
  .mh-title-text {
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--mh-text-muted);
    letter-spacing: 0.08em;
  }
  
  .mh-status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .mh-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--mh-warning);
    box-shadow: 0 0 8px var(--mh-warning);
    transition: all 0.3s ease;
  }
  
  .mh-status-text {
    font-size: 0.7rem;
    color: var(--mh-text-muted);
    font-weight: 600;
  }

  /* Layout Structure */
  .mh-panel-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Sidebar (Left column) */
  .mh-sidebar {
    width: 190px;
    background: rgba(0, 0, 0, 0.22);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    padding: 16px 10px;
    gap: 16px;
    overflow-y: auto;
    user-select: none;
  }
  
  .mh-sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .mh-sidebar-header {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--mh-text-muted);
    padding-left: 8px;
    margin-bottom: 4px;
    letter-spacing: 0.06em;
    opacity: 0.8;
  }
  
  .mh-sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--mh-text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .mh-sidebar-item:hover {
    background: rgba(255, 255, 255, 0.03);
    color: var(--mh-text-main);
  }
  
  .mh-sidebar-item.active {
    background: rgba(59, 130, 246, 0.85);
    color: #fff;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }

  /* Content Pane (Right column) */
  .mh-content-pane {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(255, 255, 255, 0.005);
  }

  .mh-tab-content {
    display: none;
    flex-direction: column;
    gap: 12px;
    height: 100%;
  }

  .mh-tab-content.active {
    display: flex;
  }

  /* Welcome Banner Card */
  .mh-welcome-banner {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.04));
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    padding: 16px;
    position: relative;
  }
  
  .mh-welcome-banner h3 {
    margin: 0 0 4px 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #fff;
  }
  
  .mh-welcome-banner p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--mh-text-muted);
  }
  
  .mh-welcome-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 0.65rem;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--mh-accent);
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mh-card-section-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--mh-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 8px;
    margin-bottom: 2px;
  }

  /* Flex Search Row */
  .mh-search-row {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
  }

  .mh-search-row .mh-search-container {
    flex: 1;
  }

  /* User Profile Card */
  .mh-profile {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mh-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--mh-accent), #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: #fff;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .mh-profile-info {
    flex: 1;
    overflow: hidden;
  }

  .mh-profile-info h4 {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--mh-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mh-profile-info p {
    margin: 2px 0 0 0;
    font-size: 0.72rem;
    color: var(--mh-text-muted);
  }

  /* Filter Controls (Checkbox label) */
  .mh-controls {
    display: flex;
    align-items: center;
  }

  .mh-checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--mh-text-main);
    cursor: pointer;
    user-select: none;
  }

  .mh-checkbox-label input[type="checkbox"] {
    cursor: pointer;
    accent-color: var(--mh-accent);
  }

  /* Search Container */
  .mh-search-container {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    padding: 6px 12px;
  }

  .mh-search-container:focus-within {
    border-color: var(--mh-accent);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
  }

  #mh-search-input, #mh-search-input-presensi {
    background: transparent;
    border: none;
    outline: none;
    color: var(--mh-text-main);
    font-family: var(--mh-font);
    font-size: 0.8rem;
    flex: 1;
  }

  #mh-search-input::placeholder, #mh-search-input-presensi::placeholder {
    color: var(--mh-text-muted);
  }

  .mh-search-icon {
    font-size: 0.8rem;
    color: var(--mh-text-muted);
    cursor: default;
    pointer-events: none;
  }

  /* Quick Actions */
  .mh-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .mh-actions.single {
    grid-template-columns: 1fr;
  }

  .mh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.02));
    color: #fff;
    font-family: var(--mh-font);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mh-btn:hover {
    border-color: var(--mh-accent);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.05));
    box-shadow: 0 0 12px var(--mh-accent-glow);
    transform: translateY(-1px);
  }

  .mh-btn.success-btn {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.02));
  }

  .mh-btn.success-btn:hover {
    border-color: var(--mh-success);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.05));
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
  }

  /* Scroll List of Courses */
  .mh-list-section {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .mh-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Premium Scrollbar Styling for all scrollable elements */
  #mentari-helper-root *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  #mentari-helper-root *::-webkit-scrollbar-track {
    background: transparent;
  }

  #mentari-helper-root *::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    transition: background 0.2s ease;
  }

  #mentari-helper-root *::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* Course Card */
  .mh-course-card {
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mh-course-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .mh-course-card-title {
    font-weight: 600;
    color: var(--mh-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    font-size: 0.82rem;
  }

  .mh-course-card-sub {
    color: var(--mh-text-muted);
    font-size: 0.72rem;
    margin-top: 2px;
  }

  .mh-badge {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .mh-badge.done {
    color: var(--mh-success);
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .mh-badge.pending {
    color: var(--mh-warning);
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  /* Section Dropdown */
  .mh-section-dropdown {
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.025);
    overflow: hidden;
    margin-top: 4px;
  }

  .mh-section-header {
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.005);
    user-select: none;
    transition: background 0.2s;
  }

  .mh-section-header:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .mh-section-title {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--mh-text-main);
  }

  .mh-section-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mh-chevron {
    font-size: 0.7rem;
    color: var(--mh-text-muted);
    transition: transform 0.2s;
  }

  .mh-section-dropdown.expanded .mh-chevron {
    transform: rotate(180deg);
  }

  .mh-section-body {
    display: none;
    padding: 8px 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.02);
    flex-direction: column;
    gap: 6px;
    background: rgba(0, 0, 0, 0.08);
  }

  .mh-section-dropdown.expanded .mh-section-body {
    display: flex;
  }

  /* Child Menu Items */
  .mh-child-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.76rem;
    text-decoration: none;
    color: var(--mh-text-muted);
    padding: 5px 6px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .mh-child-item:hover {
    color: var(--mh-text-main);
    background: rgba(255, 255, 255, 0.03);
  }

  .mh-child-item.completed {
    color: var(--mh-success);
  }

  .mh-child-item-icon {
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
  }

  .mh-child-item-title {
    flex: 1;
    font-weight: 500;
  }

  .mh-link-icon {
    font-size: 0.65rem;
    opacity: 0.3;
    transition: opacity 0.2s;
  }

  .mh-child-item:hover .mh-link-icon {
    opacity: 0.8;
  }

  /* Forum Subtopics list */
  .mh-subtopics-list {
    margin-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    padding-left: 10px;
    margin-top: -2px;
    margin-bottom: 4px;
  }

  .mh-subtopic-link {
    font-size: 0.72rem;
    color: var(--mh-text-muted);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px;
  }

  .mh-subtopic-link:hover {
    color: var(--mh-accent);
  }

  /* Attendance Styling */
  .mh-attendance-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
    padding: 6px 8px;
    background: rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.02);
  }

  .mh-attendance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.74rem;
    padding: 4px 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.015);
  }

  .mh-attendance-row:last-child {
    border-bottom: none;
  }

  .mh-att-sec {
    font-weight: 600;
    color: var(--mh-text-main);
  }

  .mh-att-details {
    color: var(--mh-text-muted);
    font-size: 0.7rem;
    text-align: right;
  }

  .mh-att-status {
    padding: 1px 5px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.68rem;
  }

  .mh-att-status.hadir {
    color: var(--mh-success);
    background: rgba(16, 185, 129, 0.12);
  }

  .mh-att-status.alpa {
    color: var(--mh-warning);
    background: rgba(245, 158, 11, 0.12);
  }

  /* Window Footer status bar */
  .mh-footer {
    height: 28px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-size: 0.68rem;
    color: var(--mh-text-muted);
    font-weight: 500;
    user-select: none;
  }

  /* Toasts */
  .mh-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
    background: rgba(22, 28, 38, 0.95);
    border: 1px solid var(--mh-success);
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.2);
    font-family: var(--mh-font);
    font-size: 0.9rem;
    font-weight: 600;
    z-index: 999999;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
  }

  .mh-toast.active {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  /* Automate Floating Button */
  .mh-automate-float-btn {
    margin-bottom: 12px;
    padding: 10px 18px;
    border-radius: 20px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2);
    color: #fff;
    font-family: var(--mh-font);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    pointer-events: auto;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
    animation: mh-pulse-glow 2s infinite;
  }

  @keyframes mh-pulse-glow {
    0% {
      box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2);
    }
    50% {
      box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.5);
    }
    100% {
      box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2);
    }
  }

  .mh-automate-float-btn:hover {
    transform: scale(1.05) translateY(-2px);
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    box-shadow: 0 12px 40px 0 rgba(59, 130, 246, 0.5), 0 0 25px rgba(139, 92, 246, 0.6);
  }

  .mh-automate-float-btn.running {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-color: rgba(255, 255, 255, 0.2);
    animation: mh-pulse-running 1.5s infinite;
    cursor: not-allowed;
  }

  @keyframes mh-pulse-running {
    0% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.02); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
  }

  .mh-automate-float-btn.success {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(16, 185, 129, 0.3);
    cursor: default;
  }

  .mh-automate-float-btn.error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(239, 68, 68, 0.3);
  }

  /* Active Automate Card */
  .mh-active-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.04));
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .mh-active-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--mh-accent);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mh-active-card-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--mh-text-main);
  }

  .mh-active-card-action {
    display: flex;
    gap: 8px;
  }

  /* Keuangan Card with Premium Hover Styles */
  .mh-keuangan-card {
    margin-bottom: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    border-left: 3px solid var(--mh-accent);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mh-keuangan-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(59, 130, 246, 0.25);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  /* GPA Summary Card & Items */
  .mh-gpa-summary-card {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .mh-gpa-summary-item {
    flex: 1;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05));
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }

  .mh-gpa-val {
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    margin-bottom: 4px;
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .mh-gpa-lbl {
    font-size: 0.72rem;
    color: var(--mh-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* GPA Semester Box & Rows */
  .mh-semester-box {
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
    transition: border-color 0.2s ease;
  }

  .mh-semester-box:hover {
    border-color: rgba(59, 130, 246, 0.25);
  }

  .mh-semester-header {
    background: rgba(255, 255, 255, 0.025);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    user-select: none;
  }

  .mh-semester-body {
    padding: 12px;
    display: none;
    flex-direction: column;
    gap: 8px;
  }

  .mh-semester-box.expanded .mh-semester-body {
    display: flex;
  }

  .mh-semester-box.expanded .mh-semester-chevron {
    transform: rotate(180deg);
  }

  .mh-gpa-row-readonly {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.78rem;
  }

  .mh-gpa-course-name {
    font-weight: 600;
    color: var(--mh-text-main);
  }

  .mh-gpa-course-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mh-gpa-course-sks {
    color: var(--mh-text-muted);
    font-weight: 500;
    font-size: 0.72rem;
  }

  /* Grade Badge Coloring */
  .mh-grade-badge {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    display: inline-block;
    text-align: center;
    min-width: 16px;
  }

  .mh-grade-badge.grade-a {
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .mh-grade-badge.grade-b {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .mh-grade-badge.grade-c {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .mh-grade-badge.grade-d, .mh-grade-badge.grade-e {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  /* Batch Downloader Style */
  .mh-materi-download-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.015);
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 6px 10px;
    margin-top: 8px;
  }
  
  .mh-download-status-text {
    font-size: 0.72rem;
    color: var(--mh-text-muted);
  }
`;
document.head.appendChild(styleElement);


// Decodes JWT Payload
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Robust token lookup from storage items
function getAuthToken() {
  const keys = ['access', 'token', 'auth_token', 'authToken', 'access_token', 'accessToken', 'mentari_auth_token'];
  
  // Helper to clean token and extract JWT
  const cleanToken = (val) => {
    if (!val || typeof val !== 'string') return null;
    let t = val.trim();
    
    // Strip Quasar Framework prefix if present (crucial for MyUnpam Quasar framework storage)
    if (t.includes("__q_strn|")) {
      t = t.split("__q_strn|")[1];
    }
    
    // Strip JSON quotes if present
    if (t.startsWith('"') && t.endsWith('"')) {
      try { t = JSON.parse(t); } catch(e) { t = t.slice(1, -1); }
    }
    t = t.trim();
    
    // Strip Bearer prefix if present
    if (t.startsWith('Bearer ')) {
      t = t.substring(7).trim();
    }
    
    // Regex scan to extract exact JWT token (starts with eyJ)
    const match = t.match(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_+/=]+/);
    return match ? match[0] : null;
  };

  // Try known keys first
  for (const key of keys) {
    let val = localStorage.getItem(key) || sessionStorage.getItem(key);
    let token = cleanToken(val);
    if (token) return token;
  }

  // Scan all localStorage for JWT
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    let val = localStorage.getItem(key);
    let token = cleanToken(val);
    if (token) return token;
  }

  // Scan all sessionStorage for JWT
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    let val = sessionStorage.getItem(key);
    let token = cleanToken(val);
    if (token) return token;
  }

  // Scan document.cookie
  let token = cleanToken(document.cookie);
  if (token) return token;

  return null;
}

// Show Custom Toast Notification
function showToast(message, isError = false) {
  let toast = document.getElementById('mh-toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mh-toast-notification';
    toast.className = 'mh-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.borderColor = isError ? 'var(--mh-warning)' : 'var(--mh-success)';
  toast.style.boxShadow = isError ? '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(245, 158, 11, 0.2)' : '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.2)';
  
  setTimeout(() => toast.classList.add('active'), 100);
  setTimeout(() => toast.classList.remove('active'), 3500);
}

// Create and Inject Widget DOM
function buildWidget() {
  if (document.getElementById('mentari-helper-root')) return;

  const root = document.createElement('div');
  root.id = 'mentari-helper-root';

  const panelTitle = isMyUnpam ? "MYUNPAM HELPER" : "MENTARI HELPER";
  const checkboxHtml = isMyUnpam ? '' : `
    <!-- Filter Controls -->
    <div class="mh-controls">
      <label class="mh-checkbox-label">
        <input type="checkbox" id="mh-hide-completed-checkbox" checked>
        <span>Sembunyikan Kelas Selesai</span>
      </label>
    </div>
  `;

  const actionsHtml = isMyUnpam ? `
    <div class="mh-actions single">
      <button class="mh-btn success-btn" id="mh-action-load-presensi">
        <span>📊</span> Muat Kehadiran Mahasiswa
      </button>
    </div>
  ` : `
    <div class="mh-actions">
      <button class="mh-btn success-btn" id="mh-action-kuesioner">
        <span>📋</span> Auto Kuesioner (DOM)
      </button>
      <button class="mh-btn" id="mh-action-goto-presensi">
        <span>📅</span> Presensi MyUnpam
      </button>
    </div>
  `;

  const profileHtml = isMyUnpam ? '' : `
        <!-- Profile Card -->
        <div class="mh-profile">
          <div class="mh-avatar" id="mh-avatar-initial">U</div>
          <div class="mh-profile-info">
            <h4 id="mh-profile-name">Pengguna Belum Login</h4>
            <p id="mh-profile-nim">Buka situs & Login</p>
          </div>
        </div>
  `;

  // Gemini settings removed

  root.innerHTML = `
    <!-- Dashboard Panel -->
    <div class="mh-panel" id="mh-dashboard-panel">
      <!-- Title Bar -->
      <div class="mh-title-bar" id="mh-panel-header">
        <div class="mh-window-dots">
          <span class="mh-dot red" id="mh-close-panel"></span>
          <span class="mh-dot yellow"></span>
          <span class="mh-dot green"></span>
        </div>
        <div class="mh-title-text">${panelTitle}</div>
        <div class="mh-status-indicator">
          <span class="mh-status-dot" style="background: var(--mh-success); box-shadow: 0 0 8px var(--mh-success);"></span>
          <span class="mh-status-text" style="color: var(--mh-text-main); font-weight: 600;">Ready</span>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="mh-panel-layout">
        <!-- Sidebar (Left) -->
        <div class="mh-sidebar">
          <!-- Dashboard selalu tampil -->
          <div class="mh-sidebar-section">
            <div class="mh-sidebar-header">${isMyUnpam ? 'MyUnpam' : 'E-Learning'}</div>
            <div class="mh-sidebar-item active" data-tab="dashboard">
              <span class="mh-sidebar-icon">🏠</span>
              <span class="mh-sidebar-label">Dashboard</span>
            </div>
            ${!isMyUnpam ? `
            <div class="mh-sidebar-item" data-tab="kelas">
              <span class="mh-sidebar-icon">📚</span>
              <span class="mh-sidebar-label">Daftar Kelas</span>
            </div>
            ` : ''}
          </div>

          ${isMyUnpam ? `
          <div class="mh-sidebar-section">
            <div class="mh-sidebar-header">Akademik</div>
            <div class="mh-sidebar-item" data-tab="presensi">
              <span class="mh-sidebar-icon">📊</span>
              <span class="mh-sidebar-label">Jadwal & Presensi</span>
            </div>
            <div class="mh-sidebar-item" data-tab="nilai">
              <span class="mh-sidebar-icon">📈</span>
              <span class="mh-sidebar-label">Rangkuman Nilai</span>
            </div>
            <div class="mh-sidebar-item" data-tab="keuangan">
              <span class="mh-sidebar-icon">💳</span>
              <span class="mh-sidebar-label">Keuangan</span>
            </div>
            <div class="mh-sidebar-item" data-tab="krs">
              <span class="mh-sidebar-icon">🔍</span>
              <span class="mh-sidebar-label">KRS & Kelas</span>
            </div>
            <div class="mh-sidebar-item" data-tab="tugas-akhir">
              <span class="mh-sidebar-icon">🎓</span>
              <span class="mh-sidebar-label">Tugas Akhir</span>
            </div>
            <div class="mh-sidebar-item" data-tab="biodata">
              <span class="mh-sidebar-icon">👤</span>
              <span class="mh-sidebar-label">Profil & Akademik</span>
            </div>
            <div class="mh-sidebar-item" data-tab="informasi">
              <span class="mh-sidebar-icon">📢</span>
              <span class="mh-sidebar-label">Informasi</span>
            </div>
          </div>
          ` : ''}

          <div class="mh-sidebar-section">
            <div class="mh-sidebar-header">Asisten</div>
            <div class="mh-sidebar-item" data-tab="settings">
              <span class="mh-sidebar-icon">⚙️</span>
              <span class="mh-sidebar-label">Settings</span>
            </div>
          </div>
        </div>

        <!-- Content Pane (Right) -->
        <div class="mh-content-pane">
          
          <!-- Tab: Dashboard -->
          <div class="mh-tab-content active" id="mh-tab-dashboard">
            <div class="mh-welcome-banner">
              <div class="mh-welcome-badge">Local Build</div>
              <h3>Welcome back, <span id="mh-welcome-name">User</span>!</h3>
              <p id="mh-welcome-subtitle">Buka halaman tugas untuk memicu otomatisasi sekali klik.</p>
            </div>
            
            ${profileHtml}

            <!-- Active Page Automation Card -->
            <div id="mh-active-automate-card" style="display: none; margin-bottom: 12px;"></div>

            <div class="mh-card-section-title">Aksi Cepat</div>
            ${actionsHtml}
          </div>

          <!-- Tab: Kelas -->
          <div class="mh-tab-content" id="mh-tab-kelas">
            <div class="mh-search-row">
              <div class="mh-search-container">
                <input type="text" id="mh-search-input" placeholder="Cari mata kuliah...">
                <span class="mh-search-icon">🔍</span>
              </div>
              ${checkboxHtml}
            </div>

            <div class="mh-list-section">
              <div class="mh-list" id="mh-courses-container">
                <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">
                  Memuat data kelas...
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Presensi -->
          <div class="mh-tab-content" id="mh-tab-presensi">
            <div class="mh-search-row">
              <div class="mh-search-container">
                <input type="text" id="mh-search-input-presensi" placeholder="Cari mata kuliah presensi...">
                <span class="mh-search-icon">🔍</span>
              </div>
              <button class="mh-btn success-btn" id="mh-action-load-presensi-tab" style="margin: 0; min-width: 180px;">
                <span>📊</span> Muat Rekap Presensi
              </button>
            </div>

            <div class="mh-list-section">
              <div class="mh-list" id="mh-presensi-container">
                <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">
                  Mata kuliah tidak ditemukan atau rekap belum dimuat. Klik tombol di atas untuk memuat data dari MyUnpam.
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Nilai -->
          <div class="mh-tab-content" id="mh-tab-nilai">
            <div id="mh-gpa-student-info" style="display: none; margin-bottom: 12px;"></div>
            <div class="mh-gpa-summary-card">
              <div class="mh-gpa-summary-item">
                <span class="mh-gpa-val" id="mh-gpa-summary-ipk">0.00</span>
                <span class="mh-gpa-lbl">IP Kumulatif (IPK)</span>
              </div>
              <div class="mh-gpa-summary-item">
                <span class="mh-gpa-val" id="mh-gpa-summary-sks">0</span>
                <span class="mh-gpa-lbl">Total SKS</span>
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button class="mh-btn success-btn" id="mh-btn-load-grades-auto" style="flex: 1; margin: 0;">
                🔄 Muat Rangkuman Nilai
              </button>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button class="mh-btn" id="mh-btn-print-rangkuman" style="flex: 1; margin: 0; font-size: 0.74rem; background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.2);">
                🖨️ Cetak Rangkuman Nilai (PDF)
              </button>
            </div>
            <div class="mh-list-section" id="mh-gpa-semesters-container">
              <!-- Rendered dynamic semesters -->
            </div>
          </div>

          <!-- Tab: Keuangan -->
          <div class="mh-tab-content" id="mh-tab-keuangan">
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px;">
              <h3 style="font-size: 1.05rem;">💳 Keuangan & Pembayaran</h3>
              <p style="margin: 0; padding: 0; font-size: 0.78rem; color: var(--mh-text-muted);">Monitor status transaksi SPP dan tagihan kuliah Anda langsung dari MyUnpam.</p>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button class="mh-btn success-btn" id="mh-btn-load-keuangan" style="flex: 1; margin: 0;">📊 Sinkronisasi Data Keuangan</button>
              <button class="mh-btn" id="mh-btn-print-invoice" style="margin: 0;">🖨️ Ke Halaman Keuangan</button>
            </div>
            <div class="mh-list-section" id="mh-keuangan-container">
              <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Klik tombol di atas untuk memuat riwayat pembayaran keuangan Anda.</div>
            </div>
          </div>

          <!-- Tab: KRS & Kelas -->
          <div class="mh-tab-content" id="mh-tab-krs">
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px;">
              <h3 style="font-size: 1.05rem;">🔍 Pencari Kelas & KRS</h3>
              <p style="margin: 0; padding: 0; font-size: 0.78rem; color: var(--mh-text-muted);">Sinkronisasi KRS aktif dan cari jadwal kelas yang tersedia.</p>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button class="mh-btn success-btn" id="mh-btn-load-krs-aktif" style="flex: 1; margin: 0; font-size: 0.74rem;">📚 Sinkronisasi KRS Aktif</button>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <input type="text" id="mh-krs-search-input" placeholder="Masukkan nama/kode mata kuliah..." style="flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 0.8rem; outline: none; font-family: var(--mh-font);">
              <button class="mh-btn success-btn" id="mh-btn-search-kelas" style="margin: 0;">Cari Kelas</button>
            </div>
            <div class="mh-list-section" id="mh-krs-aktif-container" style="margin-bottom: 12px;"></div>
            <div class="mh-list-section" id="mh-krs-results-container">
              <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Gunakan input pencarian di atas untuk mencari jadwal kelas yang tersedia.</div>
            </div>
          </div>

          <!-- Tab: Tugas Akhir -->
          <div class="mh-tab-content" id="mh-tab-tugas-akhir">
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px;">
              <h3 style="font-size: 1.05rem;">🎓 Tugas Akhir & Skripsi</h3>
              <p style="margin: 0; padding: 0; font-size: 0.78rem; color: var(--mh-text-muted);">Pantau judul pengajuan, kuota pembimbing, dan riwayat bimbingan Anda.</p>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button class="mh-btn success-btn" id="mh-btn-load-ta" style="flex: 1; margin: 0;">📊 Sinkronisasi Status Skripsi</button>
            </div>
            <div class="mh-list-section" id="mh-ta-container">
              <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Klik tombol di atas untuk memuat status dan riwayat bimbingan skripsi.</div>
            </div>
          </div>

          <!-- Tab: Biodata & Akademik -->
          <div class="mh-tab-content" id="mh-tab-biodata">
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px;">
              <h3 style="font-size: 1.05rem;">👤 Profil & Rekam Akademik</h3>
              <p style="margin: 0; padding: 0; font-size: 0.78rem; color: var(--mh-text-muted);">Lihat data profil mahasiswa, IPK berjalan, dan progres IPS per semester.</p>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button class="mh-btn success-btn" id="mh-btn-load-biodata" style="flex: 1; margin: 0;">🔄 Sinkronisasi Profil & Akademik</button>
            </div>
            <div id="mh-biodata-container">
              <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Klik tombol di atas untuk memuat data profil dan riwayat akademik Anda.</div>
            </div>
          </div>

          <!-- Tab: Informasi -->
          <div class="mh-tab-content" id="mh-tab-informasi">
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); margin-bottom: 12px;">
              <h3 style="font-size: 1.05rem;">📢 Informasi & Ketentuan Umum</h3>
              <p style="margin: 0; padding: 0; font-size: 0.78rem; color: var(--mh-text-muted);">Informasi resmi, kode etik, panduan registrasi, dan kalender akademik Universitas Pamulang.</p>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button class="mh-btn success-btn" id="mh-btn-load-informasi" style="flex: 1; margin: 0;">🔄 Sinkronisasi Informasi Kampus</button>
            </div>
            <div class="mh-list-section" id="mh-informasi-container">
              <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Klik tombol di atas untuk memuat daftar informasi dan dokumen panduan resmi.</div>
            </div>
          </div>

          <!-- Tab: Settings -->
          <div class="mh-tab-content" id="mh-tab-settings">
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05);">
              <h3 style="font-size: 1rem;">Status Diagnostik</h3>
              <div class="mh-settings-list" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;">
                  <span style="color: var(--mh-text-muted);">Extension Mode</span>
                  <span style="color: var(--mh-success); font-weight: bold;">Browser-Native (No-Bridge)</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding-bottom: 2px;">
                  <span style="color: var(--mh-text-muted);">JWT Authorization Token</span>
                  <span id="mh-settings-token-status" style="color: var(--mh-success); font-weight: bold;">Detected</span>
                </div>
              </div>
            </div>
            <div class="mh-welcome-banner" style="background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.05); margin-top: 12px;">
              <h3 style="font-size: 1.05rem; margin-bottom: 8px;">Informasi Penggunaan</h3>
              <p style="margin: 0; padding: 0; font-size: 0.78rem; color: var(--mh-text-muted); line-height: 1.6;">
                Otomatisasi kuis berjalan sepenuhnya secara lokal di dalam browser Anda menggunakan API resmi Mentari UNPAM. Tidak ada data pribadi atau token JWT yang dikirimkan ke luar server unpam.ac.id.
              </p>
            </div>
          </div>

        </div><!-- end .mh-content-pane -->
      </div><!-- end .mh-panel-layout -->

      <!-- Footer status bar -->
      <div class="mh-footer">
        <div class="mh-footer-left">🟢 Ready | Mentari Helper Local Build</div>
        <div class="mh-footer-right">v1.0.0 | Press toggle to close</div>
      </div>
    </div>

    <!-- Automate Floating Button -->
    <div class="mh-automate-float-btn" id="mh-automate-float-btn" style="display: none;">
      <span>🤖</span> Automate
    </div>

    <!-- Toggle Button -->
    <div class="mh-toggle-btn" id="mh-dashboard-toggle">
      <svg viewBox="0 0 24 24">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    </div>
  `;
  document.body.appendChild(root);

  setupWidgetEventListeners();
  loadWidgetData();
}

// Fetch forum topics dynamically when section is expanded
async function loadForumTopics(kodeCourse, forumId, topicsContainerId) {
  const container = document.getElementById(topicsContainerId);
  if (!container) return;

  container.innerHTML = '<div style="font-size: 0.7rem; color: var(--mh-text-muted); padding: 2px 4px;">Loading topik forum...</div>';

  try {
    const response = await fetch(`https://mentari.unpam.ac.id/api/forum/topic/${forumId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const res = await response.json();

    if (res && res.topics && res.topics.length > 0) {
      container.innerHTML = res.topics.map(topic => `
        <a href="https://mentari.unpam.ac.id/u-courses/${kodeCourse}/forum/${forumId}/topics/${topic.id}" 
           class="mh-subtopic-link">
          <span>💬</span> ${topic.judul}
        </a>
      `).join('');
    } else {
      container.innerHTML = '<div style="font-size: 0.7rem; color: var(--mh-text-muted); padding: 2px 4px; font-style: italic;">Tidak ada topik diskusi.</div>';
    }
  } catch (e) {
    container.innerHTML = '<div style="font-size: 0.7rem; color: var(--mh-warning); padding: 2px 4px;">Gagal memuat topik forum.</div>';
  }
}

// Fetch kuesioner status dynamically when section is expanded
async function loadKuesionerStatus(kodeCourse, kodeSection, statusIconId, itemLinkId) {
  const icon = document.getElementById(statusIconId);
  const link = document.getElementById(itemLinkId);
  if (!icon) return;

  try {
    const response = await fetch(`https://mentari.unpam.ac.id/api/kuesioner/${kodeCourse}/${kodeSection}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const res = await response.json();

    const questions = res.kuesioner || [];
    
    if (questions.length === 0) {
      icon.textContent = '✅';
      if (link) link.classList.add('completed');
    } else {
      const isCompleted = questions.every(q => q.jawaban !== null);
      if (isCompleted) {
        icon.textContent = '✅';
        if (link) link.classList.add('completed');
      } else {
        icon.textContent = '❌';
        if (link) link.classList.remove('completed');
      }
    }
  } catch (e) {
    icon.textContent = '❓';
  }
}

// Fetch XSRF Token from cookies (MyUnpam only)
function getXsrfToken() {
  let xsrfToken = "";
  const xsrfCookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("XSRF-TOKEN="));
  if (xsrfCookie) {
    xsrfToken = decodeURIComponent(xsrfCookie.split("=")[1]);
  }
  return xsrfToken;
}

// Fetch and display MyUnpam Attendance Data
async function loadMyUnpamAttendance() {
  const container = document.getElementById('mh-presensi-container');
  container.innerHTML = '<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Mengambil jadwal kuliah...</div>';

  try {
    const token = getAuthToken();
    const xsrf = getXsrfToken();
    
    const response = await fetch("https://my.unpam.ac.id/api/presensi/mahasiswa/jadwal-kuliah", {
      headers: {
        "accept": "application/json, text/plain, */*",
        "authorization": `Bearer ${token}`,
        "x-xsrf-token": xsrf
      }
    });

    if (!response.ok) throw new Error(`Jadwal HTTP ${response.status}`);
    const classes = await response.json();

    if (!classes || classes.length === 0) {
      container.innerHTML = '<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Tidak ada jadwal kuliah ditemukan.</div>';
      return;
    }

    container.innerHTML = '<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Memuat rekap absensi...</div>';

    // Fetch attendance for each class in parallel
    const attendancePromises = classes.map(async cls => {
      try {
        const resAtt = await fetch(`https://my.unpam.ac.id/api/presensi/mahasiswa/jadwal-pertemuan/${cls.id_kelas}/${cls.id_mata_kuliah}`, {
          headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${token}`,
            "x-xsrf-token": xsrf
          }
        });
        if (!resAtt.ok) throw new Error();
        const pertList = await resAtt.json();
        return { course: cls, meetings: pertList || [] };
      } catch (e) {
        return { course: cls, meetings: [], error: true };
      }
    });

    allAttendanceData = await Promise.all(attendancePromises);
    renderAttendance();
    updateScheduleAndCountdown();

  } catch (e) {
    container.innerHTML = `<div class="mh-list-item" style="color: var(--mh-warning); text-align: center;">Gagal memuat presensi: ${e.message}</div>`;
  }
}

// Render Attendance list inside the courses list container
function renderAttendance(searchQuery = '') {
  const container = document.getElementById('mh-presensi-container');
  if (!container) return;

  const filtered = allAttendanceData.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.course.nama_mata_kuliah.toLowerCase().includes(q);
    }
    return true;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Mata kuliah tidak ditemukan.</div>';
    return;
  }

  filtered.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = 'mh-course-card';

    const total = c.meetings.length;
    const present = c.meetings.filter(p => p.presensi_status === 'hadir').length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    const statusClass = percent >= 80 ? 'done' : 'pending';
    const statusText = `${present}/${total} Hadir (${percent}%)`;

    let meetingsHtml = '';
    if (c.meetings.length > 0) {
      meetingsHtml = '<div class="mh-attendance-list">';
      c.meetings.forEach((m, mIdx) => {
        const dateStr = m.tanggal_mulai ? new Date(m.tanggal_mulai).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-';
        const stClass = m.presensi_status === 'hadir' ? 'hadir' : 'alpa';
        const stText = m.presensi_status === 'hadir' ? 'Hadir' : 'Alpa';
        meetingsHtml += `
          <div class="mh-attendance-row">
            <span class="mh-att-sec">Pertemuan ${mIdx + 1}</span>
            <span class="mh-att-details">${m.jenis_perkuliahan || 'Online'} | ${dateStr}</span>
            <span class="mh-att-status ${stClass}">${stText}</span>
          </div>
        `;
      });
      meetingsHtml += '</div>';
    } else {
      meetingsHtml = `<div class="mh-no-tasks">${c.error ? 'Gagal memuat detail pertemuan' : 'Tidak ada detail pertemuan'}</div>`;
    }

    const secId = `att-dropdown-${idx}`;

    card.innerHTML = `
      <div class="mh-section-dropdown" id="${secId}">
        <div class="mh-section-header">
          <span class="mh-section-title" title="${c.course.nama_mata_kuliah}">${c.course.nama_mata_kuliah}</span>
          <div class="mh-section-info">
            <span class="mh-badge ${statusClass}">${statusText}</span>
            <span class="mh-chevron">&#9662;</span>
          </div>
        </div>
        <div class="mh-section-body">
          ${meetingsHtml}
        </div>
      </div>
    `;

    container.appendChild(card);

    // Click handler to expand attendance
    card.querySelector('.mh-section-header').addEventListener('click', () => {
      card.querySelector('.mh-section-dropdown').classList.toggle('expanded');
    });
  });
}

// Logic to render course lists with filtering support (Mentari Only)
function renderCourses(searchQuery = '') {
  const container = document.getElementById('mh-courses-container');
  if (!container) return;

  const filtered = allProcessedCourses.filter(c => {
    if (hideCompleted && c.isFullyCompleted) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.course.nama_mata_kuliah.toLowerCase().includes(q);
      const matchDosen = c.course.nama_dosen.toLowerCase().includes(q);
      return matchTitle || matchDosen;
    }
    
    return true;
  });

  container.innerHTML = '';
  
  if (filtered.length === 0) {
    if (searchQuery) {
      container.innerHTML = `<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Mata kuliah tidak ditemukan.</div>`;
    } else {
      container.innerHTML = `<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 20px;">Semua kelas sudah lengkap dikerjakan! 🎉</div>`;
    }
    return;
  }

  filtered.forEach((c, cIdx) => {
    const statusClass = c.isFullyCompleted ? 'done' : 'pending';
    const statusText = c.isFullyCompleted ? 'Lengkap' : `${c.completedTasks}/${c.totalTasks} Selesai`;

    const card = document.createElement('div');
    card.className = 'mh-course-card';
    
    let sectionsHtml = '';
    if (c.sectionsList.length > 0) {
      c.sectionsList.forEach((sec, sIdx) => {
        const secId = `sec-${cIdx}-${sIdx}`;
        const forumId = sec.forum ? sec.forum.id : '';
        
        let childItemsHtml = '';
        
        if (sec.pretest) {
          childItemsHtml += `
            <a href="https://mentari.unpam.ac.id/u-courses/${c.course.kode_course}/exam/${sec.pretest.id}" class="mh-child-item ${sec.pretest.completion ? 'completed' : ''}">
              <span class="mh-child-item-icon">${sec.pretest.completion ? '✅' : '❌'}</span>
              <span class="mh-child-item-title">Pre-test</span>
              <span class="mh-link-icon">&#x2197;</span>
            </a>
          `;
        }
        
        if (sec.forum) {
          childItemsHtml += `
            <a href="https://mentari.unpam.ac.id/u-courses/${c.course.kode_course}/forum/${sec.forum.id}" class="mh-child-item ${sec.forum.completion ? 'completed' : ''}">
              <span class="mh-child-item-icon">${sec.forum.completion ? '✅' : '❌'}</span>
              <span class="mh-child-item-title">Forum Diskusi</span>
              <span class="mh-link-icon">&#x2197;</span>
            </a>
            <!-- Topics Container -->
            <div class="mh-subtopics-list" id="mh-topics-${secId}" style="display: none;"></div>
          `;
        }
        
        if (sec.posttest) {
          childItemsHtml += `
            <a href="https://mentari.unpam.ac.id/u-courses/${c.course.kode_course}/exam/${sec.posttest.id}" class="mh-child-item ${sec.posttest.completion ? 'completed' : ''}">
              <span class="mh-child-item-icon">${sec.posttest.completion ? '✅' : '❌'}</span>
              <span class="mh-child-item-title">Post-test</span>
              <span class="mh-link-icon">&#x2197;</span>
            </a>
          `;
        }
        
        childItemsHtml += `
          <a href="https://mentari.unpam.ac.id/u-courses/${c.course.kode_course}/kuesioner/${sec.kodeSection}" class="mh-child-item" id="mh-kue-link-${secId}">
            <span class="mh-child-item-icon" id="mh-kue-status-${secId}">⏳</span>
            <span class="mh-child-item-title">Kuesioner</span>
            <span class="mh-link-icon">&#x2197;</span>
          </a>
        `;

        const secStatusClass = sec.isComplete ? 'done' : 'pending';
        const secStatusText = sec.isComplete ? 'Lengkap' : 'Incomplete';

        sectionsHtml += `
          <div class="mh-section-dropdown" data-course="${c.course.kode_course}" data-section="${sec.kodeSection}" data-forum="${forumId}" data-id="${secId}">
            <div class="mh-section-header">
              <span class="mh-section-title">${sec.name}</span>
              <div class="mh-section-info">
                <span class="mh-badge ${secStatusClass}">${secStatusText}</span>
                <span class="mh-chevron">&#9662;</span>
              </div>
            </div>
            <div class="mh-section-body">
              ${childItemsHtml}
            </div>
          </div>
        `;
      });
    } else {
      sectionsHtml = `<div class="mh-no-tasks">Tidak ada pertemuan aktif terdeteksi</div>`;
    }

    card.innerHTML = `
      <div class="mh-course-card-header">
        <div class="mh-course-card-title" title="${c.course.nama_mata_kuliah}">${c.course.nama_mata_kuliah}</div>
        <span class="mh-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="mh-course-card-sub">Dosen: ${c.course.nama_dosen.split(',')[0]} ${c.dayOfWeek ? `(${c.dayOfWeek})` : ''}</div>
      ${sectionsHtml}
      ${c.allFiles && c.allFiles.length > 0 ? `
        <div class="mh-materi-download-row">
          <span class="mh-download-status-text" id="mh-dl-status-${cIdx}">Tersedia ${c.allFiles.length} file materi</span>
          <button class="mh-btn" id="mh-btn-dl-${cIdx}" style="padding: 4px 10px; font-size: 0.72rem; margin: 0;">
            📥 Unduh Semua
          </button>
        </div>
      ` : ''}
    `;
    
    container.appendChild(card);

    if (c.allFiles && c.allFiles.length > 0) {
      const dlBtn = card.querySelector(`#mh-btn-dl-${cIdx}`);
      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadAllCourseMaterials(c.course.nama_mata_kuliah, c.allFiles, `mh-btn-dl-${cIdx}`, `mh-dl-status-${cIdx}`);
        });
      }
    }
  });

  // Re-attach Accordion Trigger Listeners
  container.querySelectorAll('.mh-section-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const dropdown = e.target.closest('.mh-section-dropdown');
      const id = dropdown.getAttribute('data-id');
      const kodeCourse = dropdown.getAttribute('data-course');
      const kodeSection = dropdown.getAttribute('data-section');
      const forumId = dropdown.getAttribute('data-forum');
      
      const isExpanded = dropdown.classList.toggle('expanded');
      
      if (isExpanded) {
        if (forumId) {
          const topicsContainerId = `mh-topics-${id}`;
          const topicsContainer = document.getElementById(topicsContainerId);
          if (topicsContainer) {
            topicsContainer.style.display = 'flex';
            loadForumTopics(kodeCourse, forumId, topicsContainerId);
          }
        }
        loadKuesionerStatus(kodeCourse, kodeSection, `mh-kue-status-${id}`, `mh-kue-link-${id}`);
      }
    });
  });
}

// Logic to load user profile and course list
async function loadWidgetData() {
  if (!isExtensionValid()) return;
  authToken = getAuthToken();
  
  if (!authToken) {
    // Coba ambil dari chrome.storage.local sebagai fallback
    if (isExtensionValid()) {
      const stored = await new Promise(resolve => {
        chrome.storage.local.get(['token', 'userData'], resolve);
      });
      if (stored && stored.token) {
        authToken = stored.token;
        userData = stored.userData;
        console.log("[Mentari Helper] Token dimuat dari Chrome Storage.");
      }
    }
  }

  if (!authToken) {
    console.log("[Mentari Helper] Token tidak terdeteksi di LocalStorage maupun Chrome Storage.");
    const nameEl = document.getElementById('mh-profile-name');
    const nimEl = document.getElementById('mh-profile-nim');
    if (nameEl) nameEl.textContent = "Belum Terkoneksi";
    if (nimEl) nimEl.textContent = "Buka & refresh mentari.unpam.ac.id";
    document.getElementById('mh-courses-container').innerHTML = `
      <div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center; padding: 15px;">
        Ekstensi belum sinkron. Silakan buka halaman <a href="https://mentari.unpam.ac.id/" target="_blank" style="color: var(--mh-accent); text-decoration: underline;">Mentari E-Learning</a> dan refresh halaman tersebut agar token dapat terdeteksi.
      </div>
    `;
    return;
  }

  if (!userData) {
    userData = decodeToken(authToken);
  }
  if (userData) {
    const nameEl = document.getElementById('mh-profile-name');
    const nimEl = document.getElementById('mh-profile-nim');
    const avatarEl = document.getElementById('mh-avatar-initial');
    if (nameEl) nameEl.textContent = userData.fullname || "User";
    const welcomeNameEl = document.getElementById('mh-welcome-name');
    if (welcomeNameEl) {
      welcomeNameEl.textContent = userData.fullname ? userData.fullname.split(' ')[0] : "User";
    }
    if (nimEl) nimEl.textContent = `NIM: ${userData.username || "-"}`;
    if (avatarEl) avatarEl.textContent = (userData.fullname || "U").charAt(0).toUpperCase();

    // Cache token & data to extension storage
    if (isExtensionValid()) {
      chrome.storage.local.set({ token: authToken, userData: userData });
    }

    // Handle MyUnpam logic
    if (isMyUnpam) {
      loadMyUnpamAttendance();
      // Load cached data
      chrome.storage.local.get(['keuanganData', 'taData', 'krsData', 'informasiData', 'biodataData'], (res) => {
        if (res.keuanganData) renderKeuangan(res.keuanganData);
        if (res.taData) renderTugasAkhir(res.taData);
        if (res.krsData) renderKrsAktif(res.krsData);
        if (res.informasiData) renderInformasi(res.informasiData);
        if (res.biodataData) renderBiodata(res.biodataData);
      });
      return;
    }

    // Fetch courses list (Mentari Only)
    try {
      const response = await fetch('https://mentari.unpam.ac.id/api/user-course?page=1&limit=50', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const container = document.getElementById('mh-courses-container');

      if (!response.ok) {
        container.innerHTML = `<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Gagal mengambil mata kuliah (HTTP ${response.status}: ${response.statusText}).</div>`;
        return;
      }
      
      const res = await response.json();
      
      if (res && res.data && res.data.length > 0) {
        container.innerHTML = '<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Menganalisis progres kelas...</div>';
        
        // Fetch details of all courses concurrently
        const courseDetailsPromises = res.data.map(course => 
          fetch(`https://mentari.unpam.ac.id/api/user-course/${course.kode_course}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          })
          .then(async r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then(detail => ({ course, detail }))
          .catch(e => ({ course, error: e }))
        );

        const detailsResults = await Promise.all(courseDetailsPromises);
        
        // Prepare courses for sorting by day
        allProcessedCourses = detailsResults.map(({ course, detail, error }) => {
          if (error || !detail || !detail.data) return null;

          // Extract ALL downloadable files/modules
          const allFiles = [];
          detail.data.forEach(sec => {
            if (!sec.sub_section) return;
            sec.sub_section.forEach(sub => {
              if (sub.file) {
                allFiles.push({
                  sectionName: sec.nama_section || sec.kode_section || 'Materi',
                  title: sub.judul || 'Materi',
                  fileId: sub.file
                });
              }
            });
          });

          const courseName = course.nama_mata_kuliah || "";
          const dayMatch = course.coursename ? course.coursename.match(/\(([^)]+)\)/) : null;
          const dayOfWeek = dayMatch ? dayMatch[1] : "";

          // Sort order
          let dayOrder = 7;
          if (dayOfWeek === "Senin") dayOrder = 1;
          else if (dayOfWeek === "Selasa") dayOrder = 2;
          else if (dayOfWeek === "Rabu") dayOrder = 3;
          else if (dayOfWeek === "Kamis") dayOrder = 4;
          else if (dayOfWeek === "Jumat") dayOrder = 5;
          else if (dayOfWeek === "Sabtu") dayOrder = 6;
          else if (dayOfWeek === "Minggu") dayOrder = 0;

          // Parse tasks & sections
          const sectionsList = [];
          let totalTasks = 0;
          let completedTasks = 0;

          const currentWeek = getCurrentWeekNumber();
          const shiftKey = `${course.id_shift || 'E'}-${course.id_periode || '1'}`;
          const activeMeetings = (scheduleMapping[currentWeek] && scheduleMapping[currentWeek][shiftKey] && scheduleMapping[currentWeek][shiftKey][course.sks]) || [];
          const activeMeetingCodes = activeMeetings.map(m => `PERTEMUAN_${m}`);

          const sortedSections = [...detail.data]
            .sort((a, b) => a.sort - b.sort)
            .filter(s => s.nama_section && s.nama_section !== "General")
            .filter(s => activeMeetingCodes.includes(s.kode_section));

          sortedSections.forEach(sec => {
            const coreTasks = sec.sub_section.filter(sub => 
              ['PRE_TEST', 'FORUM_DISKUSI', 'POST_TEST'].includes(sub.kode_template) && sub.id !== null
            );

            if (coreTasks.length === 0) return;

            const isSecComplete = coreTasks.every(t => t.completion);
            totalTasks += coreTasks.length;
            completedTasks += coreTasks.filter(t => t.completion).length;

            const pretest = sec.sub_section.find(sub => sub.kode_template === 'PRE_TEST');
            const forum = sec.sub_section.find(sub => sub.kode_template === 'FORUM_DISKUSI');
            const posttest = sec.sub_section.find(sub => sub.kode_template === 'POST_TEST');

            sectionsList.push({
              name: sec.nama_section,
              kodeSection: sec.kode_section,
              pretest: pretest && pretest.id ? { id: pretest.id, completion: pretest.completion } : null,
              forum: forum && forum.id ? { id: forum.id, completion: forum.completion } : null,
              posttest: posttest && posttest.id ? { id: posttest.id, completion: posttest.completion } : null,
              isComplete: isSecComplete
            });
          });

          const isFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;

          if (sectionsList.length === 0) return null;

          return {
            course,
            dayOfWeek,
            dayOrder,
            sectionsList,
            totalTasks,
            completedTasks,
            isFullyCompleted,
            allFiles
          };
        }).filter(c => c !== null);

        // Sort by day order
        allProcessedCourses.sort((a, b) => a.dayOrder - b.dayOrder);

        // Render initially
        const searchInput = document.getElementById('mh-search-input');
        renderCourses(searchInput ? searchInput.value : '');
      } else {
        container.innerHTML = `<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Tidak ada data mata kuliah.</div>`;
      }
    } catch (e) {
      document.getElementById('mh-courses-container').innerHTML = `<div class="mh-list-item" style="color: var(--mh-text-muted); text-align: center;">Gagal memuat mata kuliah: ${e.message}</div>`;
    }
  }
}

// Set up UI Event Listeners (Dragging, Toggling, Clicking Actions)
function setupWidgetEventListeners() {
  const toggle = document.getElementById('mh-dashboard-toggle');
  const panel = document.getElementById('mh-dashboard-panel');
  const closeBtn = document.getElementById('mh-close-panel');
  const header = document.getElementById('mh-panel-header');
  const kuesionerBtn = document.getElementById('mh-action-kuesioner');
  const hideCompletedCheckbox = document.getElementById('mh-hide-completed-checkbox');
  const searchInput = document.getElementById('mh-search-input');
  const loadPresensiBtn = document.getElementById('mh-action-load-presensi');
  const gotoPresensiBtn = document.getElementById('mh-action-goto-presensi');

  // Sidebar tab switching
  document.querySelectorAll('.mh-sidebar-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const targetItem = e.currentTarget;
      const tabName = targetItem.getAttribute('data-tab');
      
      // Update sidebar active class
      document.querySelectorAll('.mh-sidebar-item').forEach(i => i.classList.remove('active'));
      targetItem.classList.add('active');
      
      // Update tab contents visibility
      document.querySelectorAll('.mh-tab-content').forEach(c => c.classList.remove('active'));
      const activeTabContent = document.getElementById(`mh-tab-${tabName}`);
      if (activeTabContent) activeTabContent.classList.add('active');
    });
  });

  // Action Button: Load Attendance Tab
  const loadPresensiTabBtn = document.getElementById('mh-action-load-presensi-tab');
  if (loadPresensiTabBtn) {
    loadPresensiTabBtn.addEventListener('click', () => {
      loadMyUnpamAttendance();
    });
  }

  // Real-time search for presensi tab
  const searchInputPresensi = document.getElementById('mh-search-input-presensi');
  if (searchInputPresensi) {
    searchInputPresensi.addEventListener('input', (e) => {
      renderAttendance(e.target.value);
    });
  }
  // Action Button: Load Grades
  const loadGradesAutoBtn = document.getElementById('mh-btn-load-grades-auto');
  if (loadGradesAutoBtn) {
    loadGradesAutoBtn.addEventListener('click', () => { fetchMyUnpamGrades(); });
  }

  // Action Button: Print Rangkuman Nilai PDF
  const printRangkumanBtn = document.getElementById('mh-btn-print-rangkuman');
  if (printRangkumanBtn) {
    printRangkumanBtn.addEventListener('click', () => {
      downloadPdf('https://my.unpam.ac.id/api/rangkuman-nilai/cetak', 'rangkuman_nilai.pdf');
    });
  }

  // Action Button: Load Keuangan Data
  const loadKeuanganBtn = document.getElementById('mh-btn-load-keuangan');
  if (loadKeuanganBtn) {
    loadKeuanganBtn.addEventListener('click', () => { fetchMyUnpamKeuangan(); });
  }

  // Action Button: Print Invoice Keuangan
  const printInvoiceBtn = document.getElementById('mh-btn-print-invoice');
  if (printInvoiceBtn) {
    printInvoiceBtn.addEventListener('click', () => {
      window.open('https://my.unpam.ac.id/keuangan', '_blank');
    });
  }

  // Action Button: Search KRS Kelas
  const searchKrsBtn = document.getElementById('mh-btn-search-kelas');
  if (searchKrsBtn) {
    searchKrsBtn.addEventListener('click', () => { searchMyUnpamKelas(); });
  }

  // Action Button: Load KRS Aktif
  const loadKrsAktifBtn = document.getElementById('mh-btn-load-krs-aktif');
  if (loadKrsAktifBtn) {
    loadKrsAktifBtn.addEventListener('click', () => { fetchMyUnpamKrsAktif(); });
  }

  // Action Button: Load Tugas Akhir
  const loadTaBtn = document.getElementById('mh-btn-load-ta');
  if (loadTaBtn) {
    loadTaBtn.addEventListener('click', () => { fetchMyUnpamTugasAkhir(); });
  }

  // Action Button: Load Biodata & Akademik
  const loadBiodataBtn = document.getElementById('mh-btn-load-biodata');
  if (loadBiodataBtn) {
    loadBiodataBtn.addEventListener('click', () => { fetchMyUnpamBiodata(); });
  }

  // Action Button: Load Informasi Kampus
  const loadInformasiBtn = document.getElementById('mh-btn-load-informasi');
  if (loadInformasiBtn) {
    loadInformasiBtn.addEventListener('click', () => { fetchMyUnpamInformasi(); });
  }

  // Toggle Panel
  toggle.addEventListener('click', () => {
    panel.classList.toggle('active');
    toggle.classList.toggle('active');
    if (panel.classList.contains('active')) {
      loadWidgetData();
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('active');
    toggle.classList.remove('active');
  });

  // Checkbox Hide Completed (Mentari only)
  if (hideCompletedCheckbox) {
    hideCompletedCheckbox.addEventListener('change', (e) => {
      hideCompleted = e.target.checked;
      renderCourses(searchInput ? searchInput.value : '');
    });
  }

  // Search input change listener (real-time search)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      if (isMyUnpam) {
        renderAttendance(e.target.value);
      } else {
        renderCourses(e.target.value);
      }
    });
  }

  // Action Button: Load Attendance (MyUnpam only)
  if (loadPresensiBtn) {
    loadPresensiBtn.addEventListener('click', () => {
      loadMyUnpamAttendance();
    });
  }

  // Action Button: Open MyUnpam (Mentari only)
  if (gotoPresensiBtn) {
    gotoPresensiBtn.addEventListener('click', () => {
      window.open('https://my.unpam.ac.id/presensi', '_blank');
    });
  }

  // Dragging is disabled globally for the 70% screen centered modal.

  // Trigger Auto Kuesioner (DOM click simulation - Mentari only)
  if (kuesionerBtn) {
    kuesionerBtn.addEventListener('click', () => {
      const radios = document.querySelectorAll('input[type="radio"][value="1"]');
      if (radios.length === 0) {
        showToast("Tidak ada pertanyaan kuesioner terdeteksi di halaman ini.", true);
        return;
      }

      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      let count = 0;
      radios.forEach((radio) => {
        radio.click();
        radio.checked = true;
        ['change', 'click', 'input'].forEach((type) => {
          radio.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
        });

        const label = radio.closest('.MuiFormControlLabel-root');
        if (label) label.click();
        count++;
      });

      showToast(`Berhasil mengklik ${count} radio button kuesioner!`);

      setTimeout(() => {
        const submitSelectors = [
          'button.MuiButton-containedPrimary',
          'button.MuiButton-contained',
          '.MuiButtonBase-root.MuiButton-containedPrimary'
        ];
        
        let clicked = false;
        for (const sel of submitSelectors) {
          const btn = document.querySelector(sel);
          if (btn && btn.textContent.includes('Submit') && !btn.disabled) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            btn.click();
            clicked = true;
            showToast(`Kuesioner diisi dan dikirim secara otomatis!`);
            break;
          }
        }

        if (!clicked) {
          document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('Submit') && !btn.disabled) {
              btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              btn.click();
              showToast(`Kuesioner dikirim secara otomatis!`);
            }
          });
        }
      }, 500);
    });
  }

  // Automate Floating Button click handler
  const floatBtn = document.getElementById('mh-automate-float-btn');
  if (floatBtn) {
    floatBtn.addEventListener('click', async () => {
      const taskInfo = await getActiveTaskInfo();
      if (taskInfo) {
        const cardBtn = document.getElementById('mh-active-card-btn');
        triggerAutomation(taskInfo, [floatBtn, cardBtn]);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    buildWidget();
  });
} else {
  buildWidget();
}

// Background storage listener to keep token synced
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_kuesioner") {
    const kBtn = document.getElementById('mh-action-kuesioner');
    if (kBtn) {
      kBtn.click();
      sendResponse({ status: "success", count: document.querySelectorAll('input[type="radio"][value="1"]').length });
    } else {
      sendResponse({ status: "error" });
    }
  }
  return true;
});

// --- 3. ACTIVE PAGE AUTOMATION (LOCAL CLI BRIDGE) ---

function findActiveTaskFromStorage(taskId) {
  if (!allProcessedCourses || allProcessedCourses.length === 0) return null;
  for (const c of allProcessedCourses) {
    for (const sec of c.sectionsList) {
      if (sec.pretest && sec.pretest.id === taskId) {
        return {
          kode_course: c.course.kode_course,
          kode_section: sec.kodeSection,
          task_type: 'PRE_TEST',
          id_sub_section: taskId,
          name: `${c.course.nama_mata_kuliah} - ${sec.name} (Pre-Test)`,
          completion: sec.pretest.completion
        };
      }
      if (sec.posttest && sec.posttest.id === taskId) {
        return {
          kode_course: c.course.kode_course,
          kode_section: sec.kodeSection,
          task_type: 'POST_TEST',
          id_sub_section: taskId,
          name: `${c.course.nama_mata_kuliah} - ${sec.name} (Post-Test)`,
          completion: sec.posttest.completion
        };
      }
    }
  }
  return null;
}

async function getActiveTaskInfo() {
  const url = window.location.href;
  
  // Parse URL
  // e.g. https://mentari.unpam.ac.id/u-courses/INF0411-09/exam/12345
  const examMatch = url.match(/\/u-courses\/([^/]+)\/exam\/([^/]+)/);
  if (!examMatch) return null;
  
  const kode_course = examMatch[1];
  const taskId = examMatch[2].split('?')[0]; // strip query params
  const task_type = 'EXAM';
  
  // First try from cached allProcessedCourses
  let found = findActiveTaskFromStorage(taskId);
  if (found) return found;
  
  // If not found in cache, fetch course details directly
  try {
    const token = getAuthToken();
    if (!token) return null;
    
    const response = await fetch(`https://mentari.unpam.ac.id/api/user-course/${kode_course}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const detail = await response.json();
    if (!detail || !detail.data) return null;
    
    // Search in sections
    for (const sec of detail.data) {
      const pretest = sec.sub_section.find(sub => sub.kode_template === 'PRE_TEST');
      const posttest = sec.sub_section.find(sub => sub.kode_template === 'POST_TEST');
      
      if (pretest && pretest.id == taskId) {
        return {
          kode_course,
          kode_section: sec.kode_section,
          task_type: 'PRE_TEST',
          id_sub_section: taskId,
          name: `${detail.nama_mata_kuliah || 'Mata Kuliah'} - ${sec.nama_section} (Pre-Test)`,
          completion: pretest.completion
        };
      }
      if (posttest && posttest.id == taskId) {
        return {
          kode_course,
          kode_section: sec.kode_section,
          task_type: 'POST_TEST',
          id_sub_section: taskId,
          name: `${detail.nama_mata_kuliah || 'Mata Kuliah'} - ${sec.nama_section} (Post-Test)`,
          completion: posttest.completion
        };
      }
    }
  } catch (e) {
    console.error("Error fetching course detail for active task:", e);
  }
  
  // Fallback if not found in sections either, try parsing page text or default
  // Guess Pre-Test or Post-Test from page title or text
  let guessedType = 'PRE_TEST';
  const pageText = document.body.innerText.toLowerCase();
  if (pageText.includes('post test') || pageText.includes('post-test') || pageText.includes('posttest')) {
    guessedType = 'POST_TEST';
  }
  return {
    kode_course,
    kode_section: 'PERTEMUAN',
    task_type: guessedType,
    id_sub_section: taskId,
    name: `Kuis ${guessedType === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'}`,
    completion: false
  };
}

// Run Quiz (Pre-Test / Post-Test) automation directly in the browser (zero dependencies)
async function runQuizAutomationLocally(taskInfo) {
  const token = getAuthToken();
  if (!token) throw new Error("Token tidak terdeteksi. Silakan login kembali.");
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  };

  const subSectionId = taskInfo.id_sub_section;

  // 1. Start Quiz
  const startRes = await fetch(`https://mentari.unpam.ac.id/api/quiz/start/${subSectionId}`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify({ "id_trx_course_sub_section": subSectionId, "reset": true })
  });
  if (!startRes.ok) throw new Error(`Gagal memulai kuis (HTTP ${startRes.status})`);

  // 2. Ambil Soal
  const soalRes = await fetch(`https://mentari.unpam.ac.id/api/quiz/soal/${subSectionId}`, {
    method: 'GET',
    headers: headers
  });
  if (!soalRes.ok) throw new Error(`Gagal mengambil soal (HTTP ${soalRes.status})`);
  
  const resSoalData = await soalRes.json();
  const soalList = resSoalData.data || [];
  
  if (soalList.length === 0) {
    throw new Error("Tidak ada soal ditemukan dalam kuis ini.");
  }

  // 3. Jawab soal (memilih opsi jawaban pertama secara default)
  for (let i = 0; i < soalList.length; i++) {
    const soal = soalList[i];
    const jawabanTerpilih = soal.list_jawaban ? soal.list_jawaban[0] : null;
    if (jawabanTerpilih) {
      const jawabRes = await fetch(`https://mentari.unpam.ac.id/api/quiz/jawab`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          "id_trx_quiz_user_soal": soal.id,
          "id_jawaban": jawabanTerpilih.id
        })
      });
      if (!jawabRes.ok) {
        console.warn(`Gagal menjawab soal ke-${i+1}`);
      }
    }
  }

  // 4. End Quiz
  const endRes = await fetch(`https://mentari.unpam.ac.id/api/quiz/end`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify({ "id_trx_course_sub_section": subSectionId })
  });
  if (!endRes.ok) throw new Error(`Gagal menyelesaikan kuis (HTTP ${endRes.status})`);
}

let isAutomating = false;

async function triggerAutomation(taskInfo, buttons) {
  if (isAutomating) return;
  isAutomating = true;
  
  // Set buttons to running state
  buttons.forEach(btn => {
    if (!btn) return;
    btn.classList.add('running');
    btn.disabled = true;
    if (btn.id === 'mh-automate-float-btn') {
      btn.innerHTML = '<span>⏳</span> Automating...';
    } else {
      btn.innerHTML = '<span>⏳</span> Menjalankan...';
    }
  });
  
  showToast("Menjalankan otomatisasi kuis langsung di browser...");
  
  try {
    // Jalankan eksekusi langsung di browser (Tanpa Server Jembatan)
    await runQuizAutomationLocally(taskInfo);
    
    // Sukses
    buttons.forEach(btn => {
      if (!btn) return;
      btn.classList.remove('running');
      btn.classList.add('success');
      btn.innerHTML = '<span>✅</span> Berhasil!';
    });
    
    const tipeKuis = taskInfo.task_type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test';
    showToast(`Otomatisasi ${tipeKuis} berhasil diselesaikan langsung di browser! 🎉`);
    
    // Refresh data widget
    setTimeout(() => {
      loadWidgetData();
    }, 2000);
    
  } catch (error) {
    console.error("Automation error:", error);
    
    buttons.forEach(btn => {
      if (!btn) return;
      btn.classList.remove('running');
      btn.classList.add('error');
      btn.innerHTML = '<span>❌</span> Gagal';
    });
    
    showToast(`Error: ${error.message}`, true);
  } finally {
    isAutomating = false;
    // Kembalikan status tombol setelah 5 detik
    setTimeout(() => {
      buttons.forEach(btn => {
        if (!btn) return;
        btn.classList.remove('success', 'error');
        btn.disabled = false;
        
        // Kembalikan teks asli
        if (btn.id === 'mh-automate-float-btn') {
          btn.innerHTML = '<span>🤖</span> Automate';
        } else {
          const text = taskInfo.completion ? 'Selesai (Automate Lagi)' : '🤖 Jalankan Automate';
          const icon = taskInfo.completion ? '✅' : '🤖';
          btn.innerHTML = `<span>${icon}</span> ${text}`;
        }
      });
    }, 5000);
  }
}

async function updateActivePageAutomateCard() {
  if (isMyUnpam) return; // Hanya Mentari yang memiliki tugas otomatisasi
  
  const card = document.getElementById('mh-active-automate-card');
  const floatBtn = document.getElementById('mh-automate-float-btn');
  if (!card || !floatBtn) return;
  
  const taskInfo = await getActiveTaskInfo();
  
  if (taskInfo) {
    // Tampilkan komponen otomatisasi halaman aktif
    const text = taskInfo.completion ? 'Selesai (Automate Lagi)' : '🤖 Jalankan Automate';
    const icon = taskInfo.completion ? '✅' : '🤖';
    
    card.innerHTML = `
      <div class="mh-active-card">
        <div class="mh-active-card-header">
          <span>🤖 Halaman Aktif</span>
        </div>
        <div class="mh-active-card-title">${taskInfo.name}</div>
        <div class="mh-active-card-action">
          <button class="mh-btn success-btn" id="mh-active-card-btn" style="width: 100%;">
            <span>${icon}</span> ${text}
          </button>
        </div>
      </div>
    `;
    
    card.style.display = 'block';
    floatBtn.style.display = 'block';

    // Pasang event listener ke tombol baru
    const btn = document.getElementById('mh-active-card-btn');
    btn.addEventListener('click', () => triggerAutomation(taskInfo, [btn, floatBtn]));
  } else {
    // Sembunyikan komponen jika bukan halaman kuis
    card.style.display = 'none';
    floatBtn.style.display = 'none';
  }
}

// Start polling for page changes
let currentHref = "";
setInterval(async () => {
  if (window.location.href !== currentHref) {
    currentHref = window.location.href;
    await updateActivePageAutomateCard();
  }
}, 1500);


// --- 5. NEW FEATURES IMPLEMENTATION ---

// Global states for new features
let gpaData = [];

// Helper function to estimate class hours based on shift & SKS
function parseClassTime(shift = '', sks = 2) {
  const s = shift.toUpperCase();
  if (s.includes('E-1')) return '07:30 - 09:30';
  if (s.includes('E-2')) return '09:40 - 12:10';
  if (s.includes('E-3')) return '13:00 - 15:30';
  if (s.includes('E-4')) return '15:40 - 18:10';
  if (s.startsWith('A')) return '07:30 - 09:10';
  if (s.startsWith('B')) return '18:30 - 20:10';
  if (s.startsWith('C')) return '07:30 - 12:00';
  return 'Sesuai Jadwal';
}

// 1. Batch Downloader: Download all course materials sequentially
async function downloadAllCourseMaterials(courseName, files, buttonId, statusId) {
  const token = getAuthToken();
  if (!token) {
    showToast("Token tidak terdeteksi. Silakan login kembali.", true);
    return;
  }

  const btn = document.getElementById(buttonId);
  const status = document.getElementById(statusId);
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "⏳ Downloading...";
  
  const headers = { 'Authorization': `Bearer ${token}` };
  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    status.textContent = `Mengunduh ${i + 1}/${files.length}: ${file.sectionName}`;
    
    try {
      const response = await fetch(`https://mentari.unpam.ac.id/api/file/${file.fileId}`, { headers });
      if (!response.ok) throw new Error();
      
      const blob = await response.blob();
      
      // 1. Get default extension from Content-Type
      let ext = '.pdf';
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('presentation') || contentType.includes('powerpoint')) ext = '.pptx';
      else if (contentType.includes('word')) ext = '.docx';
      else if (contentType.includes('spreadsheet') || contentType.includes('excel')) ext = '.xlsx';
      else if (contentType.includes('zip')) ext = '.zip';

      // 2. Try to extract filename and extension from Content-Disposition header
      const disposition = response.headers.get('content-disposition');
      if (disposition) {
        const filenameMatch = disposition.match(/filename\*?=["']?([^"';]+)/);
        if (filenameMatch && filenameMatch[1]) {
          const serverFilename = decodeURIComponent(filenameMatch[1].split("''").pop());
          const dotIdx = serverFilename.lastIndexOf('.');
          if (dotIdx !== -1) {
            ext = serverFilename.substring(dotIdx);
          }
        }
      }

      // 3. Clean up the document title (strip pre-existing extension if it duplicates ext)
      let titleClean = file.title.trim();
      const extRegex = /\.(pdf|pptx|ppt|docx|doc|xlsx|xls|zip|rar|txt|png|jpg|jpeg)$/i;
      if (extRegex.test(titleClean)) {
        const matchedExt = titleClean.match(extRegex)[0];
        ext = matchedExt;
        titleClean = titleClean.replace(extRegex, '');
      }

      const filename = `${courseName} - ${file.sectionName} - ${titleClean}${ext}`.replace(/[\\/:*?"<>|]/g, '_');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      successCount++;
      await new Promise(r => setTimeout(r, 1000)); // Rate limit buffer
    } catch (e) {
      console.error("Gagal mengunduh file:", file.fileId, e);
    }
  }

  btn.disabled = false;
  btn.textContent = "📥 Unduh Semua";
  status.textContent = `Berhasil mengunduh ${successCount}/${files.length} file!`;
  showToast(`Selesai! ${successCount} file materi berhasil diunduh.`);
}

// 2. Schedule & Live Countdown
function updateScheduleAndCountdown() {
  const countdownContainer = document.getElementById('mh-countdown-container');
  const scheduleSection = document.getElementById('mh-schedule-section');
  const scheduleList = document.getElementById('mh-schedule-list-container');
  
  if (!scheduleSection || !scheduleList) return;

  const daysOrder = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
  const todayNum = new Date().getDay(); // 0 is Sunday, 1 is Monday...

  // Gather schedule from processed courses
  let schedules = [];
  if (isMyUnpam) {
    schedules = allAttendanceData.map(c => {
      const dayName = c.course.hari_kuliah || 'Sabtu';
      const timeStr = `${c.course.jam_mulai || '07:30'} - ${c.course.jam_selesai || '12:00'}`;
      return {
        name: c.course.nama_mata_kuliah,
        dosen: c.course.nama_dosen || 'Dosen Pengampu',
        day: dayName,
        dayNum: daysOrder[dayName] !== undefined ? daysOrder[dayName] : 6,
        time: timeStr,
        ruang: c.course.ruangan || 'Online / Sesuai Jadwal'
      };
    });
  } else {
    schedules = allProcessedCourses.map(c => {
      const coursename = c.course.coursename || '';
      const dayMatch = coursename.match(/\(([^)]+)\)/);
      const dayName = dayMatch ? dayMatch[1] : 'Sabtu';
      const shiftMatch = coursename.match(/\[([^\]]+)\]$/);
      const shiftStr = shiftMatch ? shiftMatch[1] : 'E-1';
      const sks = c.course.sks || 2;
      return {
        name: c.course.nama_mata_kuliah,
        dosen: c.course.nama_dosen || 'Dosen Pengampu',
        day: dayName,
        dayNum: daysOrder[dayName] !== undefined ? daysOrder[dayName] : 6,
        time: parseClassTime(shiftStr, sks),
        ruang: shiftStr
      };
    });
  }

  if (schedules.length === 0) {
    scheduleSection.style.display = 'none';
    if (countdownContainer) countdownContainer.style.display = 'none';
    return;
  }

  // Sort schedule: Today first, then subsequent days
  schedules.sort((a, b) => {
    let diffA = (a.dayNum - todayNum + 7) % 7;
    let diffB = (b.dayNum - todayNum + 7) % 7;
    if (diffA === diffB) {
      return a.time.localeCompare(b.time);
    }
    return diffA - diffB;
  });

  scheduleSection.style.display = 'block';
  scheduleList.innerHTML = '';

  schedules.forEach(s => {
    const card = document.createElement('div');
    card.className = 'mh-schedule-card';
    card.innerHTML = `
      <div class="mh-schedule-info">
        <div class="mh-schedule-subject">${s.name}</div>
        <div class="mh-schedule-meta">
          <span class="mh-schedule-day-badge">${s.day}</span>
          <span>${s.time}</span>
          <span>| Ruang: ${s.ruang}</span>
        </div>
      </div>
    `;
    scheduleList.appendChild(card);
  });

  // Calculate Countdown to nearest next class
  if (countdownContainer) {
    const nearest = schedules[0];
    const diffDays = (nearest.dayNum - todayNum + 7) % 7;
    
    let countdownText = "";
    let isToday = diffDays === 0;
    
    if (isToday) {
      countdownText = `Hari Ini (${nearest.time})`;
    } else if (diffDays === 1) {
      countdownText = `Besok (${nearest.day})`;
    } else {
      countdownText = `${diffDays} hari lagi (${nearest.day})`;
    }

    countdownContainer.innerHTML = `
      <div class="mh-countdown-card">
        <div class="mh-countdown-title">🔔 Kelas Terdekat</div>
        <div class="mh-countdown-time">${nearest.name}</div>
        <div class="mh-countdown-sub">${countdownText} | ${nearest.time} | Ruang ${nearest.ruang}</div>
      </div>
    `;
    countdownContainer.style.display = 'block';
  }
}

// 3. KHS / Grades Fetcher
async function fetchMyUnpamGrades() {
  const token = getAuthToken();
  const xsrf = getXsrfToken();
  if (!token) {
    showToast("Token tidak terdeteksi. Silakan login kembali.", true);
    return;
  }

  const btn = document.getElementById('mh-btn-load-grades-auto');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Memuat Nilai...";
  }

  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Authorization': `Bearer ${token}`,
    'X-Xsrf-Token': xsrf
  };

  // Try standard academic records API endpoints in sequence
  const urls = [
    'https://my.unpam.ac.id/api/rangkuman-nilai',
    'https://my.unpam.ac.id/api/akademik/mahasiswa/transkrip',
    'https://my.unpam.ac.id/api/akademik/transkrip',
    'https://my.unpam.ac.id/api/khs/mahasiswa',
    'https://my.unpam.ac.id/api/akademik/mahasiswa/khs'
  ];

  let success = false;
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        const resJson = await response.json();
        let list = resJson.rangkuman || resJson.data || resJson || [];
        
        if (Array.isArray(list) && list.length > 0) {
          // Format into gpaData groups by semester
          const grouped = {};
          list.forEach(item => {
            const sem = item.isemester || item.semester || item.smt || 1;
            if (!grouped[sem]) grouped[sem] = [];
            grouped[sem].push({
              name: item.snama || item.nama_mata_kuliah || item.matakuliah || 'Mata Kuliah',
              sks: parseInt(item.isks || item.sks || item.sks_mata_kuliah || 2),
              grade: item.fgrade || item.nilai_huruf || item.nilai || 'A'
            });
          });

          gpaData = Object.keys(grouped)
            .map(sem => parseInt(sem))
            .sort((a, b) => a - b)
            .map(sem => ({
              semester: sem,
              courses: grouped[sem]
            }));

          chrome.storage.local.set({ gpaData });
          success = true;
          break;
        }
      }
    } catch(e) {}
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = "🔄 Muat Nilai dari MyUnpam";
  }

  if (success) {
    showToast("Nilai berhasil dimuat dari MyUnpam! 🎉");
    renderGradesCalculator();
  } else {
    showToast("Gagal memuat otomatis. Silakan tambah semester dan nilai secara manual untuk simulasi.", true);
  }
}

// 4. Grades Calculator / Simulation Renderer
function renderGradesCalculator() {
  const container = document.getElementById('mh-gpa-semesters-container');
  if (!container) return;

  chrome.storage.local.get(['gpaData'], (result) => {
    if (result.gpaData && Array.isArray(result.gpaData)) {
      gpaData = result.gpaData;
    } else if (gpaData.length === 0) {
      gpaData = [];
    }

    container.innerHTML = '';
    
    let totalQualityPoints = 0;
    let totalSks = 0;

    const gradeValues = {
      'A': 4.0, 'A-': 3.75, 'B+': 3.5, 'B': 3.0, 'B-': 2.75, 'C+': 2.5, 'C': 2.0, 'D': 1.0, 'E': 0.0
    };

    gpaData.forEach((sem) => {
      const box = document.createElement('div');
      box.className = 'mh-semester-box expanded';
      
      let coursesHtml = '';
      let semSks = 0;
      let semQualityPoints = 0;

      sem.courses.forEach((c) => {
        const val = gradeValues[c.grade] !== undefined ? gradeValues[c.grade] : 4.0;
        semSks += c.sks;
        semQualityPoints += (c.sks * val);
        totalSks += c.sks;
        totalQualityPoints += (c.sks * val);

        const getGradeClass = (grade) => {
          const g = (grade || 'A').toUpperCase().trim();
          if (g.startsWith('A')) return 'grade-a';
          if (g.startsWith('B')) return 'grade-b';
          if (g.startsWith('C')) return 'grade-c';
          if (g.startsWith('D')) return 'grade-d';
          if (g.startsWith('E')) return 'grade-e';
          return 'grade-a';
        };
        const gradeClass = getGradeClass(c.grade);

        coursesHtml += `
          <div class="mh-gpa-row-readonly">
            <span class="mh-gpa-course-name">${c.name}</span>
            <div class="mh-gpa-course-meta">
              <span class="mh-gpa-course-sks">${c.sks} SKS</span>
              <span class="mh-grade-badge ${gradeClass}">${c.grade}</span>
            </div>
          </div>
        `;
      });

      const semGpa = semSks > 0 ? (semQualityPoints / semSks).toFixed(2) : '0.00';

      box.innerHTML = `
        <div class="mh-semester-header">
          <span>Semester ${sem.semester} (IPS: ${semGpa})</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>${semSks} SKS</span>
            <span class="mh-semester-chevron" style="font-size: 0.7rem; transition: transform 0.2s;">&#9662;</span>
          </div>
        </div>
        <div class="mh-semester-body">
          ${coursesHtml}
        </div>
      `;
      
      container.appendChild(box);

      box.querySelector('.mh-semester-header').addEventListener('click', () => {
        box.classList.toggle('expanded');
      });
    });

    // Update summary values
    const ipk = totalSks > 0 ? (totalQualityPoints / totalSks).toFixed(2) : '0.00';
    const ipkEl = document.getElementById('mh-gpa-summary-ipk');
    const sksEl = document.getElementById('mh-gpa-summary-sks');
    
    if (ipkEl) ipkEl.textContent = ipk;
    if (sksEl) sksEl.textContent = totalSks;
  });
}

// =============================================
// Helper: Download PDF with Auth Header
// =============================================
async function downloadPdf(url, filename) {
  const token = getAuthToken();
  if (!token) { showToast('Token tidak terdeteksi. Silakan login kembali.', true); return; }
  showToast('Mengunduh PDF... ⏳');
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    showToast('PDF berhasil diunduh! ✅');
  } catch (e) {
    showToast(`Gagal mengunduh PDF: ${e.message}`, true);
  }
}

// =============================================
// FETCH & RENDER: Keuangan
// =============================================
async function fetchMyUnpamKeuangan() {
  const container = document.getElementById('mh-keuangan-container');
  if (!container) return;
  container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;padding:20px;">⏳ Memuat data keuangan...</div>`;
  try {
    const token = await getAuthToken();
    const res = await fetch('https://my.unpam.ac.id/api/keuangan?semester=', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    chrome.storage.local.set({ keuanganData: data });
    renderKeuangan(data);
  } catch (e) {
    container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-danger);text-align:center;padding:20px;">❌ Gagal memuat: ${e.message}</div>`;
  }
}

function renderKeuangan(data) {
  const container = document.getElementById('mh-keuangan-container');
  if (!container) return;

  let list = [];
  const semName = data?.semester?.nama_semester_registrasi || data?.semester?.id_semester_registrasi || '-';

  if (data) {
    if (Array.isArray(data)) {
      list = data;
    } else {
      const t = Array.isArray(data.tagihan) ? data.tagihan : [];
      const tl = Array.isArray(data.tagihan_lainnya) ? data.tagihan_lainnya : [];
      const tsp = Array.isArray(data.tagihan_sp) ? data.tagihan_sp : [];
      list = [...t, ...tl, ...tsp];
    }
  }

  if (!list.length) { 
    container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;">Tidak ada data tagihan.</div>`; 
    return; 
  }

  container.innerHTML = list.map(item => {
    const isLunas = item.status === 'LUNAS' || item.status_bayar === 'LUNAS';
    const amount = Number(item.total_tagihan || item.jumlah || item.nominal || 0);
    const semesterVal = item.semester || item.id_semester || semName;
    
    let payInfoHtml = '';
    if (isLunas) {
      const payDate = item.tanggal_bayar ? item.tanggal_bayar.split(' ')[0] : '';
      const payPlace = item.nama_tempat_bayar || item.channel || '';
      payInfoHtml = `<div style="font-size:0.7rem;color:var(--mh-text-muted);margin-top:4px;">Dibayar pada: ${payDate} ${payPlace ? `melalui ${payPlace}` : ''}</div>`;
    }

    return `
      <div class="mh-keuangan-card">
        <div style="font-weight:700;font-size:0.82rem;color:var(--mh-text-main);margin-bottom:4px;">${item.nama_tagihan || item.keterangan || item.nama || 'Tagihan'}</div>
        <div style="font-size:0.76rem;color:var(--mh-text-muted);">Semester: ${semesterVal} &nbsp;|&nbsp; Jumlah: <span style="color:var(--mh-accent);font-weight:700;">Rp ${amount.toLocaleString('id-ID')}</span></div>
        ${payInfoHtml}
        <div style="margin-top:6px;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border-radius:6px;padding:2px 8px;">
          <span style="width:7px;height:7px;border-radius:50%;background:${isLunas ? 'var(--mh-success)' : 'var(--mh-warning)'};flex-shrink:0;"></span>
          <span style="font-size:0.68rem;color:var(--mh-text-main);font-weight:600;">${item.status_bayar || item.status || 'Belum Bayar'}</span>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================
// FETCH & RENDER: KRS Aktif
// =============================================
async function fetchMyUnpamKrsAktif() {
  const btn = document.getElementById('mh-btn-load-krs-aktif');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Memuat...'; }
  try {
    const token = await getAuthToken();
    const res = await fetch('https://my.unpam.ac.id/api/krs', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    chrome.storage.local.set({ krsData: data });
    renderKrsAktif(data);
    showToast('KRS Aktif berhasil dimuat! 🎉');
  } catch (e) {
    showToast(`Gagal memuat KRS: ${e.message}`, true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📚 Sinkronisasi KRS Aktif'; }
  }
}

function renderKrsAktif(data) {
  const container = document.getElementById('mh-krs-aktif-container');
  if (!container) return;
  const list = data?.mahasiswa?.krs || data?.krs || [];
  if (!list.length) { container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;padding:10px;">Belum ada data KRS aktif.</div>`; return; }
  let html = `<div style="font-weight:bold;font-size:0.8rem;color:var(--mh-text-main);margin-bottom:6px;">KRS Aktif Semester Ini:</div>`;
  list.forEach(item => {
    html += `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-left:4px solid var(--mh-success);border-radius:8px;padding:8px 10px;margin-bottom:8px;">
      <div style="font-weight:bold;color:#fff;font-size:0.78rem;">${item.nama_mata_kuliah || item.mata_kuliah?.nama_mata_kuliah || 'Mata Kuliah'}</div>
      <div style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap;font-size:0.72rem;color:var(--mh-text-muted);">
        <span>SKS: <b>${item.sks_mata_kuliah || item.mata_kuliah?.sks || '-'}</b></span>
        <span>Kelas: <b>${item.id_kelas || '-'}</b></span>
        <span>Kode: <b>${item.id_mata_kuliah || '-'}</b></span>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

async function searchMyUnpamKelas() {
  const input = document.getElementById('mh-krs-search-input');
  const container = document.getElementById('mh-krs-results-container');
  if (!input || !container) return;
  const q = input.value.trim();
  if (!q) { container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;">Masukkan nama atau kode mata kuliah.</div>`; return; }
  container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;padding:20px;">⏳ Mencari kelas...</div>`;
  try {
    const token = await getAuthToken();
    const res = await fetch(`https://my.unpam.ac.id/api/krs/search-kelas?q=${encodeURIComponent(q)}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data?.data || data?.kelas || []);
    if (!list.length) { container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;">Tidak ada kelas ditemukan untuk "${q}".</div>`; return; }
    container.innerHTML = list.map(c => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px;margin-bottom:8px;">
        <div style="font-weight:bold;color:#fff;font-size:0.8rem;">${c.nama_mata_kuliah || c.nama || '-'}</div>
        <div style="font-size:0.72rem;color:var(--mh-text-muted);margin-top:4px;">Kelas: ${c.id_kelas || '-'} &nbsp;|&nbsp; Sisa Kuota: <span style="color:${(c.sisa_kuota||0)>0?'var(--mh-success)':'var(--mh-danger)'};">${c.sisa_kuota ?? '-'}</span></div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-danger);text-align:center;">❌ Gagal mencari: ${e.message}</div>`;
  }
}

// =============================================
// FETCH & RENDER: Tugas Akhir
// =============================================
async function fetchMyUnpamTugasAkhir() {
  const container = document.getElementById('mh-ta-container');
  if (!container) return;
  container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;padding:20px;">⏳ Memuat data skripsi...</div>`;
  try {
    const token = await getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const [taRes, dosenRes] = await Promise.all([
      fetch('https://my.unpam.ac.id/api/tugas-akhir/mahasiswa', { headers }),
      fetch('https://my.unpam.ac.id/api/tugas-akhir/dosen-pembimbing', { headers })
    ]);
    const taData = await taRes.json();
    const dosenData = dosenRes.ok ? await dosenRes.json() : null;
    const combined = { taData, dosenData };
    chrome.storage.local.set({ taData: combined });
    renderTugasAkhir(combined);
  } catch (e) {
    container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-danger);text-align:center;padding:20px;">❌ Gagal memuat: ${e.message}</div>`;
  }
}

function renderTugasAkhir({ taData, dosenData }) {
  const container = document.getElementById('mh-ta-container');
  if (!container) return;
  const ta = taData?.data_tugas_akhir || taData;
  if (!ta || !ta.judul_tugas_akhir) { container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;">Belum ada data tugas akhir terdaftar.</div>`; return; }
  const statusColor = ta.id_status_ajuan_tugas_akhir === 'A00' ? 'var(--mh-success)' : 'var(--mh-accent)';
  let dosenHtml = '';
  if (dosenData && Array.isArray(dosenData)) {
    dosenHtml = dosenData.map(d => `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.75rem;"><span style="color:var(--mh-text-muted);">${d.jabatan || 'Pembimbing'}</span><br><b style="color:var(--mh-text-main);">${d.nama_dosen || d.nama || '-'}</b></div>`).join('');
  }
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06));border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="font-size:0.65rem;color:var(--mh-accent);font-weight:700;letter-spacing:1px;margin-bottom:6px;">${ta.jenis_tugas_akhir || 'SKRIPSI'}</div>
      <div style="font-size:0.85rem;font-weight:800;color:var(--mh-text-main);line-height:1.4;margin-bottom:10px;">${ta.judul_tugas_akhir}</div>
      <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border-radius:6px;padding:3px 8px;">
        <span style="width:7px;height:7px;border-radius:50%;background:${statusColor};box-shadow:0 0 6px ${statusColor};"></span>
        <span style="font-size:0.7rem;color:var(--mh-text-main);font-weight:600;">${ta.status_ajuan_tugas_akhir || 'AKTIF'}</span>
      </div>
    </div>
    ${dosenHtml ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;"><div style="font-size:0.75rem;font-weight:700;color:var(--mh-text-main);margin-bottom:8px;">👨‍🏫 Dosen Pembimbing</div>${dosenHtml}</div>` : ''}
  `;
}

// =============================================
// FETCH & RENDER: Informasi Kampus
// =============================================
async function fetchMyUnpamInformasi() {
  const container = document.getElementById('mh-informasi-container');
  if (!container) return;
  container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;padding:20px;">⏳ Memuat informasi kampus...</div>`;
  try {
    const token = await getAuthToken();
    const res = await fetch('https://my.unpam.ac.id/api/informasi', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    chrome.storage.local.set({ informasiData: list });
    renderInformasi(list);
  } catch (e) {
    container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-danger);text-align:center;padding:20px;">❌ Gagal memuat: ${e.message}</div>`;
  }
}

function renderInformasi(list) {
  const container = document.getElementById('mh-informasi-container');
  if (!container) return;
  if (!Array.isArray(list) || !list.length) { container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;">Tidak ada informasi baru saat ini.</div>`; return; }
  container.innerHTML = list.map(item => `
    <a href="${item.url || '#'}" target="_blank" style="text-decoration:none;color:inherit;display:block;margin-bottom:10px;">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-left:3px solid var(--mh-accent);border-radius:10px;padding:12px;cursor:pointer;">
        <div style="font-weight:bold;font-size:0.8rem;color:#fff;margin-bottom:4px;">📢 ${item.judul}</div>
        <div style="font-size:0.72rem;color:var(--mh-text-muted);">${item.pesan || ''}</div>
        <div style="font-size:0.65rem;color:var(--mh-accent);margin-top:6px;font-weight:bold;">🔗 Buka Dokumen ↗</div>
      </div>
    </a>`).join('');
}

// =============================================
// FETCH & RENDER: Biodata + IPK/IPS Tracker
// =============================================
async function fetchMyUnpamBiodata() {
  const container = document.getElementById('mh-biodata-container');
  if (!container) return;
  container.innerHTML = `<div class="mh-list-item" style="color:var(--mh-text-muted);text-align:center;padding:20px;">⏳ Memuat data profil dan akademik...</div>`;
  try {
    const token = await getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
    const [biodataRes, akademikRes] = await Promise.all([
      fetch('https://my.unpam.ac.id/api/biodata/mahasiswa', { headers }),
      fetch('https://my.unpam.ac.id/api/biodata/mahasiswa/akademik', { headers })
    ]);
    if (!biodataRes.ok || !akademikRes.ok) throw new Error('Gagal memuat data dari server.');
    const biodata = await biodataRes.json();
    const akademik = await akademikRes.json();
    const combined = { biodata, akademik };
    chrome.storage.local.set({ biodataData: combined });
    renderBiodata(combined);
  } catch (e) {
    const c = document.getElementById('mh-biodata-container');
    if (c) c.innerHTML = `<div class="mh-list-item" style="color:var(--mh-danger);text-align:center;padding:20px;">❌ Gagal memuat: ${e.message}</div>`;
  }
}

function renderBiodata({ biodata, akademik }) {
  const container = document.getElementById('mh-biodata-container');
  if (!container) return;
  const agama = { '1':'Islam','2':'Kristen','3':'Katolik','4':'Hindu','5':'Budha','6':'Kong Hu Cu' };
  const jenkel = biodata.id_jenis_kelamin === 'L' ? '♂ Laki-laki' : '♀ Perempuan';
  const statusMap = { 'A':'Aktif','N':'Non-Aktif','L':'Lulus','C':'Cuti' };
  const statusColor = biodata.id_status_mahasiswa === 'A' ? 'var(--mh-success)' : 'var(--mh-danger)';
  const ipk = parseFloat(biodata.ipk_semester_berjalan || 0).toFixed(2);
  const ipkColor = ipk >= 3.5 ? 'var(--mh-success)' : ipk >= 3.0 ? 'var(--mh-accent)' : ipk >= 2.5 ? '#f59e0b' : 'var(--mh-danger)';
  const ringDash = 188;
  const ringOffset = ringDash - (ringDash * Math.min(parseFloat(ipk) / 4.0, 1));
  const semArr = Array.isArray(akademik?.semester) ? akademik.semester : [];
  let semRows = '';
  semArr.forEach((s, i) => {
    const ips = parseFloat(s.ips || 0).toFixed(2);
    const ipsColor = ips >= 3.5 ? 'var(--mh-success)' : ips >= 3.0 ? 'var(--mh-accent)' : ips >= 2.5 ? '#f59e0b' : 'var(--mh-danger)';
    const barW = Math.min((parseFloat(ips) / 4.0) * 100, 100);
    semRows += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
      <td style="padding:7px 8px;font-size:0.78rem;color:var(--mh-text-muted);">Sem ${i+1}</td>
      <td style="padding:7px 8px;font-size:0.72rem;color:var(--mh-text-muted);">${s.id_semester||'-'}</td>
      <td style="padding:7px 8px;text-align:center;"><span style="font-size:0.82rem;font-weight:700;color:${ipsColor};">${ips}</span></td>
      <td style="padding:7px 8px;"><div style="background:rgba(255,255,255,0.06);border-radius:4px;height:6px;width:80px;"><div style="background:${ipsColor};width:${barW}%;height:100%;border-radius:4px;"></div></div></td>
      <td style="padding:7px 8px;font-size:0.78rem;color:var(--mh-text-muted);text-align:center;">${s.sks_diambil||'-'}</td>
      <td style="padding:7px 8px;font-size:0.78rem;color:var(--mh-text-muted);text-align:center;">${s.sks_lulus||'-'}</td>
    </tr>`;
  });
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:14px;padding:18px;margin-bottom:14px;display:flex;align-items:center;gap:16px;">
      <div style="flex-shrink:0;position:relative;width:72px;height:72px;">
        <svg viewBox="0 0 72 72" style="width:72px;height:72px;transform:rotate(-90deg);">
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
          <circle cx="36" cy="36" r="30" fill="none" stroke="${ipkColor}" stroke-width="6" stroke-dasharray="${ringDash}" stroke-dashoffset="${ringOffset}" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-size:1.05rem;font-weight:800;color:${ipkColor};line-height:1;">${ipk}</span>
          <span style="font-size:0.52rem;color:var(--mh-text-muted);font-weight:600;">IPK</span>
        </div>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.95rem;font-weight:800;color:var(--mh-text-main);margin-bottom:3px;">${biodata.nama_mahasiswa||'-'}</div>
        <div style="font-size:0.73rem;color:var(--mh-accent);font-weight:600;margin-bottom:5px;">${biodata.nim||'-'}</div>
        <div style="font-size:0.7rem;color:var(--mh-text-muted);">${biodata.nama_prodi||biodata.id_prodi||'-'}<br><span style="color:rgba(255,255,255,0.4);">${biodata.nama_fakultas||''}</span></div>
        <div style="margin-top:6px;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border-radius:6px;padding:3px 8px;">
          <span style="width:7px;height:7px;border-radius:50%;background:${statusColor};box-shadow:0 0 6px ${statusColor};flex-shrink:0;"></span>
          <span style="font-size:0.68rem;color:var(--mh-text-main);font-weight:600;">${statusMap[biodata.id_status_mahasiswa]||biodata.id_status_mahasiswa}</span>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:1.2rem;font-weight:800;color:var(--mh-accent);">${biodata.sks_semester_berjalan||'-'}</div>
        <div style="font-size:0.65rem;color:var(--mh-text-muted);margin-top:3px;">Total SKS</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:1.2rem;font-weight:800;color:var(--mh-text-main);">${biodata.semester||'-'}</div>
        <div style="font-size:0.65rem;color:var(--mh-text-muted);margin-top:3px;">Semester</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:1.2rem;font-weight:800;color:${ipkColor};">${ipk}</div>
        <div style="font-size:0.65rem;color:var(--mh-text-muted);margin-top:3px;">IPK</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px;margin-bottom:14px;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--mh-text-main);margin-bottom:10px;">📋 DATA MAHASISWA</div>
      ${[['Tempat, Tgl Lahir',`${biodata.tempat_lahir_mahasiswa||'-'}, ${biodata.tanggal_lahir_mahasiswa||'-'}`],['Jenis Kelamin',jenkel],['Agama',agama[biodata.id_agama]||'-'],['Shift',biodata.id_shift||'-'],['Kurikulum',biodata.tahun_kurikulum||'-'],['No. HP',biodata.no_hp_mahasiswa||'-'],['Email',biodata.alamat_email||'-'],['Alamat',biodata.alamat_mahasiswa||'-']].map(([l,v])=>`<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);gap:8px;"><span style="font-size:0.72rem;color:var(--mh-text-muted);flex-shrink:0;">${l}</span><span style="font-size:0.72rem;color:var(--mh-text-main);text-align:right;word-break:break-word;">${v}</span></div>`).join('')}
    </div>
    ${semArr.length > 0 ? `
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--mh-text-main);margin-bottom:10px;">📈 RIWAYAT IPS PER SEMESTER</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:340px;">
          <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <th style="text-align:left;font-size:0.65rem;color:var(--mh-text-muted);padding:4px 8px;font-weight:600;">SEM</th>
            <th style="text-align:left;font-size:0.65rem;color:var(--mh-text-muted);padding:4px 8px;font-weight:600;">PERIODE</th>
            <th style="text-align:center;font-size:0.65rem;color:var(--mh-text-muted);padding:4px 8px;font-weight:600;">IPS</th>
            <th style="font-size:0.65rem;color:var(--mh-text-muted);padding:4px 8px;font-weight:600;">GRAFIK</th>
            <th style="text-align:center;font-size:0.65rem;color:var(--mh-text-muted);padding:4px 8px;font-weight:600;">SKS ∑</th>
            <th style="text-align:center;font-size:0.65rem;color:var(--mh-text-muted);padding:4px 8px;font-weight:600;">LULUS</th>
          </tr></thead>
          <tbody>${semRows}</tbody>
        </table>
      </div>
    </div>` : ''}
  `;
}
