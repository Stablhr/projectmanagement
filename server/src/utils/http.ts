export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

export function notFoundError(message = 'Resource not found') {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function forbiddenError(message = 'Forbidden') {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function unauthorizedError(message = 'Unauthorized') {
  return new ApiError(401, 'UNAUTHORIZED', message);
}

export function validationError(message = 'Invalid input') {
  return new ApiError(400, 'VALIDATION', message);
}

export function parseTitle(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw validationError('Title is required');
  }
  const title = value.trim();
  if (title.length > 200) {
    throw validationError('Title must be 200 characters or fewer');
  }
  return title;
}
