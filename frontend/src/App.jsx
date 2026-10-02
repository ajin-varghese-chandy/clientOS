import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import NewClient from './pages/NewClient'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import NewProject from './pages/NewProject'
import Invoices from './pages/Invoices'
import NewInvoice from './pages/NewInvoice'
import NewOpportunity from './pages/NewOpportunity'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<NewClient />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<NewProject />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<NewInvoice />} />
        <Route path="new-opportunity" element={<NewOpportunity />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
