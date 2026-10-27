/**
 * Tipuri pentru PetMatch și mesagerie (tabele: pet_likes, matches, messages)
 */
import type { Pet } from './pet';
import type { Profile } from './profile';

export interface PetLike {
  id: string;
  from_pet_id: string;
  to_pet_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  pet_a_id: string;
  pet_b_id: string;
  created_at: string;
  /** Join opțional cu datele animalelor */
  pet_a?: Pet;
  pet_b?: Pet;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;       // = auth.users.id
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  match: Match;
  other_pet: Pet;
  other_owner: Profile;
  last_message: Message | null;
  unread_count: number;
}
