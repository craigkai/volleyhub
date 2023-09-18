// src/routes/+page.server.ts
export const load = async ({ url }) => {
	// Make url available in other routes
	return { url: url.origin, league: url.searchParams.get("league") || "IV Stallions" };
};
