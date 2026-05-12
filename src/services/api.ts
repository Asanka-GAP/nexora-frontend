import axios from "axios";
import type {
  ApiResponse, Student, StudentCreateRequest, ClassItem,
  ClassCreateRequest, MarkAttendanceRequest, MarkAttendanceResponse, Schedule,
  AttendanceRecord, LoginResponse, AdminDashboard, TeacherItem, TeacherProfile,
  CurrentMonthUsage, BillingHistory, AdminBillingSummary,
  InstituteLoginResponse, InstituteTeacherLoginResponse, InstituteResponse,
  ClassroomResponse, InstituteTeacherResponse, InstituteStudentResponse,
  InstituteClassResponse, InstituteAttendanceRecord, InstituteSessionResponse,
  ClassFeeResponse, FeePaymentResponse, InstituteDashboard, InstituteTeacherDashboard,
  InstituteMarkAttendanceResponse,
  InstituteDashboardCharts,
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

export const updateStudentContact = (studentId: string, contactId: string, data: { contactName: string; phone: string; relationship: string; isPrimary: boolean }) =>
  api.put<ApiResponse<Student>>(`/students/${studentId}/contacts/${contactId}`, data).then((r) => r.data.data);

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

export const toggleClassStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/classes/${id}/status`);

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

export const getAdminBilling = (month?: string) =>
  api.get<ApiResponse<AdminBillingSummary>>("/admin/billing", { params: month ? { month } : {} }).then((r) => r.data.data);

export const getTeachers = (status?: string) =>
  api.get<ApiResponse<TeacherItem[]>>("/admin/teachers", { params: status ? { status } : {} }).then((r) => r.data.data);

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
  api.get<ApiResponse<{ nextUpgradeDate: string; lastUpgradedAt: string | null; maxGrade: number }>>("/settings/academic-year").then((r) => r.data.data);

export const updateAcademicYearConfig = (data: { nextUpgradeDate: string; maxGrade?: number }) =>
  api.put<ApiResponse<{ nextUpgradeDate: string; lastUpgradedAt: string | null; maxGrade: number }>>("/settings/academic-year", data).then((r) => r.data.data);

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

// ── Institute Auth ────────────────────────────────────────────────────────────
export const instituteLoginApi = (username: string, password: string) =>
  api.post<ApiResponse<InstituteLoginResponse | InstituteTeacherLoginResponse>>("/auth/institute/login", { username, password });

export const instituteResetPasswordApi = (username: string, otp: string, newPassword: string) =>
  api.post<ApiResponse<void>>("/auth/institute/reset-password", { username, otp, newPassword });

// ── Super Admin: Institute Management ────────────────────────────────────────
export const getInstitutes = () =>
  api.get<ApiResponse<InstituteResponse[]>>("/admin/institutes").then(r => r.data.data);

export const createInstitute = (data: { name: string; address?: string; phone?: string; email: string; password: string }) =>
  api.post<ApiResponse<InstituteResponse>>("/admin/institutes", data).then(r => r.data.data);

export const toggleInstituteStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/admin/institutes/${id}/status`);

export const deleteInstitute = (id: string) =>
  api.delete<ApiResponse<void>>(`/admin/institutes/${id}`);

// ── Institute Admin: Dashboard ────────────────────────────────────────────────
export const getInstituteDashboard = () =>
  api.get<ApiResponse<InstituteDashboard>>("/institute/admin/dashboard").then(r => r.data.data);

export const getInstituteDashboardCharts = (params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<InstituteDashboardCharts>>("/institute/admin/dashboard/charts", { params: clean }).then(r => r.data.data);
};

// ── Institute Admin: Teachers ─────────────────────────────────────────────────
export const getInstituteTeachers = () =>
  api.get<ApiResponse<InstituteTeacherResponse[]>>("/institute/admin/teachers").then(r => r.data.data);

export const createInstituteTeacher = (data: { name: string; email: string; phone: string; subject: string }) =>
  api.post<ApiResponse<InstituteTeacherResponse>>("/institute/admin/teachers", data).then(r => r.data.data);

