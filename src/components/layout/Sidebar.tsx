import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, Users, Building2, Clock, CalendarDays,
  BarChart3, LogOut, Menu, X, GraduationCap, Calendar, ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Courses", href: "/admin/courses", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Faculty", href: "/admin/faculty", icon: <Users className="h-4 w-4" /> },
  { label: "Classrooms", href: "/admin/classrooms", icon: <Building2 className="h-4 w-4" /> },
  { label: "Time Slots", href: "/admin/timeslots", icon: <Clock className="h-4 w-4" /> },
  { label: "Timetable", href: "/admin/timetable", icon: <CalendarDays className="h-4 w-4" /> },
];

const FACULTY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/faculty", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Timetable", href: "/faculty/timetable", icon: <CalendarDays className="h-4 w-4" /> },
];

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Timetable", href: "/student/timetable", icon: <CalendarDays className="h-4 w-4" /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "admin" ? ADMIN_NAV : user?.role === "faculty" ? FACULTY_NAV : STUDENT_NAV;
  const roleLabel = user?.role === "admin" ? "Administrator" : user?.role === "faculty" ? "Faculty Member" : "Student";
  const roleColor = user?.role === "admin" ? "bg-warning/20 text-warning" : user?.role === "faculty" ? "bg-teal/20 text-teal" : "bg-info/20 text-info";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 p-5 border-b border-sidebar-border", collapsed && "justify-center p-4")}>
        <div className="p-2 bg-teal rounded-xl flex-shrink-0">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-white">TimeTableAI</h1>
            <p className="text-[10px] text-sidebar-foreground/60">Smart Scheduling</p>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-teal flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", roleColor)}>{roleLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "sidebar-nav-item",
                isActive && "active",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && <ChevronRight className="ml-auto h-3 w-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={logout}
          className={cn("sidebar-nav-item w-full hover:bg-red-500/20 hover:text-red-300", collapsed && "justify-center px-0")}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary rounded-lg text-primary-foreground shadow-elevated"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed left-0 top-0 h-full w-64 z-40 transition-transform duration-300",
        "bg-sidebar",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300",
        "bg-sidebar flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-accent transition-colors"
        >
          <ChevronRight className={cn("h-3 w-3 text-sidebar-foreground transition-transform", collapsed ? "" : "rotate-180")} />
        </button>
      </aside>
    </>
  );
}
