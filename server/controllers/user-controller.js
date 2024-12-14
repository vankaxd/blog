require("dotenv").config();
const { validationResult } = require("express-validator");

const {
  serviceRegistration,
  serviceActivate,
  serviceLogin,
  serviceLogout,
  getAllUsers,
} = require("../service/user-service");

const registration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Ошибка валидации данных" });
    }
    const { email, password } = req.body;
    const userData = await serviceRegistration(email, password);
    res.cookie("refreshToken", userData.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.json(userData);
  } catch (error) {
    console.error("Ошибка регистрации", error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await serviceLogin(email, password);
    res.cookie("refreshToken", userData.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.json(userData);
  } catch (error) {
    console.error("Ошибка входа", error);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    await serviceLogout(refreshToken);
    res.clearCookie("refreshToken");
    return res.json({ message: "Выход успешен" });
  } catch (error) {
    console.error("Ошибка выхода", error);
  }
};

const activate = async (req, res) => {
  try {
    const activationLink = req.params.link;
    await serviceActivate(activationLink);
    return res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.error("Ошибка активации", error);
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookie;
    const userData = await serviceRefresh(refreshToken);
    res.cookie("refreshToken", userData.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.json(userData);
  } catch (error) {
    console.error("Ошибка получения токенов", error);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (error) {
    console.error("Ошибка получения списка пользователей", error);
  }
};

module.exports = {
  registration,
  getUsers,
  activate,
  login,
  logout,
  refresh,
};
