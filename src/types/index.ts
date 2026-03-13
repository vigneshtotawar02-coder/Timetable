export type UserRole = "admin" | "faculty" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  semester?: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  credits: number;
  facultyId: string;
  facultyName: string;
  hoursPerWeek: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  maxHoursPerDay: number;
  availableSlots: string[];
  assignedCourses: string[];
}

export interface Classroom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  type: "lecture" | "lab" | "seminar";
  facilities: string[];
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  day?: string;
}

export interface TimetableCell {
  courseCode: string;
  courseName: string;
  facultyName: string;
  room: string;
  type: "lecture" | "lab" | "seminar";
}

export interface TimetableEntry {
  day: string;
  timeSlot: string;
  cell: TimetableCell | null;
}

export type TimetableGrid = Record<string, Record<string, TimetableCell | null>>;

export interface WorkloadData {
  name: string;
  hours: number;
  courses: number;
}

export interface RoomUtilizationData {
  name: string;
  value: number;
  fill: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
