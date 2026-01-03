export interface StreamsInfos {
    id: number,
    channel_id: number,
    channel_name: string,
    isLive: boolean,
    viewer_count: number,
    language: string,
    game_name: string,
    title: string,
    profile_image_url?: string
}