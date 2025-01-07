import { addSeconds, format } from 'date-fns';

export class SomfyApi {
    private clintId = "84eddf48-2b8e-11e5-b2a5-124cfab25595_475buqrf8v8kgwoo4gow08gkkc0ck80488wo44s8o48sg84k40";
    private clientSecret = "4dsqfntieu0wckwwo40kw848gw4o0c8k4owc80k4go0cs0k844";
    private accessToken: string | undefined = undefined;
    private refreshToken: string | undefined = undefined;
    private username: string = "";
    private password: string = "";
    private renewalTime: Date | undefined;
    private tokenExpirationTime: number = 0;

    constructor() {

    }

    async login(username: string, password: string) {
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

        this.username = username;
        this.password = password;

        const response = JSON.parse(await res.text());

        this.accessToken = response.access_token;
        this.refreshToken = response.refresh_token;
        this.tokenExpirationTime = response.expires_in;


        console.log('SomfyApi - Login successfull, received access and refresh tokens');
        return {
            accessToken: response.access_token,
            refreshToken: response.refresh_token
        }
    }

    async retrieveHomeAlarm() {
        let headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.accessToken };
        let res;

        console.log('SomfyApi - Retrieve home alarm');
        // get all sites
        res = await this.fetchSomfyApi('https://api.myfox.io/v3/site',
            {
                method: 'GET',
                headers: headers,
            });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        let response = JSON.parse(await res.text());
        console.log('SomfyApi - alarm retrieved');
        console.log(JSON.stringify(response));

        const somfyDevice = response.items[0];


        return {
            siteId: somfyDevice.site_id,
            name: somfyDevice.name,
            securityLevel: somfyDevice.security_level
        }

    }

    async updateAlarmState(siteId: String, state: String) {
        let headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.accessToken };
        let res;

        console.log('SomfyApi - update alarm state with ' + state);
        await this.checkAndRenewToken();
        res = await this.fetchSomfyApi('https://api.myfox.io/v3/site/' + siteId + '/security',
            {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ status: state })
            });

        if (!res.ok) {
            throw new Error(res.statusText);
        }
    }

    computeRenewalTimeOfToken(expirationTime: number): Date {
        const issuedAt = new Date();
        const expiresIn = expirationTime;
        const bufferTime = 300;
        this.renewalTime = addSeconds(issuedAt, expiresIn - bufferTime);
        return this.renewalTime;
    }

    async checkAndRenewToken() {
        const now = new Date();

        if (this.renewalTime == undefined || now.getTime() >= this.renewalTime.getTime()) {
            console.log('SomfyApi - token is expired, get new one');
            await this.retrieveAccessTokenAndRefreshToken(this.username, this.password);
        }
    }

    async fetchSomfyApi(
        input: string | URL | globalThis.Request,
        init?: RequestInit,
    ): Promise<Response> {
        await this.checkAndRenewToken();
        return fetch(input, init);
    }

}