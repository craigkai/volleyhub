import { fail } from '@sveltejs/kit';
import { approvalSchema } from '$schemas/approvals';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

export const actions = {
	approve: async ({ request, locals }) => {
		const supabase = locals.supabase;
		const form = await superValidate(request, zod(approvalSchema));

		if (!form.valid) return fail(400, { form, message: 'Invalid data' });

		const { userId } = form.data;

		const { error } = await supabase
			.from('users')
			.update({ approved: true, approved_at: new Date().toISOString() })
			.eq('id', userId);

		if (error) return fail(500, { form, message: 'Approval failed' });

		return { form, success: true, message: 'User approved.' };
	},

	reject: async ({ request, locals }) => {
		const supabase = locals.supabase;
		const data = await request.formData();
		const form = await superValidate(data, zod(approvalSchema));

		if (!form.valid) return fail(400, { form, message: 'Invalid data' });

		const { userId } = form.data;
		if (!userId) return fail(400, { form, message: 'User ID is required' });

		const { error } = await supabase.from('users').update({ rejected: true }).eq('id', userId);

		if (error) {
			console.error('Rejection error:', error);
			return fail(500, { form, message: 'Rejection failed.' });
		}

		return { form, success: true, message: 'User marked as rejected.' };
	}
};
