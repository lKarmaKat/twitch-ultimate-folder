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
        chrome.runtime.connect.returns({
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

        c({
            type: "GET_CURRENT_CONFIGURATION",
            data: config
        })
        c({
            type: "GET_STREAM_INFO",
            data: channelsRef
        })

        await tick();
        
        // Display
        screen.getByText('chowh1');
        screen.getByText('631');
        
        channelsRef[3].viewer_count = 222;
        // console.log(channelsRef)
        c({
            type: "UPDATE_STREAM_INFO",
            data: channelsRef
        })
        
        await tick();
        
        // screen.getByText('631');
        screen.getByText('222');



    });
});

afterAll(() => chrome.flush)
