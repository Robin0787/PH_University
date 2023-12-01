import { Router } from "express";
import { AcademicSemesterRoutes } from "../modules/academicSemester/academicSemester.route";
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.routes));

export default router;
