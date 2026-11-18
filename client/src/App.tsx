import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import EmployeePage from "./pages/EmployeePage";
import InputPage from "./pages/InputPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/overview" element={<ProjectsPage />} />
            <Route path="/project" element={<ProjectDetailPage />} />
            <Route path="/employee" element={<EmployeePage />} />
            <Route path="/input" element={<InputPage />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
