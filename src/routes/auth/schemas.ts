import { z } from 'zod';

// Security constants
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit

// Enhanced email validation with security considerations
const emailSchema = z
	.string()
	.min(1, 'Email is required')
	.trim()
	.toLowerCase()
	.max(MAX_EMAIL_LENGTH, 'Email address is too long')
	.email('Invalid email address')
	.refine((email) => !email.includes('..'), { message: 'Email cannot contain consecutive dots' })
	.refine((email) => !email.startsWith('.') && !email.endsWith('.'), {
		message: 'Email cannot start or end with a dot'
	})
	.refine((email) => !/[<>\"'&]/.test(email), { message: 'Email contains invalid characters' })
	.refine(
		(email) => {
			const [local, domain] = email.split('@');
			return local && local.length <= 64 && domain && domain.length <= 253;
		},
		{ message: 'Email format is invalid' }
	);

// Enhanced password validation with security requirements
const passwordSchema = z
	.string()
	.min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
	.max(MAX_PASSWORD_LENGTH, `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`)
	.refine((password) => /[a-z]/.test(password), {
		message: 'Password must contain at least one lowercase letter'
	})
	.refine((password) => /[A-Z]/.test(password), {
		message: 'Password must contain at least one uppercase letter'
	})
	.refine((password) => /[0-9]/.test(password), {
		message: 'Password must contain at least one number'
	})
	.refine((password) => /[^a-zA-Z0-9]/.test(password), {
		message: 'Password must contain at least one special character'
	})
	.refine((password) => !/\s/.test(password), {
		message: 'Password cannot contain spaces'
	})
	.refine(
		(password) => {
			// Check for common weak patterns
			const weakPatterns = [
				/123456/,
				/password/,
				/qwerty/,
				/admin/,
				/letmein/,
				/welcome/,
				/(.)\1{3,}/ // 4 or more repeated characters
			];
			return !weakPatterns.some((pattern) => pattern.test(password.toLowerCase()));
		},
		{ message: 'Password is too weak or contains common patterns' }
	);

// Relaxed password schema for sign-in (existing users might have weaker passwords)
const signInPasswordSchema = z
	.string()
	.min(1, 'Password is required')
	.max(MAX_PASSWORD_LENGTH, 'Password is too long');

// Relaxed email for sign-in (more permissive for existing accounts)
const relaxedEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signInEmailSchema = z
	.string()
	.min(1, 'Email is required')
	.trim()
	.toLowerCase()
	.max(MAX_EMAIL_LENGTH, 'Email address is too long')
	.regex(relaxedEmailRegex, { message: 'Invalid email format' })
	.refine((email) => !/[<>\"'&]/.test(email), { message: 'Email contains invalid characters' });

export const signUpSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const signInSchema = z.object({
	email: signInEmailSchema,
	password: signInPasswordSchema
});

export const magicLinkSchema = z.object({
	email: emailSchema
});

// Additional auth schemas
export const passwordResetRequestSchema = z.object({
	email: emailSchema
});

export const passwordResetSchema = z
	.object({
		token: z.string().min(1, 'Reset token is required').max(500, 'Invalid reset token'),
		password: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: 'New password must be different from current password',
		path: ['newPassword']
	});

export const updateEmailSchema = z.object({
	newEmail: emailSchema,
	password: z.string().min(1, 'Password is required for email changes')
});

// Rate limiting schema for auth attempts
export const authAttemptSchema = z.object({
	identifier: z.string().min(1), // IP or email
	action: z.enum(['signin', 'signup', 'reset', 'magic_link']),
	timestamp: z.date().default(() => new Date())
});

export type SignUpSchema = typeof signUpSchema;
export type SignInSchema = typeof signInSchema;
export type MagicLinkSchema = typeof magicLinkSchema;
export type PasswordResetRequestSchema = typeof passwordResetRequestSchema;
export type PasswordResetSchema = typeof passwordResetSchema;
export type ChangePasswordSchema = typeof changePasswordSchema;
export type UpdateEmailSchema = typeof updateEmailSchema;
export type AuthAttemptSchema = typeof authAttemptSchema;
