import { writable } from 'svelte/store';
import type { StreamsInfos } from '@src/service_worker/models/streamsInfos.model';
// reliquat ?
export class ConfigManagfer {
    channelsPickRef = writable<StreamsInfos[]>([
            {
                    id: 123456789, 
                    channel_id: 123456789, 
                    title: "Titre",
                    channel_name: 'Test',
                    game_name: 'Test',
                    viewer_count: 1214,
                    isLive: true,
                    profile_image_url: "https://placehold.co/300x300",
                    language: 'fr'
                }
    ]);
	channelsConfig = writable<any>({
        "10": {
            id: "10",
            name: "test",
            type: "liste",
            items: [                {
                    id: 123456789, 
                    channel_id: 123456789, 
                    channel_name: 'Test',
                    game_name: 'Test',
                    viewer_count: 1234,
                    isLive: true,
                    profile_image_url: "https://placehold.co/300x300"
                }]
        },
        rootList:{
            id:'node1',
            name:'liste principale',
            items:[
                {id: 10, name: "10", type: 'liste'},
                {
                    id: 123456789, 
                    channel_id: 123456789, 
                    channel_name: 'Test',
                    game_name: 'Test',
                    viewer_count: 1234,
                    isLive: true,
                    profile_image_url: "https://placehold.co/300x300"
                }
            ],
            behavior: {
                extendedOnStartup: true,
                extendOnHover: false,
                extendOnClick: false,
                isPinnable: true
            },
            style: {
                headerColor: "#808080",
                contentColor: "#808080"
            }
          }
    });

    constructor() {
        
    }

    getConfig() {
        return {
            channelsConfig: this.channelsConfig,
            channelsPickRef: this.channelsPickRef
        }
    }
}