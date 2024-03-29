import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AcademicSemesterServices } from "./academicSemester.service";

const createAcademicSemester = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AcademicSemesterServices.createAcademicSemesterToDB(
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Academic semester created successfully",
      data: result,
    });
  },
);

const getAllSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await AcademicSemesterServices.getAllSemesterFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Semesters are retrieved successfully.",
    meta: result?.meta,
    data: result?.data,
  });
});

const getSingleSemester = catchAsync(async (req: Request, res: Response) => {
  const { semesterId } = req.params;
  const result =
    await AcademicSemesterServices.getSingleSemesterFromDB(semesterId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Semester is retrieved successfully.",
    data: result,
  });
});

const updateSingleSemester = catchAsync(async (req: Request, res: Response) => {
  const { semesterId } = req.params;
  const semesterData = req.body;
  const result = await AcademicSemesterServices.updateSingleSemesterInDB(
    semesterId,
    semesterData,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Semester is updated successfully.",
    data: result,
  });
});

export const AcademicSemesterControllers = {
  createAcademicSemester,
  getAllSemester,
  getSingleSemester,
  updateSingleSemester,
};
