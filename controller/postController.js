const Post = require("../models/postModel");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const HttpError = require("../models/errorModel");



//=========================== Create post
//post(api/posts/)
//protected
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(
        new HttpError("fill in all required fields and choose thumbnail ", 422)
      );
    }
    const { thumbnail } = req.files;

    if (thumbnail.size > 2000000) {
      return next(new HttpError("Thumbnail size should be less than 2mb"));
    }

    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "/uploads", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFilename,
            creator: req.user.id,
          });
          if (!newPost) {
            return next(new HttpError("post couldn't be created", 422));
          }

          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.posts + 1;
          await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

//=========================== Get All posts
//get(api/posts/)
//protected
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });

    if (!posts) {
      return next(new HttpError("something went wrong"), 422);
    }
    if (posts.length < 1) {
      return next(new HttpError("no posts are there"));
    }

    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//======================= Get single post
//get(api/posts/:id)
//protected
const ViewPost = async (req, res, next) => {
  try {
    const {id} = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return next(new HttpError("psot not found", 402));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//======================= Get post by category
//get(api/posts/categories/:category)
//Unprotected
const getPostByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const posts = await Post.find({ category }).sort({ updatedAt: -1 });
    
    if (!posts) {
      return res.next(new HttpError("posts not found", 402));
    }
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//======================= Get User posts
//get(api/posts/users/:id)
//unprotected
const getUserPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    if (!posts) {
      return next(new HttpError("posts not foud ", 404));
    }
    if (posts.length < 1) {
      return next(
        new HttpError("you haevn't posted anything lets create new post")
      );
    }
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//======================= Edit post
//PATCH(api/posts/:id)
//protected
const editPost = async (req, res, next) => {
  try {
    let fileName;
    let newFilename;
    let updatedPost;
    const id = req.params.id;
    let { title, category, description } = req.body;

    if (!title || !category || description.length < 12) {
      return next(new HttpError("fill in all the feilds"));
    }

    const oldPost = await Post.findById(id);

    if(req.user.id == oldPost.creator){
        if (!req.files) {
          updatedPost = await Post.findByIdAndUpdate(
            id,
            { title, category, description },
            { new: true }
          );
        } else {
          fs.unlink(
            path.join(__dirname, "..", "uploads", oldPost.thumbnail),
            async (err) => {
              if (err) {
                return next(new HttpError(err));
              }
              console.log("removed");
            }
          );

          const { thumbnail } = req.files;

          if (thumbnail.size > 2000000) {
            return next(
              new HttpError("thumbnail is too big it should be less than 2mb")
            );
          }

          fileName = thumbnail.name;
          let splittedFilename = fileName.split(".");
          newFilename =
            splittedFilename[0] +
            uuid() +
            "." +
            splittedFilename[splittedFilename.length - 1];
          thumbnail.mv(
            path.join(__dirname, "..", "uploads", newFilename),
            async (err) => {
              if (err) {
                return next(new HttpError(err));
              }
            }
          );

          updatedPost = await Post.findByIdAndUpdate(
            id,
            { title, category, description, thumbnail: newFilename },
            { new: true }
          );
        }
    }

    if(!updatedPost){
        return next( new HttpError("couldn't update the post",400));
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//======================= Delete post
//Delete(api/posts/:id)
//protected
const deletePost = async (req, res, next) => {
  try {
    const {id}= req.params;
    if(!id){
        return next(new HttpError("post unavailable",404) );
    }
    const post = await Post.findById(id);
    if(!post){
        return next(new HttpError("post not found",422));
    }
    const fileName = post?.thumbnail;
    if(req.user.id == post.creator){
         fs.unlink(
           path.join(__dirname, "..", "uploads", fileName),
           async (err) => {
             if (err) {
               return next(new HttpError(err));
             } else {
               await Post.findByIdAndDelete(id);
               const currentUser = await User.findById(req.user.id);
               const userPostCount = currentUser?.posts - 1;
               await User.findByIdAndUpdate(req.user.id, {
                 posts: userPostCount,
               });
                res.json(`post ${id} deleted`);
             }
           }
         );
    }else{
        return next(new HttpError("post cant'be deleted"));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPosts,
  ViewPost,
  getUserPost,
  editPost,
  getPostByCategory,
  deletePost,
};
