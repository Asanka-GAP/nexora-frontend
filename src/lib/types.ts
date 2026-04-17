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
  enrolledClasses: EnrolledClass[];
  attendanceCount: number;
  presentCount: number;
}

export interface EnrolledClass {
  id: string;
  name: string;
  grade: number;
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
  classIds?: string[];
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
  studentCount: number;
  completedSessions: number;
  cancelledSessions: number;
}

export interface ClassScheduleItem {
  id: string;
  scheduleType: string;
  dayOfWeek: number;
  sessionDate?: string;
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
  smsInfo?: SmsInfo;
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
  smsBalance: number;
  smsBalanceExpiry?: string;
  smsProfile?: SmsProfile;
  recentTeachers: RecentTeacher[];
}

export interface SmsProfile {
  firstName: string;
  lastName?: string;
  email: string;
  timezone: string;
  lastAccessAt: string;
  apiToken: string;
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

export interface TeacherProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  role: string;
  smsNotificationsEnabled: boolean;
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

// Billing
export interface MonthlyBill {
  month: string; // "2024-01"
  monthDisplay: string; // "January 2024"
  smsUnits: number;
  smsCost: number;
  messagesSent: number;
  softwareCost: number;
  totalCost: number;
  paymentStatus: string;
}

export interface CurrentMonthUsage {
  currentMonth: string;
  monthDisplay: string;
  currentUnits: number;
  currentSmsCost: number;
  messagesSent: number;
  softwareCost: number;
  totalCurrentCost: number;
  paymentStatus: string;
  usageDisplay: string;
}

export interface BillingHistory {
  monthlyBills: MonthlyBill[];
  currentMonth: MonthlyBill;
}

export interface SmsInfo {
  smsMessage: string;
  messageLength: number;
  smsUnits: number;
  smsCost: number;
  parentPhone: string;
}
