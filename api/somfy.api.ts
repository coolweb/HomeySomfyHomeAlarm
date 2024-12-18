import { SimpleClass } from "homey";

export class SomfyApi {
    private clintId = "84eddf48-2b8e-11e5-b2a5-124cfab25595_475buqrf8v8kgwoo4gow08gkkc0ck80488wo44s8o48sg84k40";
    private clientSecret = "4dsqfntieu0wckwwo40kw848gw4o0c8k4owc80k4go0cs0k844";
    private accessToken: string | undefined = undefined;
    private refreshToken: string | undefined = undefined;
    private username: string = "";
    private password: string = "";

    constructor() {

    }

    async login(username: string, password: string) {
        this.username = username;
        this.password = password;

        await this.retrieveAccessTokenAndRefreshToken(username, password);
    }

    async retrieveAccessTokenAndRefreshToken(username: string, password: string) {
        let headers = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' };
        let res;

        console.log('SomfyApi - Login to somfy');
        res = await fetch('https://sso.myfox.io/oauth/oauth/v2/token',
            {
                method: 'POST',
                body: JSON.stringify({
                    client_id: this.clintId,
                    client_secret: this.clientSecret,
                    username: username,
                    password: password,
                    grant_type: "password"
                }),
                headers: headers,
            });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        const response = JSON.parse(await res.text());

        this.accessToken = response.access_token;
        this.refreshToken = response.refresh_token;

        console.log('SomfyApi - Login successfull, received access and refresh tokens');
        return {
            accessToken: response.access_token,
            refreshToken: response.refresh_token
        }
    }

    async retrieveHomeAlarm() {
        console.log('SomfyApi - Retrieve home alarm');

        if (this.refreshToken == undefined) {
            console.log('SomfyApi - no access refresh token');
            await this.retrieveAccessTokenAndRefreshToken(this.username, this.password);
        }

        let headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.accessToken };
        let res;

        // get all sites
        res = await fetch('https://api.myfox.io/v3/site',
            {
                method: 'GET',
                headers: headers,
            });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        let response = JSON.parse(await res.text());
        const somfyDevice = response.items[0];

        console.log('SomfyApi - alarm retrieved');
        return {
            siteId: somfyDevice.site_id,
            name: somfyDevice.name,
            securityLevel: somfyDevice.security_level
        }

    }
}