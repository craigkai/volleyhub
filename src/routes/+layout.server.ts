import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, isMobile } }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		isMobile
	};
};
