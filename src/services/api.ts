import axios from "axios";
import type {
  ApiResponse, Student, StudentCreateRequest, ClassItem,
  ClassCreateRequest, MarkAttendanceRequest, MarkAttendanceResponse, Schedule,
  AttendanceRecord, LoginResponse, AdminDashboard, TeacherItem, TeacherProfile,
  CurrentMonthUsage, BillingHistory,
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

export const updateStudent = (id: string, data: { fullName: string; currentGrade: number; address?: string; classIds?: string[] }) =>
  api.put<ApiResponse<Student>>(`/students/${id}`, data).then((r) => r.data.data);

export const toggleStudentStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/students/${id}/status`);

export const deleteStudentApi = (id: string) =>
  api.delete<ApiResponse<void>>(`/students/${id}`);

export const addStudentContact = (studentId: string, data: { contactName: string; phone: string; relationship: string; isPrimary: boolean }) =>
  api.post<ApiResponse<Student>>(`/students/${studentId}/contacts`, data).then((r) => r.data.data);

export const deleteStudentContact = (studentId: string, contactId: string) =>
  api.delete<ApiResponse<void>>(`/students/${studentId}/contacts/${contactId}`);

export const bulkImportStudents = (data: { students: { fullName: string; currentGrade: number; address?: string; parentName?: string; parentPhone?: string; parentRelationship?: string; classIds?: string[] }[] }) =>
  api.post<ApiResponse<{ total: number; success: number; failed: number; errors: string[] }>>("/students/bulk-import", data).then((r) => r.data.data);

export const bulkAssignClasses = (data: { studentIds: string[]; classIds: string[] }) =>
  api.post<ApiResponse<{ studentsProcessed: number; enrollmentsCreated: number; skippedDuplicates: number }>>("/students/bulk-assign-classes", data).then((r) => r.data.data);

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

export const addScheduleToClass = (classId: string, entry: { scheduleType: string; dayOfWeek?: number; sessionDate?: string; startTime: string; endTime: string }) =>
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

export const getStudentAttendance = (studentId: string, params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/student/${studentId}`, { params: clean }).then((r) => r.data.data);
};

export const getDashboard = () =>
  api.get<ApiResponse<{ todayCount: number; weekTrend: { date: string; count: number }[]; recentToday: AttendanceRecord[] }>>("/attendance/dashboard").then((r) => r.data.data);

export const getDashboardChartSummary = () =>
  api.get<ApiResponse<{ classOverview: { name: string; fullName: string; students: number }[]; gradeDistribution: { grade: string; gradeNum: number; count: number }[]; totalStudents: number }>>("/attendance/dashboard/chart-summary").then((r) => r.data.data);

