// unsupported 404 routes

const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.oriinalUrl}`);
  res.status(404);
  next(error);
};

// middleware to handel errors
const errorHandler = (error, req, res, next) => {
  if (res.headersent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ messsage: error.message || "an unkonwn error occured" });
};

module.exports = {notFound,errorHandler}
