import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	locals: { safeGetSession, isMobile, supabase }
}) => {
	const { session, user } = await safeGetSession();

	let is_admin = false;
	let approved = false;

	if (user) {
		const { data, error } = await supabase
			.from('users')
			.select('is_admin, approved')
			.eq('id', user.id)
			.single();

		if (error) {
			console.error('Failed to load extended user info:', error.message);
		} else {
			is_admin = data?.is_admin ?? false;
			approved = data?.approved ?? false;
		}
	}

	return {
		session,
		user,
		isMobile,
		is_admin,
		approved
	};
};
