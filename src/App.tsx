import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navigation } from "@/components/ui/navigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Activities from "./pages/Activities";
import Events from "./pages/Events";
import Education from "./pages/Education";
import Contact from "./pages/Contact";
import Members from "./pages/Members";
import MemberDocuments from "./pages/MemberDocuments";
import MemberAgenda from "./pages/MemberAgenda";
import MemberMessages from "./pages/MemberMessages";
import MemberStudyTime from "./pages/MemberStudyTime";
import WorshipfulMasters from "./pages/WorshipfulMasters";
import CommissionCRUD from "./pages/CommissionCRUD";
import CommissionFinance from "./pages/CommissionFinance";
import CommissionManagement from "./pages/CommissionManagement";
import CommissionChancellery from "./pages/CommissionChancellery";
import CommissionSecretary from "./pages/CommissionSecretary";
import CommissionHospitalaria from "./pages/CommissionHospitalaria";
import CommissionStudyTime from "./pages/CommissionStudyTime";
import Profile from "./pages/Profile";
import UserWorks from "./pages/UserWorks";
import Library from "./pages/Library";
import PendingApproval from "./pages/PendingApproval";
import CommissionMessages from "./pages/CommissionMessages";
import CommissionBooks from "./pages/CommissionBooks";
import CommissionArticles from "./pages/CommissionArticles";
import CommissionGlossary from "./pages/CommissionGlossary";
import CommissionFAQ from "./pages/CommissionFAQ";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isMember } = useAuth();
  return (
    <>
      <Navigation />
      <main className={isMember ? "pb-16 lg:pb-0" : ""}>
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/about" element={<About />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/events" element={<Events />} />
            <Route path="/education" element={<Education />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/documents" element={<MemberDocuments />} />
            <Route path="/members/agenda" element={<MemberAgenda />} />
            <Route path="/members/study-time" element={<UserWorks />} />
            <Route path="/members/messages" element={<MemberMessages />} />
            <Route path="/members/worshipful-masters" element={<WorshipfulMasters />} />
            <Route path="/commission/crud" element={<CommissionCRUD />} />
            <Route path="/commission/finance" element={<CommissionFinance />} />
            <Route path="/commission/management" element={<CommissionManagement />} />
            <Route path="/commission/chancellery" element={<CommissionChancellery />} />
            <Route path="/commission/secretary" element={<CommissionSecretary />} />
            <Route path="/commission/hospitalaria" element={<CommissionHospitalaria />} />
            <Route path="/commission/messages" element={<CommissionMessages />} />
            <Route path="/commission/study-time" element={<CommissionStudyTime />} />
            <Route path="/commission/books" element={<CommissionBooks />} />
            <Route path="/commission/articles" element={<CommissionArticles />} />
            <Route path="/commission/glossary" element={<CommissionGlossary />} />
            <Route path="/commission/faq" element={<CommissionFAQ />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </main>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
