import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Models from './pages/Models'
import Chat from './pages/Chat'
import Agents from './pages/Agents'
import KnowledgeBases from './pages/KnowledgeBases'
import Workflows from './pages/Workflows'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import Stories from './pages/Stories'
import Code from './pages/Code'
import Training from './pages/Training'
import Catalog from './pages/Catalog'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/models" element={<Models />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/knowledge" element={<KnowledgeBases />} />
      <Route path="/workflows" element={<Workflows />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/code" element={<Code />} />
      <Route path="/training" element={<Training />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
