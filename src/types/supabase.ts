export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
	public: {
		Tables: {
			members: {
				Row: {
					created_at: string | null;
					email: string | null;
					id: string;
					name: string | null;
					phone: string | null;
				};
				Insert: {
					created_at?: string | null;
					email?: string | null;
					id?: string;
					name?: string | null;
					phone?: string | null;
				};
				Update: {
					created_at?: string | null;
					email?: string | null;
					id?: string;
					name?: string | null;
					phone?: string | null;
				};
			};
			memberships: {
				Row: {
					active: boolean | null;
					created_at: string | null;
					id: string;
					member_id: string | null;
					team_id: string | null;
				};
				Insert: {
					active?: boolean | null;
					created_at?: string | null;
					id?: string;
					member_id?: string | null;
					team_id?: string | null;
				};
				Update: {
					active?: boolean | null;
					created_at?: string | null;
					id?: string;
					member_id?: string | null;
					team_id?: string | null;
				};
			};
			teams: {
				Row: {
					day: string;
					level: string;
					created_at: string | null;
					id: string;
					name: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					team_captain?: string | null;
					team_name?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					team_captain?: string | null;
					team_name?: string | null;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
