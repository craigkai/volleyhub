// src/routes/events/+page.server.ts
export const load = async ({ params }) => {
	const event_uuid = params.slug;

	let event_id: number | undefined = 0;
	let event_name: string | undefined = undefined;

	if (typeof event_uuid === 'number') {
		event_id = event_uuid;
	} else {
		event_name = event_uuid;
	}

	return { event_id, event_name };
};
