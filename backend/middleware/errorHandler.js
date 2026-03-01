export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${status} ${message}`);
  }

  if (err.code === '23505') return res.status(409).json({ message: 'Duplicate entry — this record already exists' });
  if (err.code === '23503') return res.status(400).json({ message: 'Referenced record does not exist' });

  res.status(status).json({ message });
};
