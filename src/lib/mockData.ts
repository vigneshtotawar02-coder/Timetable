import { Course, Faculty, Classroom, TimeSlot, TimetableGrid, WorkloadData, RoomUtilizationData } from "@/types";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const TIME_SLOTS: TimeSlot[] = [
  { id: "ts2", label: "9:00 - 10:00", startTime: "09:00", endTime: "10:00" },
  { id: "ts3", label: "10:00 - 11:00", startTime: "10:00", endTime: "11:00" },
  { id: "ts4", label: "11:00 - 12:00", startTime: "11:00", endTime: "12:00" },
  { id: "ts5", label: "12:00 - 13:00", startTime: "12:00", endTime: "13:00" },
  { id: "ts6", label: "14:00 - 15:00", startTime: "14:00", endTime: "15:00" },
  { id: "ts7", label: "15:00 - 16:00", startTime: "15:00", endTime: "16:00" },
  { id: "ts8", label: "16:00 - 17:00", startTime: "16:00", endTime: "17:00" },
];

export const MOCK_COURSES: Course[] = [
  { id: "c1", code: "CS301", name: "Data Structures & Algorithms", department: "Computer Science", semester: 3, credits: 4, facultyId: "f1", facultyName: "Dr. Priya Sharma", hoursPerWeek: 4 },
  { id: "c2", code: "CS302", name: "Database Management Systems", department: "Computer Science", semester: 3, credits: 3, facultyId: "f2", facultyName: "Prof. Rajesh Kumar", hoursPerWeek: 3 },
  { id: "c3", code: "CS303", name: "Operating Systems", department: "Computer Science", semester: 3, credits: 3, facultyId: "f3", facultyName: "Dr. Anita Verma", hoursPerWeek: 3 },
  { id: "c4", code: "CS401", name: "Machine Learning", department: "Computer Science", semester: 5, credits: 4, facultyId: "f1", facultyName: "Dr. Priya Sharma", hoursPerWeek: 4 },
  { id: "c5", code: "CS402", name: "Computer Networks", department: "Computer Science", semester: 5, credits: 3, facultyId: "f4", facultyName: "Prof. Suresh Mehta", hoursPerWeek: 3 },
  { id: "c6", code: "EC301", name: "Digital Electronics", department: "Electronics", semester: 3, credits: 4, facultyId: "f5", facultyName: "Dr. Kavita Nair", hoursPerWeek: 4 },
];

export const MOCK_FACULTY: Faculty[] = [
  { id: "f1", name: "Dr. Priya Sharma", email: "priya.sharma@edu.ac.in", department: "Computer Science", designation: "Professor", maxHoursPerDay: 3, availableSlots: ["ts2","ts3","ts6","ts7"], assignedCourses: ["c1","c4"] },
  { id: "f2", name: "Prof. Rajesh Kumar", email: "rajesh.kumar@edu.ac.in", department: "Computer Science", designation: "Associate Professor", maxHoursPerDay: 4, availableSlots: ["ts2","ts3","ts4","ts6","ts7","ts8"], assignedCourses: ["c2"] },
  { id: "f3", name: "Dr. Anita Verma", email: "anita.verma@edu.ac.in", department: "Computer Science", designation: "Professor", maxHoursPerDay: 3, availableSlots: ["ts2","ts3","ts4"], assignedCourses: ["c3"] },
  { id: "f4", name: "Prof. Suresh Mehta", email: "suresh.mehta@edu.ac.in", department: "Computer Science", designation: "Assistant Professor", maxHoursPerDay: 4, availableSlots: ["ts3","ts4","ts5","ts6","ts7"], assignedCourses: ["c5"] },
  { id: "f5", name: "Dr. Kavita Nair", email: "kavita.nair@edu.ac.in", department: "Electronics", designation: "Professor", maxHoursPerDay: 3, availableSlots: ["ts2","ts6","ts7","ts8"], assignedCourses: ["c6"] },
];

export const MOCK_CLASSROOMS: Classroom[] = [
  { id: "r1", name: "CS-101", building: "CS Block", capacity: 60, type: "lecture", facilities: ["Projector", "AC", "WiFi"] },
  { id: "r2", name: "CS-Lab1", building: "CS Block", capacity: 40, type: "lab", facilities: ["Computers", "AC", "WiFi"] },
  { id: "r3", name: "LH-201", building: "Lecture Hall", capacity: 120, type: "lecture", facilities: ["Projector", "AC", "WiFi", "Mic"] },
  { id: "r4", name: "EC-102", building: "EC Block", capacity: 60, type: "lecture", facilities: ["Projector", "AC"] },
  { id: "r5", name: "Seminar-01", building: "Admin Block", capacity: 30, type: "seminar", facilities: ["Projector", "AC", "WiFi"] },
];

