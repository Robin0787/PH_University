import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../user/user.constant";
import { academicDepartmentControllers } from "./academicDepartment.controller";
import { academicDepartmentValidations } from "./academicDepartment.validation";

const router = Router();

router.post(
  "/create-academic-department",
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  validateRequest(
    academicDepartmentValidations.academicDepartmentCreateValidationSchema,
  ),
  academicDepartmentControllers.createAcademicDepartment,
);

router.get("/", auth(), academicDepartmentControllers.getAllAcademicDepartment);
router.get(
  "/:departmentId",
  auth(),
  academicDepartmentControllers.getSingleAcademicDepartment,
);
router.patch(
  "/update-academic-department/:departmentId",
  auth(USER_ROLE.superAdmin, USER_ROLE.admin),
  validateRequest(
    academicDepartmentValidations.academicDepartmentUpdateValidationSchema,
  ),
  academicDepartmentControllers.updateAcademicDepartment,
);

export const academicDepartmentRoutes = router;
