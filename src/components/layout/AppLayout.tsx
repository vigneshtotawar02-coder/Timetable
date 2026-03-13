import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import { UserRole } from "@/types";
import { Bell } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

interface AppLayoutProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  title?: string;
}

export default function AppLayout({ children, requiredRole, title }: AppLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (user && !roles.includes(user.role)) {
      return <Navigate to={`/${user.role}`} replace />;
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 flex-shrink-0">
          <div className="ml-10 lg:ml-0">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user?.name.charAt(0)}</span>
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
