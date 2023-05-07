// src/routes/+page.server.ts
export const load = async ({ url }) => {
	// Make url available in other routes
	return { url: url.origin };
};
