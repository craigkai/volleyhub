import { approvalSchema } from '$schemas/approvals';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ parent }) => {
	const { supabase } = await parent();

	const form = await superValidate(zod(approvalSchema));

	const { data: pendingUsers } = await supabase
		.from('users')
		.select('id, name, created_at')
		.eq('approved', false)
		.neq('rejected', true);

	return { form, pendingUsers };
};
