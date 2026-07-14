export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot find ${req.method} ${req.originalUrl}`
    }
  });
};
