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
  admissionYear: number;
  currentGrade: number;
  isActive: boolean;
  createdAt: string;
}

export interface StudentCreateRequest {
  studentCode: string;
  fullName: string;
  admissionYear: number;
  currentGrade: number;
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
  teacherId: string;
  createdAt: string;
}

export interface ClassCreateRequest {
  name: string;
  subject: string;
  grade: number;
  teacherId: string;
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

export interface Schedule {
  id: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  className?: string;
  subject?: string;
}
