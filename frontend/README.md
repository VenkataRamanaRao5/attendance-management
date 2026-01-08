# Attendance Management - Frontend

A modern React + Vite + Tailwind CSS frontend for the attendance management system.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AbsenteesModal.jsx      # Modal for showing absentees
│   │   ├── AttendancePanel.jsx     # Controls for attendance marking
│   │   ├── ClassManager.jsx        # Class/roster upload
│   │   └── RollList.jsx            # Student list rendering
│   ├── pages/
│   │   ├── LoginPage.jsx           # Authentication page (login/register)
│   │   ├── DashboardPage.jsx       # Main attendance marking dashboard
│   │   └── ReportPage.jsx          # Attendance reports
│   ├── utils/
│   │   ├── api.js                  # API fetch helper with auth
│   │   └── auth.jsx                # Protected route component
│   ├── App.jsx                     # Root app with routing
│   ├── main.jsx                    # Vite entry point
│   └── index.css                   # Tailwind CSS + component styles
├── index.html                       # HTML entry point
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
└── package.json
```

## Features

- **Authentication**: Login/Register with JWT tokens
- **Attendance Marking**: Mark students as present/absent
- **Class Management**: Upload student rosters (CSV)
- **Reports**: Generate attendance reports by date range and roll number
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Modern dark UI with Tailwind CSS

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` with proxy to backend at `http://localhost:3000`.

## Build

```bash
npm run build
```

Output will be in `dist/` directory.

## Configuration

### Proxy URLs

Edit `vite.config.js` to change the backend API proxy:

```javascript
proxy: {
  '/api': 'http://localhost:3000',
  '/classes': 'http://localhost:3000',
  // ...
}
```

## Components

### Pages
- **LoginPage**: Handle user authentication (login/register)
- **DashboardPage**: Main interface for marking attendance
- **ReportPage**: View attendance reports

### Components
- **RollList**: Renders list of students with P/A buttons
- **AttendancePanel**: Date, hour, class selector and stats
- **ClassManager**: Upload new student roster
- **AbsenteesModal**: Modal showing absentees with copy option

## Styling

All styles use Tailwind CSS utilities. Custom component classes are defined in `src/index.css`:

- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- `.card`: Dark card component
- `.entry`: Roll list entry styling
- `.status-badge`, `.status-present`, `.status-absent`

## API Integration

The frontend connects to the backend API with the following endpoints:

- `POST /login` - User login
- `POST /register` - User registration
- `GET /classes` - Get user's classes
- `POST /classes` - Create new class
- `GET /roster/:className` - Get class roster
- `POST /attendance` - Save attendance
- `GET /attendance` - Load saved attendance
- `GET /report` - Generate attendance report

All requests include Bearer token authentication via `authFetch()` utility.

## Environment

The app uses localStorage for token/user storage and hash-based routing for SPA navigation.
