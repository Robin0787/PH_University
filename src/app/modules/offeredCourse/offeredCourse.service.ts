import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { AppError } from "../../errors/AppError";
import { AcademicDepartment } from "../academicDepartment/academicDepartment.model";
import { AcademicFaculty } from "../academicFaculty/academicFaculty.model";
import { Course } from "../course/course.model";
import { Faculty } from "../faculty/faculty.model";
import { RegistrationStatus } from "../semesterRegistration/semesterRegistration.constant";
import { SemesterRegistration } from "../semesterRegistration/semesterRegistration.model";
import { Student } from "../student/student.model";
import { TSchedule } from "./offeredCourse.constant";
import { TOfferedCourse } from "./offeredCourse.interface";
import { OfferedCourse } from "./offeredCourse.model";
import { hasTimeConflict } from "./offeredCourse.utils";

const createOfferedCourseIntoDB = async (payload: TOfferedCourse) => {
  const {
    semesterRegistration,
    academicFaculty,
    academicDepartment,
    course,
    faculty,
    section,
    days,
    startTime,
    endTime,
  } = payload;

  // check if the semesterRegistration is exist
  const isSemesterRegistrationExists =
    await SemesterRegistration.findById(semesterRegistration);
  if (!isSemesterRegistrationExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This semesterRegistration doesn't exist!",
    );
  }

  const academicSemester = isSemesterRegistrationExists.academicSemester;

  // check if the academicFaculty is exist
  const isAcademicFacultyExists =
    await AcademicFaculty.findById(academicFaculty);
  if (!isAcademicFacultyExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This academicFaculty doesn't exist!",
    );
  }

  // check if the academicDepartment is exist
  const isAcademicDepartmentExists =
    await AcademicDepartment.findById(academicDepartment);
  if (!isAcademicDepartmentExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This academicDepartment doesn't exist!",
    );
  }

  // check if the course is exist
  const isCourseExists = await Course.findById(course);
  if (!isCourseExists) {
    throw new AppError(httpStatus.NOT_FOUND, "This course doesn't exist!");
  }
  // check if the faculty is exist
  const isFacultyExists = await Faculty.findById(faculty);
  if (!isFacultyExists) {
    throw new AppError(httpStatus.BAD_REQUEST, "This faculty doesn't exist!");
  }

  // check the facultyDepartment belongs to the academicFaculty
  const isDepartmentBelongsToFaculty = await AcademicDepartment.findOne({
    _id: academicDepartment,
    academicFaculty,
  });

  if (!isDepartmentBelongsToFaculty) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This facultyDepartment doesn't belongs to this academicFaculty",
    );
  }

  // check if the same offered course same section in same registered semester exists

  const isSameOfferedCourseExistWithSameRegisteredSemesterWithSameSection =
    await OfferedCourse.findOne({ semesterRegistration, course, section });

  if (isSameOfferedCourseExistWithSameRegisteredSemesterWithSameSection) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Offered course with same section is already exist",
    );
  }

  // make sure the same faculty is not taking the class as the same time in two courses
  const assignedSchedules: TSchedule[] = await OfferedCourse.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  }).select("days startTime endTime");

  const newSchedule: TSchedule = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignedSchedules, newSchedule)) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This Faculty is not available for this schedule. Choose other time or day",
    );
  }

  const result = await OfferedCourse.create({ ...payload, academicSemester });
  return result;
};

const getAllOfferedCourseFromDB = async (query: Record<string, unknown>) => {
  const modelQueryForBuilder = OfferedCourse.find()
    .populate("semesterRegistration")
    .populate("academicSemester")
    .populate("academicFaculty")
    .populate("academicDepartment")
    .populate("course")
    .populate("faculty");
  const courseQuery = new QueryBuilder(modelQueryForBuilder, query)
    .filter()
    .sort()
    .paginate()
    .filterFields();
  const result = await courseQuery.modelQuery;
  const countTotal = await courseQuery.countTotal();
  return { meta: countTotal, data: result };
};

