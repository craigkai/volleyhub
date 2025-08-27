import { z } from 'zod';
import { fromError } from 'zod-validation-error';

/**
 * Enhanced validation utilities for the volleyball tournament application
 */

// Rate limiting configuration
interface RateLimitConfig {
	maxAttempts: number;
	windowMs: number;
	identifier: string;
}

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting utility
 */
export function checkRateLimit(config: RateLimitConfig): {
	allowed: boolean;
	remaining: number;
	resetTime: number;
} {
	const key = `${config.identifier}_rate_limit`;
	const now = Date.now();
	const existing = rateLimitStore.get(key);

	// Clean up expired entries
	if (existing && now > existing.resetTime) {
		rateLimitStore.delete(key);
	}

	const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };

	if (current.count >= config.maxAttempts) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: current.resetTime
		};
	}

	// Increment counter
	current.count++;
	rateLimitStore.set(key, current);

	return {
		allowed: true,
		remaining: config.maxAttempts - current.count,
		resetTime: current.resetTime
	};
}

/**
 * Sanitization utilities
 */
export const sanitize = {
	/**
	 * Remove HTML tags and dangerous characters
	 */
	html: (input: string): string => {
		return input
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/[<>\"'&]/g, '') // Remove dangerous characters
			.trim();
	},

	/**
	 * Sanitize for database queries (basic)
	 */
	sql: (input: string): string => {
		return input
			.replace(/['";\\]/g, '') // Remove SQL injection characters
			.trim();
	},

	/**
	 * Sanitize tournament/team names
	 */
	name: (input: string): string => {
		return input
			.replace(/[<>\"'&]/g, '')
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();
	},

	/**
	 * Sanitize email addresses
	 */
	email: (input: string): string => {
		return input
			.toLowerCase()
			.trim()
			.replace(/[<>\"'&]/g, '');
	}
};

/**
 * Enhanced validation function with better error messages
 */
export function validateWithBetterErrors<T>(
	schema: z.ZodSchema<T>,
	data: unknown,
	context?: string
): { success: true; data: T } | { success: false; errors: string[]; formattedError: string } {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	// Convert Zod errors to user-friendly messages
	const validationError = fromError(result.error, {
		prefix: context ? `${context} validation failed` : 'Validation failed'
	});

	const errors = result.error.errors.map((err) => {
		const path = err.path.join('.');
		return `${path ? `${path}: ` : ''}${err.message}`;
	});

	return {
		success: false,
		errors,
		formattedError: validationError.toString()
	};
}

/**
 * Async validation for database-dependent checks
 */
export async function validateAsync<T>(
	schema: z.ZodSchema<T>,
	data: unknown,
	additionalChecks?: Array<(data: T) => Promise<string | null>>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
	// First, run synchronous validation
	const syncResult = validateWithBetterErrors(schema, data);

	if (!syncResult.success) {
		return syncResult;
	}

	// Run additional async checks
	if (additionalChecks && additionalChecks.length > 0) {
		const asyncErrors: string[] = [];

		for (const check of additionalChecks) {
			const error = await check(syncResult.data);
			if (error) {
				asyncErrors.push(error);
			}
		}

		if (asyncErrors.length > 0) {
			return {
				success: false,
				errors: asyncErrors
			};
		}
	}

	return { success: true, data: syncResult.data };
}

/**
 * Common validation patterns
 */
export const commonValidation = {
	/**
	 * Check if a team name is unique within an event
	 */
	uniqueTeamName:
		(existingTeams: Array<{ name: string; id?: number }>, excludeId?: number) =>
		(data: { name: string; id?: number }) => {
			const conflicts = existingTeams.filter(
				(team) =>
					team.name.toLowerCase() === data.name.toLowerCase() && team.id !== (excludeId || data.id)
			);
			return Promise.resolve(
				conflicts.length > 0 ? `Team name "${data.name}" already exists` : null
			);
		},

	/**
	 * Check if an event/tournament name is unique for a user
	 */
	uniqueEventName:
		(existingEvents: Array<{ name: string; id?: number }>, excludeId?: number) =>
		(data: { name: string; id?: number }) => {
			const conflicts = existingEvents.filter(
				(event) =>
					event.name.toLowerCase() === data.name.toLowerCase() &&
					event.id !== (excludeId || data.id)
			);
			return Promise.resolve(
				conflicts.length > 0 ? `Tournament name "${data.name}" already exists` : null
			);
		},

	/**
	 * Validate match participants
	 */
	validMatchTeams:
		(availableTeams: Array<{ id: number; name: string }>) =>
		(data: { team1?: number | null; team2?: number | null }) => {
			const errors: string[] = [];

			if (data.team1 && !availableTeams.find((t) => t.id === data.team1)) {
				errors.push('Team 1 is not available in this tournament');
			}

			if (data.team2 && !availableTeams.find((t) => t.id === data.team2)) {
				errors.push('Team 2 is not available in this tournament');
			}

			if (data.team1 && data.team2 && data.team1 === data.team2) {
				errors.push('Teams cannot play against themselves');
			}

			return Promise.resolve(errors.length > 0 ? errors.join(', ') : null);
		}
};

/**
 * Security validation utilities
 */
export const securityValidation = {
	/**
	 * Check for potential XSS attempts
	 */
	checkXSS: (input: string): boolean => {
		const xssPatterns = [
			/<script[^>]*>.*?<\/script>/gi,
			/<iframe[^>]*>.*?<\/iframe>/gi,
			/javascript:/gi,
			/on\w+\s*=/gi,
			/<object[^>]*>.*?<\/object>/gi,
			/<embed[^>]*>/gi
		];

		return !xssPatterns.some((pattern) => pattern.test(input));
	},

	/**
	 * Check for SQL injection attempts
	 */
	checkSQLInjection: (input: string): boolean => {
		const sqlPatterns = [
			/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
			/(\b(OR|AND)\s+\w+\s*(=|<|>|\!=))/gi,
			/(--|\/\*|\*\/|;)/g,
			/(\b(SCRIPT|EVAL|ALERT|CONFIRM|PROMPT)\b)/gi
		];

		return !sqlPatterns.some((pattern) => pattern.test(input));
	},

	/**
	 * Validate file uploads (if applicable)
	 */
	validateFileUpload: (file: { name: string; type: string; size: number }): string | null => {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		const maxSize = 5 * 1024 * 1024; // 5MB

		if (!allowedTypes.includes(file.type)) {
			return 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.';
		}

		if (file.size > maxSize) {
			return 'File size too large. Maximum size is 5MB.';
		}

		if (!/^[\w\-. ]+$/.test(file.name)) {
			return 'Invalid filename. Only letters, numbers, spaces, dots, and dashes are allowed.';
		}

		return null;
	}
};

/**
 * Environment-specific validation
 */
export function getValidationConfig() {
	const isDev = import.meta.env.DEV;

	return {
		// In development, be more lenient with validation
		strictMode: !isDev,
		enableRateLimit: !isDev,
		logValidationErrors: isDev,

		// Rate limits
		authAttempts: { maxAttempts: isDev ? 10 : 5, windowMs: 15 * 60 * 1000 }, // 15 minutes
		apiRequests: { maxAttempts: isDev ? 200 : 100, windowMs: 60 * 1000 }, // 1 minute

		// Security settings
		enableXSSProtection: true,
		enableSQLInjectionProtection: true,
		enableCSRFProtection: !isDev
	};
}
