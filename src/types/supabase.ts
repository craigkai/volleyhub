export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			events: {
				Row: {
					courts: number | null;
					created_at: string;
					divisions: Json | null;
					id: number;
					name: string;
					owner: string;
					teams: Json | null;
				};
				Insert: {
					courts?: number | null;
					created_at?: string;
					divisions?: Json | null;
					id?: number;
					name: string;
					owner: string;
					teams?: Json | null;
				};
				Update: {
					courts?: number | null;
					created_at?: string;
					divisions?: Json | null;
					id?: number;
					name?: string;
					owner?: string;
					teams?: Json | null;
				};
				Relationships: [
					{
						foreignKeyName: 'events_owner_fkey';
						columns: ['owner'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['user_id'];
					}
				];
			};
			game: {
				Row: {
					created_at: string;
					id: number;
					team1: number;
					team1_score: number;
					team2: number;
					team2_score: number;
				};
				Insert: {
					created_at?: string;
					id?: number;
					team1: number;
					team1_score: number;
					team2: number;
					team2_score: number;
				};
				Update: {
					created_at?: string;
					id?: number;
					team1?: number;
					team1_score?: number;
					team2?: number;
					team2_score?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'game_team1_fkey';
						columns: ['team1'];
						isOneToOne: false;
						referencedRelation: 'team';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'game_team2_fkey';
						columns: ['team2'];
						isOneToOne: false;
						referencedRelation: 'team';
						referencedColumns: ['id'];
					}
				];
			};
			profile: {
				Row: {
					created_at: string | null;
					data: Json | null;
					name: string;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					data?: Json | null;
					name: string;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					data?: Json | null;
					name?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'profile_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			schedule: {
				Row: {
					active: boolean | null;
					created_at: string;
					data: Json;
					event_id: number;
					id: number;
				};
				Insert: {
					active?: boolean | null;
					created_at?: string;
					data: Json;
					event_id: number;
					id?: number;
				};
				Update: {
					active?: boolean | null;
					created_at?: string;
					data?: Json;
					event_id?: number;
					id?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'schedule_event_id_fkey';
						columns: ['event_id'];
						isOneToOne: false;
						referencedRelation: 'events';
						referencedColumns: ['id'];
					}
				];
			};
			team: {
				Row: {
					created_at: string | null;
					division: string | null;
					id: number;
					name: string;
					state: string | null;
				};
				Insert: {
					created_at?: string | null;
					division?: string | null;
					id?: number;
					name: string;
					state?: string | null;
				};
				Update: {
					created_at?: string | null;
					division?: string | null;
					id?: number;
					name?: string;
					state?: string | null;
				};
				Relationships: [];
			};
			team_member: {
				Row: {
					created_at: string | null;
					id: number;
					state: string | null;
					team_id: number;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					id?: number;
					state?: string | null;
					team_id: number;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					id?: number;
					state?: string | null;
					team_id?: number;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'team_member_team_id_fkey';
						columns: ['team_id'];
						isOneToOne: false;
						referencedRelation: 'team';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'team_member_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['user_id'];
					}
				];
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
