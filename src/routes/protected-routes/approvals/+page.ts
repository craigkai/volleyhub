export const load = async ({ parent }) => {
	const { supabase } = await parent();

	const { data: pendingUsers } = await supabase
		.from('users')
		.select('id, name, created_at')
		.eq('approved', false)
		.neq('rejected', true);

	return { pendingUsers };
};
