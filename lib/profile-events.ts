export const PROFILE_CHANGE_EVENT = "brillara:profile-changed";

export interface ProfileChangeDetail {
  registered: boolean;
  name: string | null;
}
