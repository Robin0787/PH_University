import { Schema, model } from "mongoose";

import validator from "validator";

import config from "../../config";
import {
  StudentModel,
  TGuardian,
  TLocalGuardian,
  TStudent,
  TStudentName,
} from "./student.interface";

const studentNameSchema = new Schema<TStudentName>({
  firstName: {
    type: String,
    required: [true, "firstName is required"],
    trim: true,
    maxLength: [20, "firstName can't be more than 20 characters"],
    validate: {
      validator: function (value: string) {
        const formateValue = value.split(" ").join("");
        const capitalizedValue =
          formateValue.charAt(0).toUpperCase() +
          formateValue.slice(1).toLowerCase();
        return capitalizedValue === value;
      },
      message: "{VALUE} is not in capitalize format like 'Robin'",
    },
  },
  middleName: { type: String, trim: true },
  lastName: {
    type: String,
    required: [true, "lastName is required"],
    trim: true,
    validate: {
      validator: (value: string) => validator.isAlpha(value),
      message: "{VALUE} is not valid.",
    },
  },
});

const guardianSchema = new Schema<TGuardian>({
  fatherName: { type: String, required: true },
  fatherOccupation: { type: String, required: true },
  fatherContactNo: { type: String, required: true },
});

const localGuardianSchema = new Schema<TLocalGuardian>({
  name: { type: String, required: true },
  occupation: { type: String, required: true },
  contactNo: { type: String, required: true },
  address: { type: String, required: true },
});

const studentSchema = new Schema<TStudent, StudentModel>(
  {
    id: { type: String, required: true },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    name: {
      type: studentNameSchema,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "{VALUE} is not a valid email.",
      },
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female"],
        message: "{VALUE} is not a valid value for gender",
      },
      required: [true, "gender is required"],
    },
    dateOfBirth: { type: Date },
    contactNo: { type: String, required: true },
    emergencyContactNo: { type: String, required: true },
    admissionSemester: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "academicSemester",
    },
    academicDepartment: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "academicDepartment",
    },
    academicFaculty: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "academicFaculty",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    presentAddress: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    guardian: {
      type: guardianSchema,
      required: true,
    },
    localGuardian: {
      type: localGuardianSchema,
      required: true,
    },
    profileImage: {
      type: String,
      default: config.default_user_image as string,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
  },
);

// virtual
studentSchema.virtual("fullName").get(function () {
  return `${this?.name?.firstName} ${this?.name?.lastName}`;
});

// Query Middleware
studentSchema.pre("find", function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

studentSchema.pre("findOne", function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

studentSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

studentSchema.statics.isStudentExists = async function (_id: string) {
  const existingUser = await Student.findById(_id);
  return existingUser;
};

export const Student = model<TStudent, StudentModel>("student", studentSchema);
