import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	locals: { safeGetSession, isMobile, approved, is_admin }
}) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		isMobile,
		is_admin,
		approved
	};
};
