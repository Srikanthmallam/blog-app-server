const { Router } = require("express");

const {
  getPostByCategory,
  getUserPost,
  getPosts,
  ViewPost,
  editPost,
  deletePost,
  createPost,
} = require ("../controller/postController");

const authMiddleware = require("../middleware/auth")

const router = Router();

router.post("/",authMiddleware,createPost);
router.get("/",getPosts);
router.get("/:id",ViewPost);
router.patch("/:id",authMiddleware,editPost);
router.get("/categories/:category",getPostByCategory);
router.get("/users/:id",getUserPost);
router.delete("/:id",authMiddleware,deletePost);

module.exports = router;
