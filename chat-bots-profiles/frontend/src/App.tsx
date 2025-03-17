import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/layout/Layout';
import { AppProvider } from './context/AppContext';
import ChatPage from './pages/ChatPage';
import ProfilesPage from './pages/ProfilesPage';
import TodoPage from './pages/TodoPage';
import DocumentsPage from './pages/DocumentsPage';
import AbTestingPage from './pages/AbTestingPage';
import MetricsPage from './pages/MetricsPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<ChatPage />} />
              <Route path="/profiles" element={<ProfilesPage />} />
              <Route path="/todo" element={<TodoPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/ab-testing" element={<AbTestingPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
