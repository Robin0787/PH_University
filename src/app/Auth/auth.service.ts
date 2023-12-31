import bcrypt from "bcrypt";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { AppError } from "../errors/AppError";
import { User } from "../modules/user/user.model";
import { sendEmail } from "../utils/sendEmail";
import { TLoginUser, TPasswordChange, TResetPassword } from "./auth.interface";
import { createToken } from "./auth.utils";

const loginUser = async (payload: TLoginUser) => {
  const { id, password } = payload;

  // check the user exist or not
  const user = await User.isUserExistsByCustomId(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This User is not found!");
  }

  // check the user is deleted or not
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "This User is deleted!");
  }

  // check the user is blocked or not
  if (user.status === "blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "This User is blocked!");
  }

  if (!(await User.isPasswordCorrect(password, user.password))) {
    throw new AppError(httpStatus.BAD_REQUEST, "Password is incorrect!");
  }

  // create an token and send to client
  const jwtPayload = {
    id: user.id,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    needsPasswordChange: user.needsPasswordChange,
  };
};

const changePassword = async (user: JwtPayload, payload: TPasswordChange) => {
  // check the user is exist or not
  const userData = await User.isUserExistsByCustomId(user.id);
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User is not found!");
  }

  // check the currentPassword is correct or not
  if (
    !(await User.isPasswordCorrect(payload.currentPassword, userData?.password))
  ) {
    throw new AppError(httpStatus.NOT_FOUND, "Password is incorrect!");
  }

  // hash the newPassword before saving to DB
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt),
  );

  // update the password at last
  const result = await User.findOneAndUpdate(
    { id: user.id },
    {
      password: newHashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
    },
    { new: true, runValidators: true },
  );

  return {};
};

const refreshToken = async (token: string) => {
  // check the token is valid or not
  const decoded = jwt.verify(
    token,
    config.jwt_refresh_secret as string,
  ) as JwtPayload;

  const { id, iat } = decoded;

  // check the user exist or not
  const user = await User.isUserExistsByCustomId(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This User is not found!");
  }

  // check the user is deleted or not
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "This User is deleted!");
  }

  // check the user is blocked or not
  if (user.status === "blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "This User is blocked!");
  }

  // check if the passwordChangeAt is bigger than jwtIssuedAt
  if (
    user.passwordChangedAt &&
    User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your password has changed! Please login again..",
    );
  }

  // create an token and send to client
  const jwtPayload = {
    id: user.id,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return { accessToken };
};

const forgetPassword = async (userId: string) => {
  // check the user exist or not
  const user = await User.isUserExistsByCustomId(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This User is not found!");
  }

  // check the user is deleted or not
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "This User is deleted!");
  }

  // check the user is blocked or not
  if (user.status === "blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "This User is blocked!");
  }

  // create an token and send to client
  const jwtPayload = {
    id: user.id,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    "10m",
  );

  const resetUILink = `${config.reset_password_ui_link}?id=${user.id}&token=${resetToken}`;

  sendEmail(user.email, resetUILink);
  return {};
};

const resetPassword = async (payload: TResetPassword, token: string) => {
  // check the user exist or not
  const user = await User.isUserExistsByCustomId(payload.id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This User is not found!");
  }

  // check the user is deleted or not
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "This User is deleted!");
  }

  // check the user is blocked or not
  if (user.status === "blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "This User is blocked!");
  }

  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string,
  ) as JwtPayload;

  if (payload.id !== decoded.id) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are forbidden!");
  }

  // hash the newPassword before saving to DB
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt),
  );

  const result = await User.findOneAndUpdate(
    {
      id: decoded.id,
      role: decoded.role,
    },
    {
      password: newHashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
    },
    {
      new: true,
    },
  );

  return {};
};

export const AuthServices = {
  loginUser,
  changePassword,
  refreshToken,
  forgetPassword,
  resetPassword,
};
