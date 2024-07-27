import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, isMobile }, cookies }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		isMobile,
		cookies: cookies.getAll()
	};
};
