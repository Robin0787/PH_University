import { Schema, model } from "mongoose";
import { Grade } from "./enrolledCourse.constant";
import {
  TEnrolledCourse,
  TEnrolledCourseMarks,
} from "./enrolledCourse.interface";

const courseMarksSchema = new Schema<TEnrolledCourseMarks>({
  classTest1: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    required: false,
  },
  midTerm: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    required: false,
  },
  classTest2: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    required: false,
  },
  finalTerm: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    required: false,
  },
});

const enrolledCourseSchema = new Schema<TEnrolledCourse>({
  semesterRegistration: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "semesterRegistration",
  },
  academicSemester: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "academicSemester",
  },
  academicFaculty: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "academicFaculty",
  },
  academicDepartment: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "academicDepartment",
  },
  offeredCourse: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "offeredCourse",
  },
  course: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "course",
  },
  student: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "student",
  },
  faculty: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "faculty",
  },
  isEnrolled: {
    type: Boolean,
    required: false,
    default: true,
  },
  courseMarks: {
    type: courseMarksSchema,
    required: false,
    default: {},
  },
  grade: {
    type: String,
    required: false,
    enum: {
      values: Grade,
    },
    default: "N/A",
  },
  gradePoints: {
    type: Number,
    required: false,
    min: 0,
    max: 4,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    required: false,
    default: false,
  },
});

export const EnrolledCourse = model<TEnrolledCourse>(
  "enrolledCourse",
  enrolledCourseSchema,
);
