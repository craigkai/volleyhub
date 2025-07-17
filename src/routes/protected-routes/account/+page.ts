// /src/routes/account/+page.ts
import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ data }) => {
	const schema = z.object({
		email: z.string().email(),
		newPassword: z.string().min(6).optional()
	});

	const form = await superValidate(
		{
			email: data?.user?.email ?? '',
			newPassword: ''
		},
		zod4(schema),
		{ errors: false }
	);

	return { form };
};
