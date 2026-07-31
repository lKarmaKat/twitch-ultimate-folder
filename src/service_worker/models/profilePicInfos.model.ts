export interface ProfilePicInfos {
    id: string;
    profile_image_url: string;
    /** Kept from /users to name a channel that is no longer followed. */
    login?: string;
    display_name?: string;
}