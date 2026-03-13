import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Auth
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Courses from "@/pages/admin/Courses";
import FacultyManagement from "@/pages/admin/FacultyManagement";
import Classrooms from "@/pages/admin/Classrooms";
import TimeSlots from "@/pages/admin/TimeSlots";
import TimetableView from "@/pages/admin/TimetableView";
import Analytics from "@/pages/admin/Analytics";

// Faculty
import FacultyDashboard from "@/pages/faculty/FacultyDashboard";
import FacultyTimetable from "@/pages/faculty/FacultyTimetable";

// Student
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentTimetable from "@/pages/student/StudentTimetable";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "faculty") return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/courses" element={<Courses />} />
      <Route path="/admin/faculty" element={<FacultyManagement />} />
      <Route path="/admin/classrooms" element={<Classrooms />} />
      <Route path="/admin/timeslots" element={<TimeSlots />} />
      <Route path="/admin/timetable" element={<TimetableView />} />
      <Route path="/admin/analytics" element={<Analytics />} />

      {/* Faculty Routes */}
      <Route path="/faculty" element={<FacultyDashboard />} />
      <Route path="/faculty/timetable" element={<FacultyTimetable />} />
      <Route path="/faculty/courses" element={<FacultyDashboard />} />

      {/* Student Routes */}
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/timetable" element={<StudentTimetable />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
