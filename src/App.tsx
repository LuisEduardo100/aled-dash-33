import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdvancedLeadsPage from "./pages/AdvancedLeadsPage";
import DemandGenerationPage from "./pages/DemandGenerationPage";
import SalesPerformancePage from "./pages/SalesPerformancePage";
import LeadConversionReport from "./pages/LeadConversionReport";
import LeadsDashboard from "./pages/LeadsDashboard";
import DealsDashboard from "./pages/DealsDashboard";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LeadsDashboard />} />
            <Route path="/deals-dashboard" element={<DealsDashboard />} />
            <Route path="/demand-generation" element={<DemandGenerationPage />} />
            <Route path="/advanced-leads" element={<AdvancedLeadsPage />} />
            <Route path="/sales-performance" element={<SalesPerformancePage />} />
            <Route path="/lead-conversion" element={<LeadConversionReport />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

