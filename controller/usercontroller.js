const HttpError = require("../models/errorModel");
const User = require("../models/userModel");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

// ==================== Register user
//post(api./users/register)
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password) {
      return next(new HttpError("fill all the details", 422));
    }

    const newEmail = email.toLowerCase();

    const emailExists = await User.findOne({ email: newEmail });

    if (emailExists) {
      return next(new HttpError("email already exists", 422));
    }

    if (password.trim().length < 6) {
      return next(
        new HttpError("pasword should be atleast six charecters", 422)
      );
    }

    if (password != password2) {
      return next(new HttpError("passwords do not match", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
    });

    res.status(201).json(newUser);
  } catch (error) {
    return next(new HttpError("user registration failed.", 422));
  }
};

// ==================== Login user
//post(api./users/login)
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("fill in all feilds", 422));
    }
    const newEmail = email.toLowerCase();

    const user = await User.findOne({ email: newEmail });

    if (!user) {
      return next(new HttpError("Invalid creandentials", 422));
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return next(new HttpError("invalid password", 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, id, name });
  } catch (error) {
    return next(
      new HttpError("Login failsed. pleace check your credentials", 422)
    );
  }
};

// ==================== User Profile
//post(api./users/:id)
//protected
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return next(new HttpError("user not found", 404));
    }
    res.status(200).json({ user });
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ==================== Change user Avatar (profile picture)
//post:api./users/change-avatar
//protected
const chanageAvatar = async (req, res, next) => {
  try {
    if (!req.files.avatar) {
      return next(new HttpError("please choose an image", 422));
    }
    const user = await User.findById(req.user.id);
    if (user.avatar) {
      fs.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
        if (err) {
          return next(new HttpError(err));
        }
      });
    }
    const { avatar } = req.files;
    if (avatar.size > 500000) {
      return next(
        new HttpError("profile picture too big. should be less then 500kb", 422)
      );
    }

    let fileName;
    fileName = avatar.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    avatar.mv(
      path.join(__dirname, "..", "uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err, "hi"));
        }
        const updatedAvatar = await User.findByIdAndUpdate(
          req.user.id,
          { avatar: newFilename },
          { new: true }
        );
        if (!updatedAvatar) {
          return next(new HttpError("avatar couldn't be changed", 422));
        }
        res.status(200).json({ updatedAvatar });
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ==================== Edit user details (from profile)
//post:api./users/edit-user
//protected
const editUserDetails = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, newConfirmPassword } = req.body;

    if (!name || !email || !currentPassword || !newPassword) {
      return next(new HttpError("fill all feilds", 422));
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new HttpError("user not found", 403));
    }

    const emailExist = await User.findOne({ email });
    if (emailExist && emailExist._id != req.user.id) {
      return next(new HttpError("email already exist", 422));
    }

    const validateUserPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!validateUserPassword) {
      return next(new HttpError("invalid current password", 422));
    }

    if (newPassword != newConfirmPassword) {
      return next(new HttpError("new passwords doesnot match", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const newInfo = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, password: hash },
      { new: true }
    );

    res.status(200).json(newInfo);

  } catch (error) {
    return next(new HttpError(error));
  }
};

// ==================== get Authors
//post:api./users/get-users
//unprotected
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select("-password");
    res.status(200).json(authors);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAuthors,
  chanageAvatar,
  editUserDetails,
  getUser,
};
