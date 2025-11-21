export class PlacetoPayError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "PlacetoPayError";
    this.code = code;
  }
}

export class PlacetoPayHttpError extends PlacetoPayError {
  readonly httpStatus: number;
  readonly responseBody: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message, "HTTP_ERROR");
    this.name = "PlacetoPayHttpError";
    this.httpStatus = status;
    this.responseBody = body;
  }
}

export class PlacetoPayStatusError extends PlacetoPayError {
  readonly status: import("../domain/status").Status;
  readonly responseBody: unknown;

  constructor(
    message: string,
    status: import("../domain/status").Status,
    body: unknown
  ) {
    super(message, "STATUS_ERROR");
    this.name = "PlacetoPayStatusError";
    this.status = status;
    this.responseBody = body;
  }
}

export class PlacetoPayValidationError extends PlacetoPayError {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR");
    this.name = "PlacetoPayValidationError";
    this.details = details;
  }
}
