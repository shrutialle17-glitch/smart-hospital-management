export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle Prisma Known Request Errors (e.g., Unique constraint failed)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT_ERROR',
        message: 'A record with this value already exists',
        target: err.meta?.target
      }
    });
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors
      }
    });
  }

  // Generic Error Envelope
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.errorCode || 'INTERNAL_ERROR',
      message: message,
    }
  });
};
