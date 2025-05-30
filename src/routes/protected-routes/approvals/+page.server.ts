import { fail } from '@sveltejs/kit';
import { approvalSchema } from '$schemas/approvals';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

export const actions = {
	approve: async (event) => {
		const supabase = event.locals.supabase;
		const form = await superValidate(event.request, zod(approvalSchema));

		if (!form.valid) return fail(400, { form, message: 'Invalid data' });

		const { userId } = form.data;

		const { error } = await supabase
			.from('users')
			.update({ approved: true, approved_at: new Date().toISOString() })
			.eq('id', userId);

		if (error) return fail(500, { form, message: 'Approval failed' });

		return { form, success: true, message: 'User approved.' };
	},

	reject: async (event) => {
		const supabase = event.locals.supabase;
		const form = await superValidate(event.request, zod(approvalSchema));

		if (!form.valid) return fail(400, { form, message: 'Invalid data' });

		const { userId } = form.data;

		const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
		const { error: dbErr } = await supabase.from('users').delete().eq('id', userId);

		if (authErr || dbErr)
			return fail(500, { form, message: 'Rejection failed. Partial cleanup may have occurred.' });

		return { form, success: true, message: 'User rejected and removed.' };
	}
};
