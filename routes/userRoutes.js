const { Router } = require("express");

const {
  registerUser,
  loginUser,
  getAuthors,
  chanageAvatar,
  editUserDetails,
  getUser,
} = require("../controller/usercontroller");

const authMiddelware = require('../middleware/auth')

const router = Router();

router.post("/register" ,registerUser)
router.post("/login" ,loginUser)
router.get("/:id",getUser)
router.get("/",getAuthors)
router.post('/change-avatar',authMiddelware,chanageAvatar)
router.patch('/edit-user',authMiddelware,editUserDetails)

module.exports = router;
