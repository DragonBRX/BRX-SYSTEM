import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import RAGPage from "./pages/RAGPage";
import ModelsPage from "./pages/ModelsPage";
import ProjectsPage from "./pages/ProjectsPage";
import NLPPage from "./pages/NLPPage";
import VisionPage from "./pages/VisionPage";
import AudioPage from "./pages/AudioPage";
import SettingsPage from "./pages/SettingsPage";
import SystemPage from "./pages/SystemPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/rag" element={<RAGPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/nlp" element={<NLPPage />} />
            <Route path="/vision" element={<VisionPage />} />
            <Route path="/audio" element={<AudioPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
