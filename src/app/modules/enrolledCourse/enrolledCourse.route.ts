import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../user/user.constant";
import { EnrolledCourseControllers } from "./enrolledCourse.controller";
import { enrolledCourseValidationSchemas } from "./enrolledCourse.validation";

const router = Router();

router.post(
  "/create-enrolled-course",
  auth(USER_ROLE.student),
  validateRequest(
    enrolledCourseValidationSchemas.enrolledCourseCreateValidationSchema,
  ),
  EnrolledCourseControllers.createEnrolledCourse,
);
// for faculty
router.get(
  "/",
  auth(USER_ROLE.faculty),
  EnrolledCourseControllers.getAllEnrolledCourses,
);
// for faculty
router.get(
  "/my-students",
  auth(USER_ROLE.faculty),
  EnrolledCourseControllers.getMyEnrolledStudents,
);

router.get(
  "/my-enrolled-courses",
  auth(USER_ROLE.student),
  EnrolledCourseControllers.getMyEnrolledCourses,
);

router.post(
  "/updated-enrolled-course-marks",
  auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.faculty),
  validateRequest(
    enrolledCourseValidationSchemas.updateEnrolledCourseMarksValidationSchema,
  ),
  EnrolledCourseControllers.updateEnrolledCourseMarks,
);

export const EnrolledCourseRoutes = router;
