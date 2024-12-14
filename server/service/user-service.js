const UserModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const sendActivationMail = require("./mail-service");
const {
  generateTokens,
  saveToken,
  removeToken,
  validateAccessToken,
  validateRefreshToken,
  findToken,
} = require("./token-service");
const UserDto = require("../dtos/user-dto");

const serviceRegistration = async (email, password) => {
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new Error("Email уже зарегистрирован.");
  }
  const hashPassword = await bcrypt.hash(password, 3);
  const activationLink = uuid.v4();
  const user = await UserModel.create({
    email,
    password: hashPassword,
    activationLink,
  });

  await sendActivationMail(
    email,
    `${process.env.API_URL}/api/activate/${activationLink}`
  );
  const userDto = new UserDto(user);

  const tokens = generateTokens({ ...userDto });
  await saveToken(userDto.id, tokens.refreshToken);
  return {
    ...tokens,
    user: userDto,
  };
};

const serviceActivate = async (activationLink) => {
  const user = await UserModel.findOne({ activationLink });
  if (!user) {
    throw new Error("Ссылка активации недействительна.");
  }
  user.isActivated = true;
  await user.save();
};

const serviceLogin = async (email, password) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error("Пользователь не найден");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Неверный пароль");
  }
  const userDto = new UserDto(user);
  const tokens = generateTokens({ ...userDto });

  await saveToken(userDto.id, tokens.refreshToken);
  return {
    ...tokens,
    user: userDto,
  };
};

const serviceLogout = async (refreshToken) => {
  const token = await removeToken(refreshToken);
  return token;
};

const serviceRefresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Токен не передан");
  }
  const userData = validateRefreshToken(refreshToken);
  const tokenFromDb = await findToken(refreshToken);

  if (!userData || !tokenFromDb) {
    throw new Error("Токен недействителен");
  }
  const user = await UserModel.findById(userData.id);
  const userDto = new UserDto(user);
  const tokens = generateTokens({ ...userDto });

  await saveToken(userDto.id, tokens.refreshToken);
  return {
    ...tokens,
    user: userDto,
  };
};

const getAllUsers = async () => {
  const users = await UserModel.find();
  return users;
};

module.exports = {
  serviceRegistration,
  serviceActivate,
  serviceLogin,
  serviceLogout,
  serviceRefresh,
  getAllUsers,
};
