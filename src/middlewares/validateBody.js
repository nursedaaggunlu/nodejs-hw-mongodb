import createError from 'http-errors';

export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (err) {
      const errorDetails = err.details
        ? err.details.map((d) => d.message).join(', ')
        : err.message;
      next(createError(400, `Validation Error: ${errorDetails}`));
    }
  };
};