export const toggleInstituteTeacherStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/institute/admin/teachers/${id}/status`);

export const deleteInstituteTeacher = (id: string) =>
  api.delete<ApiResponse<void>>(`/institute/admin/teachers/${id}`);

// ── Institute Admin: Students ─────────────────────────────────────────────────
export const getInstituteStudents = () =>
  api.get<ApiResponse<InstituteStudentResponse[]>>("/institute/admin/students").then(r => r.data.data);

export const createInstituteStudent = (data: {
  fullName: string; currentGrade: number; address?: string;
  contacts: { contactName: string; phone: string; relationship: string; isPrimary: boolean }[];
  classIds?: string[];
}) => api.post<ApiResponse<InstituteStudentResponse>>("/institute/admin/students", data).then(r => r.data.data);

export const updateInstituteStudent = (id: string, data: {
  fullName: string; currentGrade: number; address?: string;
  contacts: { contactName: string; phone: string; relationship: string; isPrimary: boolean }[];
  classIds?: string[];
}) => api.put<ApiResponse<InstituteStudentResponse>>(`/institute/admin/students/${id}`, data).then(r => r.data.data);

export const toggleInstituteStudentStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/institute/admin/students/${id}/status`);

export const deleteInstituteStudent = (id: string) =>
  api.delete<ApiResponse<void>>(`/institute/admin/students/${id}`);

export const addInstituteStudentContact = (studentId: string, data: { contactName: string; phone: string; relationship: string; isPrimary: boolean }) =>
  api.post<ApiResponse<InstituteStudentResponse>>(`/institute/admin/students/${studentId}/contacts`, data).then(r => r.data.data);

export const updateInstituteStudentContact = (studentId: string, contactId: string, data: { contactName: string; phone: string; relationship: string; isPrimary: boolean }) =>
  api.put<ApiResponse<InstituteStudentResponse>>(`/institute/admin/students/${studentId}/contacts/${contactId}`, data).then(r => r.data.data);

export const deleteInstituteStudentContact = (studentId: string, contactId: string) =>
  api.delete<ApiResponse<void>>(`/institute/admin/students/${studentId}/contacts/${contactId}`);

export const getInstituteStudentAttendance = (studentId: string, params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<InstituteAttendanceRecord[]>>(`/institute/admin/students/${studentId}/attendance`, { params: clean }).then(r => r.data.data);
};

export const bulkImportInstituteStudents = (data: { students: { fullName: string; currentGrade: number; address?: string; parentName?: string; parentPhone?: string; parentRelationship?: string; classIds?: string[] }[] }) =>
  api.post<ApiResponse<{ total: number; success: number; failed: number; errors: string[] }>>("/institute/admin/students/bulk-import", data).then(r => r.data.data);

export const bulkAssignInstituteClasses = (data: { studentIds: string[]; classIds: string[] }) =>
  api.post<ApiResponse<{ studentsProcessed: number; enrollmentsCreated: number; skippedDuplicates: number }>>("/institute/admin/students/bulk-assign-classes", data).then(r => r.data.data);

// ── Institute Admin: Classes ──────────────────────────────────────────────────
export const getInstituteClasses = () =>
  api.get<ApiResponse<InstituteClassResponse[]>>("/institute/admin/classes").then(r => r.data.data);

export const createInstituteClass = (data: {
  name: string; grade: number; subject?: string;
  instituteTeacherId?: string; classroomId?: string;
  schedules?: { scheduleType: string; dayOfWeek?: number; sessionDate?: string; startTime: string; endTime: string }[];
}) => api.post<ApiResponse<InstituteClassResponse>>("/institute/admin/classes", data).then(r => r.data.data);

export const updateInstituteClass = (id: string, data: {
  name: string; grade: number; subject?: string;
  instituteTeacherId?: string; classroomId?: string;
  schedules?: { scheduleType: string; dayOfWeek?: number; sessionDate?: string; startTime: string; endTime: string }[];
}) => api.put<ApiResponse<InstituteClassResponse>>(`/institute/admin/classes/${id}`, data).then(r => r.data.data);

