import axios from "axios";
import type {
  Course,
  Classroom,
  WorkloadData,
  RoomUtilizationData,
} from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tt_token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  // Log all API requests for debugging
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.url}`, error);
    return Promise.reject(error);
  }
);

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "faculty" | "student";
    department?: string;
    semester?: number;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export async function loginApi(email: string, password: string) {
  const res = await api.post<{ success: boolean; data: LoginResponse }>(
    "/api/auth/login",
    { email, password },
  );
  return res.data.data;
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "faculty" | "student";
  department: string;
  semester?: number;
}) {
  const res = await api.post<{ success: boolean; data: { user: any } }>(
    "/api/auth/register",
    payload
  );
  return res.data.data;
}

// Timetable
export async function fetchDepartmentTimetable(
  department: string,
  semester: number,
) {
  const res = await api.get<{
    success: boolean;
    data: { timetable: any[] };
  }>(`/api/timetable/${encodeURIComponent(department)}/${semester}`);
  return res.data.data.timetable;
}

export async function generateDepartmentTimetable(
  department: string,
  semester: number,
) {
  const res = await api.post<{
    success: boolean;
    data: {
      timetable: any[];
      stats: { total_classes: number; courses_scheduled: number };
    };
  }>("/api/timetable/generate", { department, semester });
  return res.data.data;
}

export async function fetchFacultyTimetable(facultyId: string, semester?: number) {
  const res = await api.get<{
    success: boolean;
    data: { timetable: any[] };
  }>("/api/timetable/faculty/" + facultyId, {
    params: semester ? { semester } : undefined,
  });
  return res.data.data.timetable;
}

// Courses
export async function fetchCourses() {
  const res = await api.get<{ success: boolean; data: { courses: any[] } }>("/api/courses");
  return res.data.data.courses;
}

export async function createCourse(payload: {
  course_name: string;
  department: string;
  semester: number;
  faculty_id: string | null;
  weekly_hours: number;
}) {
  const res = await api.post<{ success: boolean; data: { course: any } }>("/api/courses", payload);
  return res.data.data.course;
}

export async function updateCourse(
  id: string,
  payload: Partial<{
    course_name: string;
    department: string;
    semester: number;
    faculty_id: string | null;
    weekly_hours: number;
  }>,
) {
  const res = await api.put<{ success: boolean; data: { course: any } }>(`/api/courses/${id}`, payload);
  return res.data.data.course;
}

export async function deleteCourse(id: string) {
  const res = await api.delete<{ success: boolean; message: string }>(`/api/courses/${id}`);
  return res.data;
}

// Fetch faculty users for course assignment
export async function fetchFaculty() {
  const res = await api.get<{ success: boolean; data: { users: any[] } }>("/api/auth/users?role=faculty");
  return res.data.data.users;
}

// Update user profile (for faculty management)
export async function updateUser(id: string, payload: Partial<{
  name: string;
  email: string;
  department: string;
}>) {
  const res = await api.put<{ success: boolean; data: { user: any } }>(`/api/auth/users/${id}`, payload);
  return res.data.data.user;
}

// Delete user (for faculty management)
export async function deleteUser(id: string) {
  const res = await api.delete<{ success: boolean; message: string }>(`/api/auth/users/${id}`);
  return res.data;
}

// Rooms
export async function fetchRooms() {
  const res = await api.get<{ success: boolean; data: { rooms: any[] } }>("/api/rooms");
  return res.data.data.rooms || res.data.data || [];
}

export async function createRoom(payload: {
  room_name: string;
  capacity: number;
}) {
  const res = await api.post<{ success: boolean; data: { room: any } }>("/api/rooms", payload);
  return res.data.data.room;
}

export async function updateRoom(
  id: string,
  payload: Partial<{
    room_name: string;
    capacity: number;
  }>,
) {
  const res = await api.put<{ success: boolean; data: { room: any } }>(`/api/rooms/${id}`, payload);
  return res.data.data.room;
}

export async function deleteRoom(id: string) {
  const res = await api.delete<{ success: boolean; message: string }>(`/api/rooms/${id}`);
  return res.data;
}

// Time slots
export async function fetchTimeSlots() {
  const res = await api.get<{ success: boolean; data: { timeSlots: any[] } }>("/api/time-slots");
  return res.data.data.timeSlots || [];
}

export async function createTimeSlot(payload: {
  day: string;
  start_time: string;
  end_time: string;
}) {
  const res = await api.post<{ success: boolean; data: { time_slot: any } }>("/api/time-slots", payload);
  return res.data.data.time_slot;
}

export async function updateTimeSlot(
  id: number,
  payload: Partial<{ day: string; start_time: string; end_time: string }>,
) {
  const res = await api.put<{ success: boolean; data: { time_slot: any } }>(`/api/time-slots/${id}`, payload);
  return res.data.data.time_slot;
}

export async function deleteTimeSlot(id: number) {
  const res = await api.delete<{ success: boolean; message: string }>(`/api/time-slots/${id}`);
  return res.data;
}

// Analytics
export async function fetchFacultyWorkloadAnalytics(params?: {
  department?: string;
  semester?: number;
}): Promise<{ workload: any[]; statistics: any }> {
  const res = await api.get<{ success: boolean; data: any }>(
    "/api/analytics/faculty-workload",
    { params },
  );
  return res.data.data;
}

export async function fetchRoomUtilizationAnalytics(params?: {
  department?: string;
  semester?: number;
}): Promise<{ utilization: any[]; statistics: any }> {
  const res = await api.get<{ success: boolean; data: any }>(
    "/api/analytics/room-utilization",
    { params },
  );
  return res.data.data;
}

export async function fetchDepartmentOverviewAnalytics(params?: {
  department?: string;
}) {
  const res = await api.get<{ success: boolean; data: any }>(
    "/api/analytics/department-overview",
    { params },
  );
  return res.data.data;
}

