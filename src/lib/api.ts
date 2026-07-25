import { AppError } from './errors';

export { apiHandler, success, error, type ApiResponse } from './apiHandler';
export { AppError, BadRequest, Unauthorized, Forbidden, NotFound, Conflict } from './errors';

/**
 * @deprecated Use AppError or domain-specific errors (BadRequest, Unauthorized, etc.)
 */
export class ApiError extends AppError {
  constructor(status: number, message: string) {
    super(status, 'API_ERROR', message);
  }
}
