export class ApiError extends Error {
  constructor(public status: number, message: string, public code = 'REQUEST_ERROR') {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string) => new ApiError(400, message, 'BAD_REQUEST');
export const unauthorized = (message = 'Authentication required') => new ApiError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'You do not have permission to perform this action') => new ApiError(403, message, 'FORBIDDEN');
export const notFound = (message = 'Resource not found') => new ApiError(404, message, 'NOT_FOUND');
export const conflict = (message: string) => new ApiError(409, message, 'CONFLICT');
