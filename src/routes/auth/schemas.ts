import { z } from 'zod';

export const signUpSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' }),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const relaxedEmailRegex = /^[^@]+@[^@]+$/;

export const signInSchema = z.object({
	email: z.string().regex(relaxedEmailRegex, { message: 'Invalid email structure' }),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

export const resetPasswordSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' })
});
