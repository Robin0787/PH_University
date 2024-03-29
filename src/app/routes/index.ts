import { Router } from "express";
import { AuthRoutes } from "../Auth/auth.route";
import { academicDepartmentRoutes } from "../modules/academicDepartment/academicDepartment.route";
import { academicFacultyRoutes } from "../modules/academicFaculty/academicFaculty.route";
import { AcademicSemesterRoutes } from "../modules/academicSemester/academicSemester.route";
import { adminRoutes } from "../modules/admin/admin.route";
import { courseRoutes } from "../modules/course/course.route";
import { EnrolledCourseRoutes } from "../modules/enrolledCourse/enrolledCourse.route";
import { facultyRoutes } from "../modules/faculty/faculty.route";
import { offeredCourseRoutes } from "../modules/offeredCourse/offeredCourse.route";
import { semesterRegistrationRoutes } from "../modules/semesterRegistration/semesterRegistration.route";
import { studentRoutes } from "../modules/student/student.route";
import { userRoutes } from "../modules/user/user.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    routes: userRoutes,
  },
  {
    path: "/students",
    routes: studentRoutes,
  },
  {
    path: "/academic-semesters",
    routes: AcademicSemesterRoutes,
  },
  {
    path: "/academic-faculties",
    routes: academicFacultyRoutes,
  },
  {
    path: "/academic-departments",
    routes: academicDepartmentRoutes,
  },
  {
    path: "/faculties",
    routes: facultyRoutes,
  },
  {
    path: "/admins",
    routes: adminRoutes,
  },
  {
    path: "/courses",
    routes: courseRoutes,
  },
  {
    path: "/semester-registrations",
    routes: semesterRegistrationRoutes,
  },
  {
    path: "/offered-courses",
    routes: offeredCourseRoutes,
  },
  {
    path: "/auth",
    routes: AuthRoutes,
  },
  {
    path: "/enrolled-courses",
    routes: EnrolledCourseRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.routes));

export default router;