export const toggleInstituteClassStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/institute/admin/classes/${id}/status`);

export const deleteInstituteClass = (id: string) =>
  api.delete<ApiResponse<void>>(`/institute/admin/classes/${id}`);

export const addInstituteClassSchedule = (classId: string, data: { scheduleType: string; dayOfWeek?: number; sessionDate?: string; startTime: string; endTime: string }) =>
  api.post<ApiResponse<InstituteClassResponse>>(`/institute/admin/classes/${classId}/schedules`, data).then(r => r.data.data);

export const deleteInstituteClassSchedule = (classId: string, scheduleId: string) =>
  api.delete<ApiResponse<void>>(`/institute/admin/classes/${classId}/schedules/${scheduleId}`);

// ── Institute Admin: Classrooms ───────────────────────────────────────────────
export const getClassrooms = () =>
  api.get<ApiResponse<ClassroomResponse[]>>("/institute/admin/classrooms").then(r => r.data.data);

export const getAvailableClassrooms = (params: { scheduleType: string; dayOfWeek?: number; sessionDate?: string; startTime: string; endTime: string }) => {
  const clean: Record<string, string | number> = { scheduleType: params.scheduleType, startTime: params.startTime, endTime: params.endTime };
  if (params.dayOfWeek !== undefined) clean.dayOfWeek = params.dayOfWeek;
  if (params.sessionDate) clean.sessionDate = params.sessionDate;
  return api.get<ApiResponse<ClassroomResponse[]>>("/institute/admin/classrooms/available", { params: clean }).then(r => r.data.data);
};

export const createClassroom = (data: { name: string; capacity?: number; location?: string }) =>
  api.post<ApiResponse<ClassroomResponse>>("/institute/admin/classrooms", data).then(r => r.data.data);

export const updateClassroom = (id: string, data: { name: string; capacity?: number; location?: string }) =>
  api.put<ApiResponse<ClassroomResponse>>(`/institute/admin/classrooms/${id}`, data).then(r => r.data.data);

export const toggleClassroomStatus = (id: string) =>
  api.patch<ApiResponse<void>>(`/institute/admin/classrooms/${id}/status`);

export const deleteClassroom = (id: string) =>
  api.delete<ApiResponse<void>>(`/institute/admin/classrooms/${id}`);

// ── Institute Admin: Attendance ───────────────────────────────────────────────
export const getInstituteAttendance = (params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<InstituteAttendanceRecord[]>>("/institute/admin/attendance", { params: clean }).then(r => r.data.data);
};

// ── Institute Admin: Sessions ─────────────────────────────────────────────────
export const getInstituteSessions = (params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<InstituteSessionResponse[]>>("/institute/admin/sessions", { params: clean }).then(r => r.data.data);
};

export const cancelInstituteSession = (id: string, reason?: string) =>
  api.post(`/institute/admin/sessions/${id}/cancel`, reason ? { reason } : {});

// ── Institute Admin: Fees ─────────────────────────────────────────────────────
export const getClassFees = (classId: string) =>
  api.get<ApiResponse<ClassFeeResponse[]>>(`/institute/admin/classes/${classId}/fees`).then(r => r.data.data);

export const setClassFee = (classId: string, data: { amount: number; feeLabel?: string }) =>
  api.post<ApiResponse<ClassFeeResponse>>(`/institute/admin/classes/${classId}/fees`, data).then(r => r.data.data);

export const getFeePayments = (yearMonth: string) =>
  api.get<ApiResponse<FeePaymentResponse[]>>("/institute/admin/fees", { params: { yearMonth } }).then(r => r.data.data);

export const updateFeePaymentStatus = (paymentId: string, data: { status: string; note?: string }) =>
  api.patch<ApiResponse<FeePaymentResponse>>(`/institute/admin/fees/${paymentId}/status`, data).then(r => r.data.data);

// ── Institute Teacher ─────────────────────────────────────────────────────────
export const getInstituteTeacherDashboard = () =>
  api.get<ApiResponse<InstituteTeacherDashboard>>("/institute/teacher/dashboard").then(r => r.data.data);

export const getInstituteTeacherClasses = () =>
  api.get<ApiResponse<InstituteClassResponse[]>>("/institute/teacher/classes").then(r => r.data.data);

export const getInstituteTeacherAttendance = (params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<InstituteAttendanceRecord[]>>("/institute/teacher/attendance", { params: clean }).then(r => r.data.data);
};

export const markInstituteAttendance = (data: { studentCode: string; classId: string }) =>
  api.post<ApiResponse<InstituteMarkAttendanceResponse>>("/institute/teacher/attendance/mark", data).then(r => r.data.data);

export const getInstituteTeacherSessions = (params?: { from?: string; to?: string }) => {
  const clean: Record<string, string> = {};
  if (params?.from) clean.from = params.from;
  if (params?.to) clean.to = params.to;
  return api.get<ApiResponse<InstituteSessionResponse[]>>("/institute/teacher/sessions", { params: clean }).then(r => r.data.data);
};

export const cancelInstituteTeacherSession = (id: string, reason?: string) =>
  api.post(`/institute/teacher/sessions/${id}/cancel`, reason ? { reason } : {});

export default api;
