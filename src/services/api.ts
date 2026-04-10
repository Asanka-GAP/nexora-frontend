import axios from "axios";
import type {
  ApiResponse, Student, StudentCreateRequest, ClassItem,
  ClassCreateRequest, MarkAttendanceRequest, MarkAttendanceResponse, Schedule,
  AttendanceRecord, LoginResponse, AdminDashboard, TeacherItem,
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nexora_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("nexora_token");
        localStorage.removeItem("nexora_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginApi = (username: string, password: string) =>
  api.post<ApiResponse<LoginResponse>>("/auth/login", { username, password });

export const resetPasswordApi = (username: string, otp: string, newPassword: string) =>
  api.post<ApiResponse<void>>("/auth/reset-password", { username, otp, newPassword });

export const verifyOtpByUsernameApi = (username: string, otp: string) =>
  api.post<ApiResponse<void>>("/auth/verify-otp-by-username", { username, otp });

export const forgotPasswordApi = (email: string) =>
  api.post<ApiResponse<void>>("/auth/forgot-password", { email });

export const forgotPasswordResetApi = (email: string, otp: string, newPassword: string) =>
  api.post<ApiResponse<void>>("/auth/forgot-password/reset", { email, otp, newPassword });

export const resendOtpApi = (email: string) =>
  api.post<ApiResponse<void>>("/auth/resend-otp", { email });

// Students
export const getStudents = () =>
  api.get<ApiResponse<Student[]>>("/students").then((r) => r.data.data);

export const createStudent = (data: StudentCreateRequest) =>
  api.post<ApiResponse<Student>>("/students", data).then((r) => r.data.data);

export const updateStudent = (id: string, data: { fullName: string; currentGrade: number; address?: string }) =>
  api.put<ApiResponse<Student>>(`/students/${id}`, data).then((r) => r.data.data);

export const toggleStudentStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/students/${id}/status`);

export const deleteStudentApi = (id: string) =>
  api.delete<ApiResponse<void>>(`/students/${id}`);

export const addStudentContact = (studentId: string, data: { contactName: string; phone: string; relationship: string; isPrimary: boolean }) =>
  api.post<ApiResponse<Student>>(`/students/${studentId}/contacts`, data).then((r) => r.data.data);

export const deleteStudentContact = (studentId: string, contactId: string) =>
  api.delete<ApiResponse<void>>(`/students/${studentId}/contacts/${contactId}`);

// Classes
export const getClasses = () =>
  api.get<ApiResponse<ClassItem[]>>("/classes").then((r) => r.data.data);

export const createClass = (data: ClassCreateRequest) =>
  api.post<ApiResponse<ClassItem>>("/classes", data).then((r) => r.data.data);

export const updateClass = (id: string, data: { name: string; grade: number; location?: string }) =>
  api.put<ApiResponse<ClassItem>>(`/classes/${id}`, data).then((r) => r.data.data);

export const deleteClassApi = (id: string) =>
  api.delete<ApiResponse<void>>(`/classes/${id}`);

export const cancelClass = (id: string, reason?: string) =>
  api.post(`/classes/${id}/cancel`, reason ? { reason } : {});

export const addScheduleToClass = (classId: string, entry: { dayOfWeek: number; startTime: string; endTime: string }) =>
  api.post<ApiResponse<ClassItem>>(`/classes/${classId}/schedules`, entry).then((r) => r.data.data);

export const deleteScheduleFromClass = (classId: string, scheduleId: string) =>
  api.delete<ApiResponse<void>>(`/classes/${classId}/schedules/${scheduleId}`);

// Attendance
export const markAttendance = (data: MarkAttendanceRequest) =>
  api.post<ApiResponse<MarkAttendanceResponse>>("/attendance/mark", data).then((r) => r.data.data);

export const getAttendance = (params?: { classId?: string; from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  if (params?.classId) clean.classId = params.classId;
  return api.get<ApiResponse<AttendanceRecord[]>>("/attendance", { params: clean }).then((r) => r.data.data);
};

export const getTodayAttendanceCount = () =>
  api.get<ApiResponse<number>>("/attendance/today-count").then((r) => r.data.data);

export const getDashboard = () =>
  api.get<ApiResponse<{ todayCount: number; weekTrend: { date: string; count: number }[]; recentToday: AttendanceRecord[] }>>("/attendance/dashboard").then((r) => r.data.data);

// Schedules
export const getSchedules = (params?: { status?: string; from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  if (params?.status) clean.status = params.status;
  return api.get<ApiResponse<Schedule[]>>("/schedules", { params: clean }).then((r) => r.data.data).catch(() => [] as Schedule[]);
};

export const cancelSchedule = (id: string, reason?: string) =>
  api.post(`/schedules/${id}/cancel`, reason ? { reason } : {});

export const reactivateSchedule = (id: string, reason?: string) =>
  api.post(`/schedules/${id}/reactivate`, reason ? { reason } : {});

// Super Admin
export const getAdminDashboard = () =>
  api.get<ApiResponse<AdminDashboard>>("/admin/dashboard").then((r) => r.data.data);

export const getTeachers = () =>
  api.get<ApiResponse<TeacherItem[]>>("/admin/teachers").then((r) => r.data.data);

export const createTeacher = (data: { name: string; email: string; phone: string; subject: string }) =>
  api.post<ApiResponse<TeacherItem>>("/admin/teachers", data).then((r) => r.data.data);

export const toggleTeacherStatus = (id: string) =>
  api.patch<ApiResponse<TeacherItem>>(`/admin/teachers/${id}/status`).then((r) => r.data.data);

export const deleteTeacher = (id: string) =>
  api.delete<ApiResponse<void>>(`/admin/teachers/${id}`);

export default api;
