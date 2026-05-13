import * as CST from '../../src/constantes'

export const config = {
    "10": {
        "id": "list 10",
        "name": "list 10",
        "behavior": {
            "extendOnClick": false,
            "extendOnHover": false,
            "extendedOnStartup": true,
            "isPinnable": true
        },
        "items": [
            {
                "id": "24180896992460",
                "channel_id": "241808969"
            },
            {
                "id": "9112217886107",
                "channel_id": "91122178"
            }
        ],
        "style": {
            "content": {
                "contentColor": "#808080",
                "contentRadius": null,
                "contentWidth": null
            },
            "header": {
                "borderColor": null,
                "borderRadius": null,
                "borderWidth": null,
                "headerColor": "#808080"
            },
            "theme": "SYSTEM"
        },
        "type": {
            "height": CST.HEADER_TYPE_HEIGHT[1].id,
            "iconType": CST.ICON_TYPE[0].id,
            "barType": CST.BAR_TYPE[0].id,
            "viewerCountType": 1
        }
    },
    "rootList": {
        "id": "node1",
        "name": "liste principale",
        "behavior": {
            "extendOnClick": false,
            "extendOnHover": false,
            "extendedOnStartup": true,
            "isPinnable": true
        },
        "items": [
            {
                "id": "11716864220691",
                "channel_id": "117168642"
            },
            {
                "id": "10545868269037",
                "channel_id": "105458682"
            },
            {
                "id": 10,
                "type": CST.TYPE_LIST
            }
        ],
        "style": {
            "content": {
                "backgroundColor": "#808080",
                "borderColor": "#808080",
                "borderRadius": 0,
                "borderWidth": "1px"
            },
            "header": {
                "backgroundColor": "#808080",
                "borderColor": "#808080",
                "borderRadius": 0,
                "borderWidth": "1px"
            },
            "theme": CST.SYSTEM_STYLE
        },
        type: {
            height: CST.HEADER_TYPE_HEIGHT[1].id,
            iconType: CST.ICON_TYPE[0].id,
            barType: CST.BAR_TYPE[0].id,
            viewerCountType: 1
        }
    }
}

export const channelsRef = [
    ["117168642", {
        "id": "11716864220691",
        "channel_id": "117168642",
        "channel_name": "chowh1",
        "isLive": true,
        "game_name": "ARC Raiders",
        "profile_image_url": "../../assets/profil.png",
        "title": "🚨 TRAHISON, AMITIÉ, PVP - 0 PUB en 2026 🚨 !Insta !doigt",
        "viewer_count": 2492
    }],
    ["105458682", {
        "id": "10545868269037",
        "channel_id": "105458682",
        "channel_name": "BobRoss",
        "isLive": true,
        "game_name": "Art",
        "profile_image_url": "../../assets/profil.png",
        "title": "New Year Marathon!",
        "viewer_count": 675
    }],
    ["241808969", {
        "id": "24180896992460",
        "channel_id": "241808969",
        "channel_name": "AVAMind",
        "isLive": true,
        "game_name": "Baldur's Gate 3",
        "profile_image_url": "../../assets/profil.png",
        "title": "04.01 || BG3 + MOD ||  EP21 - Liberer un dragon géant ? OK",
        "viewer_count": 3361
    }],
    ["91122178", {
        "id": "9112217886107",
        "channel_id": "91122178",
        "channel_name": "Cyqop",
        "isLive": true,
        "game_name": "ARC Raiders",
        "profile_image_url": "../../assets/profil.png",
        "title": "HEY DONT SHOOOOOOOOOOOT",
        "viewer_count": 631
    }],
]

export const newChannels = [
    ["91232178",{
        "id": "9123217886107",
        "channel_id": "91232178",
        "channel_name": "PierreLapin",
        "viewer_count": 12345,
        "isLive": true,
        "game_name": "Just chatting",
        "profile_image_url": "../../assets/profil.png",
        "title": "ACAB"
    }],["93132178",{
        "id": "9323217886107",
        "channel_id": "93132178",
        "channel_name": "Anyme023",
        "isLive": false,
        "profile_image_url": "../../assets/profil.png"
    }]
]

export const newChannel = ["83132178", {
        "id": "8323217886107",
        "channel_id": "83132178",
        "channel_name": "robi",
        "isLive": false,
        "profile_image_url": "../../assets/profil.png"
    }]