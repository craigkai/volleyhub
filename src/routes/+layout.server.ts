import type { LayoutServerLoad } from './$types';
import { VERCEL_COMMIT_REF } from '$env/static/private';

export const load: LayoutServerLoad = async ({ locals: { getSession } }) => {
	return {
		session: await getSession(),
		deploymentGitBranch: VERCEL_COMMIT_REF
	};
};
