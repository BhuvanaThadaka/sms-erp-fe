# 🎓 School ERP Frontend — React Application

A production-grade React frontend for the School ERP system, featuring role-based dashboards, real-time Socket.IO updates, charts, and a dark academic design system.

---

## 🚀 Quick Start

```bash
cd school-erp-frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**

> Make sure the NestJS backend is running at `http://localhost:3000` first.

---

## 🏗️ Project Structure

```
src/
├── api/index.js              # Axios instance + all API calls
├── contexts/
│   ├── AuthContext.jsx       # Auth state, login/logout
│   └── SocketContext.jsx     # Socket.IO real-time events
├── components/
│   ├── layout/Layout.jsx     # Sidebar + header shell
│   └── ui/index.jsx          # Shared UI components
├── pages/
│   ├── LoginPage.jsx
│   ├── EventsPage.jsx        # Shared calendar (all roles)
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminClasses.jsx
│   │   └── AdminAuditLogs.jsx
│   ├── teacher/
│   │   ├── TeacherDashboard.jsx
│   │   ├── TeacherAttendance.jsx  ← Real-time marking
│   │   ├── TeacherSessions.jsx
│   │   ├── TeacherSchedule.jsx
│   │   └── TeacherReports.jsx
│   └── student/
│       ├── StudentDashboard.jsx
│       ├── StudentAttendance.jsx
│       ├── StudentNotes.jsx
│       ├── StudentSchedule.jsx
│       └── StudentReports.jsx
└── App.jsx                   # Routes + role guards
```

---

## 🎭 Role-Based Access

| Role | Dashboard | Routes |
|------|-----------|--------|
| **ADMIN** | System overview, charts | `/admin/*` |
| **TEACHER** | Teaching tools, reports | `/teacher/*` |
| **STUDENT** | Personal data only | `/student/*` |

All routes are protected. Students cannot access other students' data.

---

## 🔌 Real-Time Features (Socket.IO)

The app connects to `ws://localhost:3000/school-erp` on login.

| Event | Who Sees It | Trigger |
|-------|------------|---------|
| `attendanceUpdate` | Teacher marking page | Attendance saved |
| `sessionUpdate` | Class room members | Session created |
| `scheduleUpdate` | Class room members | Schedule modified |
| `reportGenerated` | Student (personal room) | Report generated |

Live indicator shown in sidebar header when connected.

---

## 🎨 Design System

**Aesthetic**: Dark academic — deep navy with precise azure accents.

- **Fonts**: Syne (display/headings) + DM Sans (body) + JetBrains Mono (code/ids)
- **Colors**: ink-950 background, azure-600 primary, jade/amber/rose for status
- **Motion**: Staggered fade-in on page load, slide-up for modals

**Shared Components** (`src/components/ui/index.jsx`):
- `StatCard` — metric display with icon and color
- `Badge` — status pill (PRESENT/ABSENT/LATE/roles/event types)
- `Modal` — overlay dialog with sizes (sm/md/lg/xl)
- `Table` — consistent data table
- `LoadingState`, `EmptyState` — page states
- `AttendanceRing` — SVG donut chart
- `Field` — form field wrapper with label

---

## 📱 Pages Overview

### Login
- Email/password form
- **Demo buttons**: Click ADMIN/TEACHER/STUDENT to auto-fill credentials

### Admin Dashboard
- Stats: students, teachers, classes, reports
- Attendance trend bar chart (7 days)
- Reports by quarter chart
- Quick navigation links
- Recent users list

### Admin Users
- Full CRUD (create, view, update, deactivate)
- Role filter tabs
- Search by name/email
- Create modal with role-specific fields

### Admin Classes  
- Class list with teacher assignments
- Create class modal
- Assign teacher modal

### Admin Audit Logs
- All system actions in a table
- Filter by action type and date

### Teacher Dashboard
- Area chart for weekly attendance
- Quick action cards
- Recent sessions list

### Teacher Attendance
- Class + date selector
- Per-student Present/Absent/Late toggle buttons
- Summary bar (present/absent/late counts)
- Bulk save via API
- Real-time sync indicator

### Teacher Sessions
- Create sessions with objectives
- Upload notes linked to sessions
- List of all sessions

### Teacher Reports
- Generate individual or bulk quarterly reports
- Auto-calculated attendance percentage from DB
- PDF download links

### Student Dashboard
- Attendance breakdown pie chart
- Latest report card
- Quick access links

### Student Attendance
- Monthly records with status badges
- Weekly bar chart
- Attendance summary ring

### Events Calendar
- Month navigation
- Filter by event type
- Admin/Teacher can create events

---

## ⚙️ Environment

```env
VITE_API_BASE_URL=http://localhost:3000
```

The Vite proxy automatically forwards `/api/*` → `http://localhost:3000`.

---

## 🔧 Build for Production

```bash
npm run build
# Output in /dist
npm run preview  # Preview production build
```
