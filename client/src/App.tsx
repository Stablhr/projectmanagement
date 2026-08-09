import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { BoardView } from './features/board/BoardView';
import { BoardDashboard } from './features/boards/BoardDashboard';
import { SearchPage } from './features/search/SearchPage';
import { SidebarViewPlaceholder } from './features/sidebar/SidebarViewPlaceholder';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<BoardDashboard />} />
                <Route path="/board/:boardId" element={<BoardView />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/planner" element={<SidebarViewPlaceholder view="planner" />} />
                <Route path="/inbox" element={<SidebarViewPlaceholder view="inbox" />} />
              </Route>
            </Route>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
