# ClientOS

A small CRM for freelancers to manage leads, projects, and invoices.

## Features

- Dashboard with revenue, pipeline, and conversion stats
- Kanban pipeline with click-to-move controls
- Client management with search, filter, and sort
- Multi-step opportunity creation form
- Project tracking with milestones and tasks
- Invoice creation with line items and PDF download
- Activity timeline
- Mobile responsive design

## Flow

```
Lead → Contacted → Proposal → Negotiation → Won → Project → Invoice → Paid
```

## Setup

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start dev servers (in separate terminals)
cd frontend && npm run dev
cd backend && npm start
```

- Frontend: http://localhost:5173
- Backend (JSON Server): http://localhost:3001

## Project Structure

```
clientOS/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx    # App shell (Sidebar + Header + Outlet)
│   │   │   ├── Sidebar.jsx   # Navigation + collapse toggle
│   │   │   └── Header.jsx    # Logo + mobile menu + New Opportunity
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Pipeline.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   ├── NewProject.jsx
│   │   │   ├── Invoices.jsx
│   │   │   └── NewOpportunity.jsx
│   │   ├── api.js
│   │   └── index.css
│   └── package.json
└── backend/           # JSON Server
    ├── db.json
    └── package.json
```

## Tech Stack

- React + Vite
- Tailwind CSS
- React Router
- Lucide Icons
- Axios
- JSON Server
- jsPDF
