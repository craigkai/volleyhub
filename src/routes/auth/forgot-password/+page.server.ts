import { z } from 'zod';

const changeEmailSchema = z.object({
    email: z.string().email(),
});

export const actions = {
    forgot_password: async (event) => {
        const { request, locals } = event;
        const { supabase } = locals;

        const data = await request.formData();
        const obj = Object.fromEntries(data);

        const { email } = obj;

        try {
            const result = changeEmailSchema.parse(obj);

            const { data: user, error } = await supabase.auth.resetPasswordForEmail(result.email, {
                redirectTo: 'auth/new-password',
            });

            if (error) {
                return {
                    errors: [
                        { field: 'email', message: 'Something went wrong' },
                    ],
                    data: obj,
                    success: false,
                };
            }

            return {
                data: user,
                errors: [],
                success: true,
            };
        } catch (error: any) {
            const { fieldErrors: errors } = error.flatten();

            return {
                errors: errors,
                data: obj,
                success: false,
            };
        }
    },
};
