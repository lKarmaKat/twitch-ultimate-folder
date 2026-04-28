import { tick } from 'svelte';
import {config, channelsRef} from './utils/const'
import { render, screen, getAllByText, getByText } from '@testing-library/svelte';
import {userEvent} from '@testing-library/user-event'
import { beforeAll, afterAll, vi, describe, test, beforeEach, expect } from 'vitest'
import ConfigPopup from '../src/svelte/ConfigPopup.svelte'
import * as chrome from 'sinon-chrome';
import { chai } from 'vitest';

beforeEach(() => {
    global.chrome = chrome;
    var expect = chai.expect;
})
const originalElementFromPoint = document.elementFromPoint;

function mockRect(
  element,
  { x, y, width = 80, height = 80 }
) {
  element.getBoundingClientRect = () => ({
    x,
    y,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    width,
    height,
    toJSON: () => {},
  });

  element.getClientRects = () => [element.getBoundingClientRect()];

  Object.defineProperties(element, {
    offsetWidth: { get: () => width },
    offsetHeight: { get: () => height },
    clientWidth: { get: () => width },
    clientHeight: { get: () => height },
  });
}



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
            type: CST.GET_CURRENT_CONFIGURATION,
            data: conf
        })
        c({
            type: CST.GET_STREAM_INFO,
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
            type: CST.UPDATE_STREAM_INFO,
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
            type: CST.UPDATE_STREAM_INFO,
            data: chConf
        })

        await tick();

        let chaines = document.querySelector('.display-container').querySelectorAll('.card');
        expect(chaines.length).toBe(3);

        chConf = deepClone(channelsRef);
        chConf[3].isLive = true;
        chConf[3].game_name = 'gameTest';

        c({
            type: CST.UPDATE_STREAM_INFO,
            data: chConf
        })

        await tick();

        chaines = document.querySelector('.display-container').querySelectorAll('.card');
        expect(chaines.length).toBe(4);
        expect(chaines[3].querySelector('.game-name').textContent).equals('gameTest');

        
        const user = userEvent.setup()
        // const button = screen.getByRole('button', {name: 'Show display conf'})
        // await user.click(button)

        let mainChannelList = document.querySelector('#main-channels-list');
        
        let configListContainer = document.querySelector('#config-list');
        
        const removeBtn = document.querySelector('#remove-241808969');
        
        await user.click(removeBtn);
        
        expect(configListContainer.querySelectorAll('.card').length).toBe(3);
        expect(configListContainer.querySelectorAll('.list-container').length).toBe(2);
        
        
        let addListBtn = configListContainer.querySelector('#add-list-10');
        await user.click(addListBtn);
        expect(configListContainer.querySelectorAll('.list-container').length).toBe(3);
        
        let firstCard = mainChannelList.querySelector('.card');
        let list11 = configListContainer.querySelector('#list-11');
        let list11DnDZone = list11.querySelector('.dnd-zone-r');
        console.log("list 11" + list11DnDZone.innerHTML)

        // await user.pointer([
        //     {keys: '[MouseLeft>]', target: firstCard},
        //     {pointerName: 'mouse', target: list11DnDZone, node: list11DnDZone, offset: 1},
        //     {keys: '[/MouseLeft]'},
        // ])

        document.elementFromPoint = (x, y) => {
            if (x >= 100 && x <= 180 && y >= 100 && y <= 200) {
                return list11DnDZone;
            }
            if (x >= 10 && x <= 90 && y >= 10 && y <= 90) {
                return firstCard;
            }
            return document.body;
        };



        mockRect(firstCard, { x: 10, y: 10 });
        mockRect(list11DnDZone, { x: 100, y: 100, height: 100 });
        await user.pointer([
            { keys: '[MouseLeft>]', coords: { x: 45, y: 45 } },
            { coords: { x: 140, y: 150 } },
            { keys: '[/MouseLeft]' },
        ]);


        // list11DnDZone.dispatchEvent(
        // new CustomEvent('finalize', {
        //     detail: { items: [firstCard] },
        // })
        // );

        console.log("list 11 content " + list11.textContent);
        // await tick();
        
            
        // await user.click(button)

    });
});

afterAll(() => {

    document.elementFromPoint = originalElementFromPoint;

    chrome.flush

})
