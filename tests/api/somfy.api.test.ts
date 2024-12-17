import exp from "constants";
import { SomfyApi } from "../../api/somfy.api"

describe("SomfyApi", () => {
    let fetchMock: any = undefined;
    let clientAssets: string = '';

    const assetsFetchMock = () => Promise.resolve({
        ok: true,
        status: 200,
        text: async () => clientAssets
    } as Response);

    beforeEach(() => {
        fetchMock = jest.spyOn(global, "fetch")
            .mockImplementation(assetsFetchMock);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('test', async () => {
        clientAssets = JSON.stringify(require('../resources/tokens.json'))
        var somfyApi = new SomfyApi();
        await somfyApi.login('user', 'pwd');

        clientAssets = JSON.stringify(require('../resources/site.json'))
        var result = await somfyApi.retrieveHomeAlarm();

        expect(result.name).toBe('Home');
        expect(result.securityLevel).toBe('armed');
        expect(result.siteId).toBe('sdjfejnfkjfksnfkjdhbgfks');
    })
})