export const MOCK_TIMETABLE_CS3: TimetableGrid = {
  "Monday": {
    "9:00 - 10:00": { courseCode: "CS302", courseName: "DBMS", facultyName: "Prof. Rajesh Kumar", room: "LH-201", type: "lecture" },
    "10:00 - 11:00": null,
    "11:00 - 12:00": { courseCode: "CS303", courseName: "Operating Systems", facultyName: "Dr. Anita Verma", room: "CS-101", type: "lecture" },
    "12:00 - 13:00": null,
    "14:00 - 15:00": { courseCode: "CS301", courseName: "DSA Lab", facultyName: "Dr. Priya Sharma", room: "CS-Lab1", type: "lab" },
    "15:00 - 16:00": { courseCode: "CS301", courseName: "DSA Lab", facultyName: "Dr. Priya Sharma", room: "CS-Lab1", type: "lab" },
    "16:00 - 17:00": null,
  },
  "Tuesday": {
    "9:00 - 10:00": { courseCode: "CS302", courseName: "DBMS", facultyName: "Prof. Rajesh Kumar", room: "LH-201", type: "lecture" },
    "10:00 - 11:00": { courseCode: "CS301", courseName: "Data Structures", facultyName: "Dr. Priya Sharma", room: "CS-101", type: "lecture" },
    "11:00 - 12:00": null,
    "12:00 - 13:00": null,
    "14:00 - 15:00": { courseCode: "CS303", courseName: "OS Lab", facultyName: "Dr. Anita Verma", room: "CS-Lab1", type: "lab" },
    "15:00 - 16:00": { courseCode: "CS303", courseName: "OS Lab", facultyName: "Dr. Anita Verma", room: "CS-Lab1", type: "lab" },
    "16:00 - 17:00": null,
  },
  "Wednesday": {
    "9:00 - 10:00": null,
    "10:00 - 11:00": { courseCode: "CS302", courseName: "DBMS", facultyName: "Prof. Rajesh Kumar", room: "LH-201", type: "lecture" },
    "11:00 - 12:00": { courseCode: "CS301", courseName: "Data Structures", facultyName: "Dr. Priya Sharma", room: "CS-101", type: "lecture" },
    "12:00 - 13:00": null,
    "14:00 - 15:00": null,
    "15:00 - 16:00": null,
    "16:00 - 17:00": null,
  },
  "Thursday": {
    "9:00 - 10:00": { courseCode: "CS301", courseName: "Data Structures", facultyName: "Dr. Priya Sharma", room: "CS-101", type: "lecture" },
    "10:00 - 11:00": null,
    "11:00 - 12:00": { courseCode: "CS302", courseName: "DBMS", facultyName: "Prof. Rajesh Kumar", room: "LH-201", type: "lecture" },
    "12:00 - 13:00": null,
    "14:00 - 15:00": { courseCode: "CS303", courseName: "Operating Systems", facultyName: "Dr. Anita Verma", room: "CS-101", type: "lecture" },
    "15:00 - 16:00": null,
    "16:00 - 17:00": null,
  },
  "Friday": {
    "9:00 - 10:00": { courseCode: "CS302", courseName: "DBMS Lab", facultyName: "Prof. Rajesh Kumar", room: "CS-Lab1", type: "lab" },
    "10:00 - 11:00": null,
    "11:00 - 12:00": { courseCode: "CS301", courseName: "Data Structures", facultyName: "Dr. Priya Sharma", room: "CS-101", type: "lecture" },
    "12:00 - 13:00": null,
    "14:00 - 15:00": null,
    "15:00 - 16:00": null,
    "16:00 - 17:00": null,
  },
};

export const WORKLOAD_DATA: WorkloadData[] = [
  { name: "Dr. Priya Sharma", hours: 8, courses: 2 },
  { name: "Prof. Rajesh Kumar", hours: 6, courses: 1 },
  { name: "Dr. Anita Verma", hours: 6, courses: 1 },
  { name: "Prof. Suresh Mehta", hours: 5, courses: 1 },
  { name: "Dr. Kavita Nair", hours: 7, courses: 1 },
];

export const ROOM_UTILIZATION_DATA: RoomUtilizationData[] = [
  { name: "CS-101", value: 82, fill: "hsl(213, 62%, 30%)" },
  { name: "CS-Lab1", value: 70, fill: "hsl(178, 68%, 38%)" },
  { name: "LH-201", value: 55, fill: "hsl(199, 89%, 48%)" },
  { name: "EC-102", value: 65, fill: "hsl(38, 92%, 50%)" },
  { name: "Seminar-01", value: 40, fill: "hsl(142, 72%, 36%)" },
];

export const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical"];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
