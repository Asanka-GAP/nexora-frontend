export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  currentGrade: number;
  address?: string;
  isActive: boolean;
  createdAt: string;
  contacts: StudentContact[];
}

export interface StudentContact {
  id: string;
  contactName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface StudentCreateRequest {
  fullName: string;
  currentGrade: number;
  address?: string;
  contacts: ContactRequest[];
}

export interface ContactRequest {
  contactName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface ClassItem {
  id: string;
  name: string;
  subject: string;
  grade: number;
  location?: string;
  teacherId: string;
  createdAt: string;
  schedules: ClassScheduleItem[];
}

export interface ClassScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ClassCreateRequest {
  name: string;
  grade: number;
  location?: string;
  schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export interface MarkAttendanceRequest {
  studentCode: string;
  classId: string;
}

export interface MarkAttendanceResponse {
  attendanceId: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  checkInTime: string;
  status: string;
  message: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  grade?: number;
  date: string;
  checkInTime: string;
  status: string;
}

export interface Schedule {
  id: string;
  classId: string;
  className: string;
  grade?: number;
  location?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
}

// Auth
export interface LoginResponse {
  teacherId: string;
  username: string;
  name: string;
  subject?: string;
  role: string;
  token: string;
  firstLogin: boolean;
  email: string | null;
}

export interface AuthUser {
  teacherId: string;
  username: string;
  name: string;
  subject?: string;
  role: string;
}

// Super Admin
export interface AdminDashboard {
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  totalStudents: number;
  recentTeachers: RecentTeacher[];
}

export interface RecentTeacher {
  id: string;
  username: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface TeacherItem {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  role: string;
  status: string;
  firstLogin: boolean;
  createdAt: string;
}
