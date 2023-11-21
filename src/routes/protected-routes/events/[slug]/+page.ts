// src/routes/events/+page.server.ts
export const load = async ({ params }) => {
	const event_uuid = params.slug;

	let eventId: number | undefined = 0;
	let eventName: string | undefined = undefined;

	if (typeof event_uuid === 'number') {
		eventId = event_uuid;
	} else {
		eventName = event_uuid;
	}

	return { eventId, eventName };
};
