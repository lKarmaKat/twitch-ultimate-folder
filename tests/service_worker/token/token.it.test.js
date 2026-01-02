import { TokenManager }  from "@src/service_worker/token.ts";
import {jest} from '@jest/globals'
// import fetchMock  from 'fetch-mock';
// import fetchMock, { manageFetchMockGlobally } from '@fetch-mock/jest';
// import fetchMock, { manageFetchMockGlobally } from '@fetch-mock/jest';
// import fetchMock from 'fetch-mock';


/**
 * token existe et valide                                       V
 * token existe et invalide, nouveau token ok                   V
 * token existe et invalide, nouveau token nok
 * token existe et invalide, nouveau token ok mais invalide
 * token inexistant, nouveau token ok                           V
 * token inexistant, nouveau token nok                          V
 * token inexistant, nouveau token ok mais invalide
 * 
 */

describe('test integration TokenManager', () => {

    beforeEach(() => {
        chrome.identity = {
            getRedirectURL: jest.fn().mockReturnValue("REDIRECT_URL"),
            launchWebAuthFlow: jest.fn()
        };
        chrome.runtime = {
            lastError: ''
        }
        chrome.storage.local = {
            get: jest.fn(),
            set: jest.fn()
        };
    });

    test("devrait trouver un token valide en mémoire", async () => {
        const tokenManager = new TokenManager();
        
        chrome.storage.local.get.mockImplementation((key, callback) => {
            if (key === 'tokenExpirationDate')
                callback({
                    tokenExpirationDate: Date.now() + 10*60*1000
                });
            else if (key === 'twitchToken')
                callback({
                    twitchToken: "valid_token"
                });
            else if (key === 'nextValidationDate')
                callback({
                nextValidationDate: Date.now() + 10*60*1000
            })
        });

        global.fetch = jest.fn(() => {
            return Promise.resolve({
                json: () => Promise.resolve({
                    status: 200
                })
            })
        });

        await tokenManager.initToken();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(tokenManager.token).toBe("valid_token");
    });

    test("devrait trouver un token invalide et en demander un autre", async () => {
        const tokenManager = new TokenManager();

        chrome.storage.local.get.mockImplementation((key, callback) => {
            if (key === 'tokenExpirationDate')
                callback({
                    tokenExpirationDate: Date.now() - 10*60*1000
                });
            else if (key === 'twitchToken')
                callback({
                    twitchToken: "invalid_token"
                });
            else if (key === 'nextValidationDate')
                callback({
                nextValidationDate: Date.now() + 10*60*1000
            })
        });

        chrome.identity.launchWebAuthFlow.mockImplementation((option, callback) => {
            callback('REDIRECT_URL/access_token=1234567890');
        })

        global.fetch = jest.fn().mockImplementationOnce(() => {
            return Promise.resolve({
                json: () => Promise.resolve({
                    status: 401
                })
            })
        }).mockImplementationOnce(() => {
            return Promise.resolve({
                json: () => Promise.resolve({
                    status: 200
                })
            })
        });

        await tokenManager.initToken();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(chrome.identity.launchWebAuthFlow).toHaveBeenCalledTimes(1);
        expect(tokenManager.token).toBe("1234567890");
    });


    test("ne trouve pas de token et en demande un", async () => {
        const tokenManager = new TokenManager();

        chrome.storage.local.get.mockImplementation((key, callback) => {
            if (key === 'tokenExpirationDate')
                callback({});
            else if (key === 'twitchToken')
                callback({});
            else if (key === 'nextValidationDate')
                callback({})
            });
            

        chrome.identity.launchWebAuthFlow.mockImplementation((option, callback) => {
            callback('REDIRECT_URL/access_token=1234567890');
        })

        global.fetch = jest.fn().mockImplementationOnce(() => {
            return Promise.resolve({
                json: () => Promise.resolve({
                    status: 200
                })
            })
        });

        await tokenManager.initToken();
        expect(chrome.storage.local.get).toHaveBeenCalledTimes(3);
        expect(chrome.identity.launchWebAuthFlow).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(tokenManager.token).toBe("1234567890");
    });


    test("ne trouve pas de token et erreur lors de l'auth", async () => {
        const tokenManager = new TokenManager();

        chrome.storage.local.get.mockImplementation((key, callback) => {
            if (key === 'tokenExpirationDate')
                callback({});
            else if (key === 'twitchToken')
                callback({});
            else if (key === 'nextValidationDate')
                callback({})
        });

        chrome.identity.launchWebAuthFlow.mockImplementation((option, callback) => {
            callback('REDIRECT_URL/accesken=');
        })

        await expect(tokenManager.initToken()).rejects.toThrow("No token found and unable to get a new one.");

        expect(chrome.storage.local.get).toHaveBeenCalledTimes(3);
        expect(chrome.identity.launchWebAuthFlow).toHaveBeenCalledTimes(1);
    });



});
