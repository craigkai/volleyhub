export class SupabaseClientStore {
	supabaseClient?: supabaseClient;

	setSupabaseClient(supabaseClient: supabaseClient): void {
		console.log(`Setting Supabase client: ${supabaseClient}`);
		this.supabaseClient = supabaseClient;
	}
}

export const SupabaseClientStoreInstance = new SupabaseClientStore();
