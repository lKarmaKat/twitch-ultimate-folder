import { tick } from 'svelte';
import {config, channelsRef} from './utils/const'
import { render, screen } from '@testing-library/svelte';
import { beforeAll, afterAll, vi, describe, test, beforeEach, expect } from 'vitest'
import DisplayWrapper from '../src/svelte/DisplayWrapper.svelte'
// import { chrome } from 'jest-chrome';
import * as chrome from 'sinon-chrome';

beforeEach(() => {
    global.chrome = chrome;
})

let deepClone = (obj) => JSON.parse(JSON.stringify(obj));
beforeAll(() => {

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
        let ch = chrome.runtime.connect.returns({
            name: 'test-port',
            onMessage: {
                addListener: vi.fn((callback) => {
                    c = callback;
                })
            },
            onDisconnect: {
                addListener: vi.fn()
            }
        })
        
        render(DisplayWrapper);

        // WaitingConfig
        screen.getByText('Waiting for config');
        let conf = {
            userId: 0,
            currentConfig: "liste principale",
            configsList: [
                deepClone(config)
            ]
        }
        c({
            type: CST.GET_CURRENT_CONFIGURATION,
            data: conf
        })
        c({
            type: CST.GET_STREAM_INFO,
            data: deepClone(channelsRef)
        })

        await tick();
        
        // Display
        screen.getByText('chowh1');
        screen.getByText('631');
        
        let chConf = deepClone(channelsRef);
        chConf[3].viewer_count = 222;
        c({
            type: CST.UPDATE_STREAM_INFO,
            data: chConf
        })
        
        await tick();
        screen.getByText('222');

        chConf = deepClone(channelsRef);
        chConf[3].viewer_count = 225;
        c({
            type: CST.UPDATE_STREAM_INFO,
            data: chConf
        })
        
        await tick();
        
        // screen.getByText('631');
        screen.getByText('225');



        
        chConf = deepClone(channelsRef);
        chConf[3].isLive = false;
        // console.log(chConf2)

        c({
            type: CST.UPDATE_STREAM_INFO,
            data: chConf
        })

        await tick();

        let chaines = document.querySelectorAll('.card');
        expect(chaines.length).toBe(3);


        
        chConf = deepClone(channelsRef);
        chConf[3].isLive = true;
        chConf[3].game_name = 'gameTest';

        c({
            type: CST.UPDATE_STREAM_INFO,
            data: chConf
        })

        await tick();

        
        screen.getByText('Cyqop');
        screen.getByText('gameTest');
        chaines = document.querySelectorAll('.card');
        expect(chaines.length).toBe(4);



        expect(1, 1)
        expect(chrome.runtime.connect.callCount).toBe(1);

    });
});

afterAll(() => chrome.flush)
