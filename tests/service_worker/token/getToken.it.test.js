import { TokenManager }  from "@src/service_worker/token.ts";
import {jest} from '@jest/globals'


describe('test integration getToken', () => {

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

    test("doit renvoyer le token s'il est déjà en mémoire et toujours valide", async () => {
        const tokenManager = new TokenManager();
        tokenManager.nextValidationDate = Date.now() + 10 * 60 * 1000;
        tokenManager.tokenExpirationDate = Date.now() + 10 * 60 * 1000;
        tokenManager.token = "valid_token";

        tokenManager.getToken().then(t => {
            expect(t).toBe("valid_token");
        });
    });


    // TODO à finir, est ce que je stock la date de péremption dans le storage même à l'initialisation, si le token est valide on appel juste validate
    // voir lock si appel getToken multiple

    test("doit valider le token si sa période de validité est dépassée", async () => { 
        const tokenManager = new TokenManager();
        tokenManager.tokenExpirationDate = Date.now() + 1000000;
        tokenManager.nextValidationDate = 0;
        tokenManager.token = "valid_token";

        global.fetch = jest.fn().mockImplementationOnce(() => {
            return Promise.resolve({
                json: () => Promise.resolve({
                    status: 200
                })
            })
        });

        let token = await tokenManager.getToken();

        expect(token).toBe("valid_token");
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });


    
    test("doit valider le token si sa période de validité ou si la date d'expiration est dépassée", async () => { 
        const tokenManager = new TokenManager();
        tokenManager.nextValidationDate = Date.now() + 10*60*1000;
        tokenManager.tokenExpirationDate = 0;
        tokenManager.token = "valid_token";

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

        chrome.identity.launchWebAuthFlow.mockImplementation((option, callback) => {
            callback('REDIRECT_URL/access_token=1234567890');
        })

        let token = await tokenManager.getToken();

        expect(token).toBe("1234567890");
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    
    test("doit valider le token une seule fois si sa période de validité est dépassée", async () => { 
        const tokenManager = new TokenManager();
        tokenManager.tokenExpirationDate = Date.now() + 1000000;
        tokenManager.nextValidationDate = 0;
        tokenManager.token = "valid_token";

        global.fetch = jest.fn().mockImplementation(() => {
            return Promise.resolve({
                json: () => Promise.resolve({
                    status: 200
                })
            })
        });

        Promise.allSettled([tokenManager.getToken(), tokenManager.getToken()]).then(
            (token) => {
                expect(token[0].value).toBe("valid_token");
                expect(token[1].value).toBe("valid_token");
                expect(global.fetch).toHaveBeenCalledTimes(1);
            }
        )

    });


});