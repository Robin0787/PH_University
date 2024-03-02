import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { EnrolledCourseServices } from "./enrolledCourse.service";

const createEnrolledCourse = catchAsync(async (req, res) => {
  const userId: string = req.user.id;
  const offeredCourseId = req.body.offeredCourse;
  const result = await EnrolledCourseServices.createEnrolledCourseIntoDB(
    offeredCourseId,
    userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Enrolled successfully",
    data: result,
  });
});

const updateEnrolledCourseMarks = catchAsync(async (req, res) => {
  const userId: string = req.user.id;
  const result = await EnrolledCourseServices.updateEnrolledCourseMarksIntoDB(
    userId,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Course marks updated successfully",
    data: result,
  });
});

export const EnrolledCourseControllers = {
  createEnrolledCourse,
  updateEnrolledCourseMarks,
};