// Schedules
export const getSchedules = (params?: { status?: string; from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  if (params?.status) clean.status = params.status;
  return api.get<ApiResponse<Schedule[]>>("/schedules", { params: clean }).then((r) => r.data.data).catch(() => [] as Schedule[]);
};

export const getClassSessions = (classId: string, params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<Schedule[]>>(`/schedules/class/${classId}`, { params: clean }).then((r) => r.data.data);
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

export const getTeacherBilling = (id: string) =>
  api.get<ApiResponse<{ teacherName: string; currentMonth: CurrentMonthUsage; billingHistory: BillingHistory }>>(`/admin/teachers/${id}/billing`).then((r) => r.data.data);

export const updateTeacherPaymentStatus = (id: string, yearMonth: string, paymentStatus: string) =>
  api.patch<ApiResponse<void>>(`/admin/teachers/${id}/billing/payment-status`, { yearMonth, paymentStatus });

export const adminBulkImportStudents = (teacherId: string, data: { students: { fullName: string; currentGrade: number; address?: string; parentName?: string; parentPhone?: string; parentRelationship?: string; classIds?: string[] }[] }) =>
  api.post<ApiResponse<{ total: number; success: number; failed: number; errors: string[] }>>(`/admin/teachers/${teacherId}/students/bulk-import`, data).then((r) => r.data.data);

export const adminGetTeacherClasses = (teacherId: string) =>
  api.get<ApiResponse<ClassItem[]>>(`/admin/teachers/${teacherId}/classes`).then((r) => r.data.data);

export const adminCreateTeacherClass = (teacherId: string, data: ClassCreateRequest) =>
  api.post<ApiResponse<ClassItem>>(`/admin/teachers/${teacherId}/classes`, data).then((r) => r.data.data);

export const adminGetTeacherStudents = (teacherId: string) =>
  api.get<ApiResponse<Student[]>>(`/admin/teachers/${teacherId}/students`).then((r) => r.data.data);

export const adminBulkAssignClasses = (teacherId: string, data: { studentIds: string[]; classIds: string[] }) =>
  api.post<ApiResponse<{ studentsProcessed: number; enrollmentsCreated: number; skippedDuplicates: number }>>(`/admin/teachers/${teacherId}/students/bulk-assign-classes`, data).then((r) => r.data.data);

// Teacher Settings
export const getTeacherProfile = () =>
  api.get<ApiResponse<TeacherProfile>>("/settings/profile").then((r) => r.data.data);

export const updateTeacherProfile = (data: { name: string; phone: string; subject: string }) =>
  api.put<ApiResponse<TeacherProfile>>("/settings/profile", data).then((r) => r.data.data);

export const changeTeacherPassword = (currentPassword: string, newPassword: string) =>
  api.put<ApiResponse<void>>("/settings/password", { currentPassword, newPassword });

export const sendEmailOtp = (newEmail: string) =>
  api.post<ApiResponse<void>>("/settings/email/send-otp", { newEmail });

export const changeTeacherEmail = (newEmail: string, otp: string) =>
  api.put<ApiResponse<TeacherProfile>>("/settings/email", { newEmail, otp }).then((r) => r.data.data);

export const getIdCardDesign = () =>
  api.get<ApiResponse<{ design: string | null }>>("/settings/id-card-design").then((r) => r.data.data);

export const saveIdCardDesign = (design: string) =>
  api.put<ApiResponse<{ design: string }>>("/settings/id-card-design", { design }).then((r) => r.data.data);

// Academic Year Config
export const getAcademicYearConfig = () =>
  api.get<ApiResponse<{ nextUpgradeDate: string; lastUpgradedAt: string | null }>>("/settings/academic-year").then((r) => r.data.data);

export const updateAcademicYearConfig = (data: { nextUpgradeDate: string }) =>
  api.put<ApiResponse<{ nextUpgradeDate: string; lastUpgradedAt: string | null }>>("/settings/academic-year", data).then((r) => r.data.data);

// SMS Template
export interface SmsTemplateData { template: string; preview: string; characterCount: number; units: number; cost: number; }

export const getSmsTemplate = () =>
  api.get<ApiResponse<SmsTemplateData>>("/settings/sms-template").then((r) => r.data.data);

export const updateSmsTemplate = (template: string) =>
  api.put<ApiResponse<SmsTemplateData>>("/settings/sms-template", { template }).then((r) => r.data.data);

export const previewSmsTemplate = (template: string) =>
  api.post<ApiResponse<SmsTemplateData>>("/settings/sms-template/preview", { template }).then((r) => r.data.data);

export const getSmsAbsentTemplate = () =>
  api.get<ApiResponse<SmsTemplateData>>("/settings/sms-absent-template").then((r) => r.data.data);

export const updateSmsAbsentTemplate = (template: string) =>
  api.put<ApiResponse<SmsTemplateData>>("/settings/sms-absent-template", { template }).then((r) => r.data.data);

export const previewSmsAbsentTemplate = (template: string) =>
  api.post<ApiResponse<SmsTemplateData>>("/settings/sms-absent-template/preview", { template }).then((r) => r.data.data);

// SMS Settings
export const updateSmsSettings = (data: { smsNotificationsEnabled: boolean }) =>
  api.put<ApiResponse<TeacherProfile>>("/settings/sms-settings", data).then((r) => r.data.data);

// Billing
export const getCurrentMonthUsage = () =>
  api.get<ApiResponse<CurrentMonthUsage>>("/billing/current-month").then((r) => r.data.data);

export const getBillingPaymentInfo = () =>
  api.get<ApiResponse<{ accountHolder: string; bank: string; branch: string; accountNumber: string; dueDays: number; whatsapp: string }>>("/billing/payment-info").then((r) => r.data.data);

export const getBillingHistory = () =>
  api.get<ApiResponse<BillingHistory>>("/billing/history").then((r) => r.data.data);

export const exportBillingReport = (month?: string) =>
  api.get("/billing/report", { params: month ? { month } : {}, responseType: "blob" }).then((r) => {
    const url = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
    const disposition = r.headers["content-disposition"] || "";
    const filename = disposition.match(/filename="(.+)"/)?.[1] || `Nexora-Bill-${month || "current"}.pdf`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  });

export default api;
