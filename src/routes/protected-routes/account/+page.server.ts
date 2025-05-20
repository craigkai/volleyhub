// /src/routes/account/+page.server.ts
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase.auth.getUser();

	return {
		user: data.user
	};
};

export const actions: Actions = {
	edit: async ({ request, locals }) => {
		const schema = z.object({
			email: z.string().email(),
			newPassword: z.string().min(6).optional()
		});

		const form = await superValidate(request, zod(schema));

		if (!form.valid) {
			return fail(400, { editForm: form });
		}

		const supabase = locals.supabase;
		const user = (await supabase.auth.getUser()).data.user;

		if (!user) throw redirect(302, '/auth');

		const updates: any = {};

		if (form.data.email && form.data.email !== user.email) {
			updates.email = form.data.email;
		}

		if (form.data.newPassword) {
			updates.password = form.data.newPassword;
		}

		if (Object.keys(updates).length === 0) {
			return fail(400, {
				editForm: { ...form, message: 'Nothing to update' }
			});
		}

		const { error } = await supabase.auth.updateUser(updates);

		if (error) {
			return fail(400, {
				editForm: { ...form, message: error.message }
			});
		}

		return { form, success: true };
	}
};
