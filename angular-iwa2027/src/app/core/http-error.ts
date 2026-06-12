import { HttpErrorResponse } from '@angular/common/http';

function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function extractStringBodyMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  const text = trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const springError = text.match(/type=([^,.)]+),\s*status=(\d+)/i);
  if (springError) {
    return `${springError[2]} ${springError[1].trim()}`;
  }

  return text ? text.slice(0, 240) : null;
}

export function extractHttpErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Backend is unavailable. Make sure http://localhost:8080 is running.';
    }

    const body = error.error;
    if (typeof body === 'string' && body.trim()) {
      return extractStringBodyMessage(body) || fallback;
    }

    if (body && typeof body === 'object') {
      const payload = body as Record<string, unknown>;
      const directMessage = payload['message'];
      if (typeof directMessage === 'string' && directMessage.trim()) {
        return directMessage.trim();
      }

      const errorMessage = payload['error'];
      if (typeof errorMessage === 'string' && errorMessage.trim()) {
        return errorMessage.trim();
      }

      const details = payload['details'];
      if (Array.isArray(details)) {
        const message = firstString(details);
        if (message) {
          return message;
        }
      }

      const violations = payload['violations'];
      if (Array.isArray(violations)) {
        const message = firstString(
          violations.flatMap((violation) => {
            if (typeof violation === 'string') {
              return [violation];
            }

            if (violation && typeof violation === 'object') {
              const entry = violation as Record<string, unknown>;
              return [entry['message'], entry['defaultMessage'], entry['field']];
            }

            return [];
          })
        );

        if (message) {
          return message;
        }
      }
    }

    if (error.status === 401) {
      return 'You are not authenticated. Please sign in again.';
    }

    if (error.status === 403) {
      return 'Access denied. Your role or account state does not allow this action.';
    }

    if (error.status === 400) {
      return 'Validation failed or the business rule rejected the request.';
    }

    if (error.status >= 500) {
      return 'Server error. Try again later.';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}