const getMyOfferedCoursesFromDB = async (
  studentId: string,
  query: Record<string, unknown>,
) => {
  const student = await Student.findOne({ id: studentId });
  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student doesn't exist");
  }

  // find the current ONGOING semester
  const currentOngoingRegisteredSemester = await SemesterRegistration.findOne({
    status: "ONGOING",
  });

  if (!currentOngoingRegisteredSemester) {
    throw new AppError(httpStatus.NOT_FOUND, "There is no ONGOING semester");
  }

  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const skip = (page - 1) * limit;

  const aggregationQuery = [
    {
      $match: {
        semesterRegistration: currentOngoingRegisteredSemester._id,
        academicDepartment: student.academicDepartment,
        academicFaculty: student.academicFaculty,
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $unwind: "$course",
    },
    {
      $lookup: {
        from: "enrolledcourses",
        let: {
          currentOngoingRegisteredSemester:
            currentOngoingRegisteredSemester._id,
          currentStudent: student._id,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      "$semesterRegistration",
                      "$$currentOngoingRegisteredSemester",
                    ],
                  },
                  {
                    $eq: ["$student", "$$currentStudent"],
                  },
                  {
                    $eq: ["$isEnrolled", true],
                  },
                ],
              },
            },
          },
        ],
        as: "enrolledCourses",
      },
    },
    {
      $lookup: {
        from: "enrolledcourses",
        let: { currentStudent: student._id },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$student", "$$currentStudent"],
                  },
                  {
                    $eq: ["$isCompleted", true],
                  },
                ],
              },
            },
          },
        ],
        as: "completedCourses",
      },
    },
    {
      $addFields: {
        completedCourseIds: {
          $map: {
            input: "$completedCourses",
            as: "completed",
            in: "$$completed.course",
          },
        },
      },
    },
    {
      $addFields: {
        isPreRequisitesFullFilled: {
          $or: [
            {
              $eq: ["$course.preRequisiteCourses", []],
            },
            {
              $setIsSubset: [
                "$course.preRequisiteCourses.course",
                "$completedCourseIds",
              ],
            },
          ],
        },
        isAlreadyEnrolled: {
          $in: [
            "$course._id",
            {
              $map: {
                input: "$enrolledCourses",
                as: "enroll",
                in: "$$enroll.course",
              },
            },
          ],
        },
      },
    },
    {
      $match: {
        isAlreadyEnrolled: { $eq: false },
        isPreRequisitesFullFilled: { $eq: true },
      },
    },
    {
      $project: {
        enrolledCourses: 0,
        completedCourses: 0,
        completedCourseIds: 0,
        isPreRequisitesFullFilled: 0,
        isAlreadyEnrolled: 0,
      },
    },
  ];

  const paginationQuery = [
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  const result = await OfferedCourse.aggregate([
    ...aggregationQuery,
    ...paginationQuery,
  ]);

  const total = await OfferedCourse.aggregate(aggregationQuery);

  const totalData = total?.length || 0;
  const totalPage = Math.ceil(totalData / limit);

  return {
    meta: {
      page,
      limit,
      totalPage,
      totalData,
    },
    data: result,
  };
};

const getSingleOfferedCourseFromDB = async (id: string) => {
  const result = await OfferedCourse.findById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "This offered course doesn't exist!",
    );
  }
  return result;
};

const updateOfferedCourseIntoDB = async (
  id: string,
  payload: Pick<
    TOfferedCourse,
    "faculty" | "days" | "maxCapacity" | "startTime" | "endTime"
  >,
) => {
  const { faculty, days, startTime, endTime } = payload;

  // check the course is exist or not
  const isOfferedCourseExist = await OfferedCourse.findById(id);
  if (!isOfferedCourseExist) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This offered course doesn't exist!",
    );
  }

  // check the faculty is exist
  const isFacultyExist = await Faculty.findById(faculty);
  if (!isFacultyExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "This faculty is not found!");
  }

  // check if the semesterRegistration course status is UPCOMING
  const semesterRegistration = isOfferedCourseExist.semesterRegistration;
  const semesterRegistrationStatus =
    await SemesterRegistration.findById(semesterRegistration);

  if (semesterRegistrationStatus?.status !== RegistrationStatus.UPCOMING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `You can't update this offered course as its status is ${semesterRegistrationStatus?.status}`,
    );
  }

  const assignedSchedules: TSchedule[] = await OfferedCourse.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  });

  const newSchedule: TSchedule = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignedSchedules, newSchedule)) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This Faculty is not available for this schedule. Choose other time or day",
    );
  }

  const result = await OfferedCourse.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

const deleteOfferedCourseFromDB = async (id: string) => {
  const isOfferedCourseExist = await OfferedCourse.findById(id);
  if (!isOfferedCourseExist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "This offered course doesn't exist!",
    );
  }

  const semesterRegistration = isOfferedCourseExist?.semesterRegistration;
  const offeredCourseSemester =
    await SemesterRegistration.findById(semesterRegistration);
  if (offeredCourseSemester?.status !== "UPCOMING") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This offered course can't be deleted as it's registered semester status is ${offeredCourseSemester?.status}`,
    );
  }

  const result = await OfferedCourse.deleteOne({ _id: id });
  return result;
};

export const offeredCourseServices = {
  createOfferedCourseIntoDB,
  getAllOfferedCourseFromDB,
  getMyOfferedCoursesFromDB,
  getSingleOfferedCourseFromDB,
  updateOfferedCourseIntoDB,
  deleteOfferedCourseFromDB,
};
