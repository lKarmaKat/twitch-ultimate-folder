import { tick } from 'svelte';
import {config, channelsRef} from './utils/const'
import { render, screen, getAllByText, getByText } from '@testing-library/svelte';
import { beforeAll, afterAll, vi, describe, test, beforeEach, expect } from 'vitest'
import ConfigPopup from '../src/svelte/ConfigPopup.svelte'
import * as chrome from 'sinon-chrome';
import { chai } from 'vitest';

beforeEach(() => {
    global.chrome = chrome;
    var expect = chai.expect;
})

let deepClone = (obj) => JSON.parse(JSON.stringify(obj));
beforeAll(() => {
    // vi.mock("../../../../src/content_script/portConnector")
    // vi.mock('../../../../src/content_script/configManager', () => {
    //     const ConfigManager = vi.fn();
    //     ConfigManager.prototype.constructor = vi.fn();
    //     ConfigManager.prototype.getConfig = vi.fn(()=> {
    //         return {
    //             channelsPickRef: writable(channelsRef),
    //             channelsConfig: writable(config)
    //         };
    //     });
        
    //     return { default: ConfigManager };
    // });

    // const messageListener = port.onMessage.addListener.mock.calls[0][0];

    // Simuler la réception d'un message
    // const testMessage = { type: 'TEST', data: 'hello' };
    // messageListener(testMessage);


})

describe('Test test', () => {
    test('réagit à une mise à jour du store', async () => {

        let c;
        chrome.runtime.connect.callsFake((conInfo, autre) => {
            if (autre.name === 'eventbus') {
                // console.log("register eventbus", autre.name)
                return {
                    name: 'test-port',
                    onMessage: {
                        addListener: vi.fn((callback) => {
                            c = callback;
                        })
                    },
                    onDisconnect: {
                        addListener: vi.fn()
                    }
                }
            } else {
                // console.log("register autre", autre.name)
                return {
                    name: 'test-port',
                    onMessage: {
                        addListener: vi.fn()
                    },
                    onDisconnect: {
                        addListener: vi.fn()
                    }
                }
            }
        })
        // returns({
        //     name: 'test-port',
        //     onMessage: {
        //         addListener: vi.fn((callback) => {
        //             c = callback;
        //         })
        //     },
        //     onDisconnect: {
        //         addListener: vi.fn()
        //     }
        // })
        
        render(ConfigPopup);

        

        // screen.getByText('loading-wrapper');
        let conf = {
            userId: 0,
            currentConfig: "liste principale",
            configsList: [
                deepClone(config)
            ]
        }
        c({
            type: "GET_CURRENT_CONFIGURATION",
            data: conf
        })
        c({
            type: "GET_STREAM_INFO",
            data: deepClone(channelsRef)
        })

        await tick();

        screen.getAllByText('chowh1');
        screen.getAllByText('Cyqop');
        
        let mainChannelsList = document.querySelector("section#main-channels-list");
        expect(mainChannelsList.length).not.null;
        let draggableChannel = mainChannelsList.querySelectorAll("a.card");
        expect(draggableChannel.length).toBe(4);
        expect(draggableChannel[0].querySelector('.channel-name').textContent).toBe('AVAMind')
        getByText(draggableChannel[0].querySelector('.viewer-count'), '3.4K');
        expect(draggableChannel.length).toBe(4);
        expect(draggableChannel[3].querySelector('.channel-name').textContent).toBe('Cyqop')
        getByText(draggableChannel[3].querySelector('.viewer-count'), '631');

        let configList = document.querySelector("div#config-list");
        expect(configList);
        

        screen.getAllByText('list 10');

        channelsRef[3].viewer_count = 222;
        c({
            type: "UPDATE_STREAM_INFO",
            data: channelsRef
        })


        await tick();
        

        mainChannelsList = document.querySelector("section#main-channels-list");
        draggableChannel = mainChannelsList.querySelectorAll("a.card");
        getByText(draggableChannel[3].querySelector('.viewer-count'), '222');

        screen.getAllByText('222');


        let chConf = deepClone(channelsRef);
        chConf[3].isLive = false;
        // console.log(chConf2)

        c({
            type: "UPDATE_STREAM_INFO",
            data: chConf
        })

        await tick();

        let chaines = document.querySelector('.display-container').querySelectorAll('.card');
        expect(chaines.length).toBe(3);

        chConf = deepClone(channelsRef);
        chConf[3].isLive = true;
        chConf[3].game_name = 'gameTest';

        c({
            type: "UPDATE_STREAM_INFO",
            data: chConf
        })

        await tick();

        chaines = document.querySelector('.display-container').querySelectorAll('.card');
        expect(chaines.length).toBe(4);
        expect(chaines[3].querySelector('.game-name').innerHTML).toContain('gameTest');

    });
});

afterAll(() => chrome.flush)
