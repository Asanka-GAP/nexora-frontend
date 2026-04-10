import axios from "axios";
import type {
  ApiResponse, Student, StudentCreateRequest, ClassItem,
  ClassCreateRequest, MarkAttendanceRequest, MarkAttendanceResponse, Schedule,
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Students
export const getStudents = () =>
  api.get<ApiResponse<Student[]>>("/students").then((r) => r.data.data);

export const createStudent = (data: StudentCreateRequest) =>
  api.post<ApiResponse<Student>>("/students", data).then((r) => r.data.data);

// Classes
export const getClasses = () =>
  api.get<ApiResponse<ClassItem[]>>("/classes").then((r) => r.data.data);

export const createClass = (data: ClassCreateRequest) =>
  api.post<ApiResponse<ClassItem>>("/classes", data).then((r) => r.data.data);

export const cancelClass = (id: string, reason?: string) =>
  api.post(`/classes/${id}/cancel`, reason ? { reason } : {});

// Attendance
export const markAttendance = (data: MarkAttendanceRequest) =>
  api.post<ApiResponse<MarkAttendanceResponse>>("/attendance/mark", data).then((r) => r.data.data);

// Schedules (placeholder — extend when backend adds endpoints)
export const getSchedules = () =>
  api.get<ApiResponse<Schedule[]>>("/schedules").then((r) => r.data.data).catch(() => [] as Schedule[]);

export default api;
