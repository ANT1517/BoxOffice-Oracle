// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { PredictorPage } from './pages/PredictorPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { InsightsPage } from './pages/InsightsPage';
import { PatternsPage } from './pages/PatternsPage';
import { ModelsPage } from './pages/ModelsPage';
import { MethodPage } from './pages/MethodPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors selection:bg-amber-500/30 selection:text-amber-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<PredictorPage />} />
                <Route path="/whatif" element={<WhatIfPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/patterns" element={<PatternsPage />} />
                <Route path="/models" element={<ModelsPage />} />
                <Route path="/method" element={<MethodPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
