import fetch, { FormData } from 'node-fetch'

/**
 * Interact with Battle.net RESTful HTTPS API
 */
export default class BattleNet {
    static HTTP_GET = 'GET'
    static HTTP_POST = 'POST'
    static DEFAULT_REGION = 'us'
    static DEFAULT_LOCALE = 'en_US'
    static AUTH_API_BASE = 'https://oauth.battle.net'
    static API_BASE = region => `https://${region}.api.blizzard.com`

    constructor(region, locale, client_id, client_secret) {
        // parse user input
        this.region = region ?? process.env.BATTLE_NET_REGION ?? BattleNet.DEFAULT_REGION
        this.locale = locale ?? process.env.BATTLE_NET_LOCALE ?? BattleNet.DEFAULT_LOCALE
        this.client_id = client_id ?? process.env.BATTLE_NET_CLIENT_ID
        this.client_secret = client_secret ?? process.env.BATTLE_NET_CLIENT_SECRET

        // validate user input
        if (!this.region) throw Error(`BATTLE_NET_REGION env var is required.`);
        if (!this.locale) throw Error(`BATTLE_NET_LOCALE env var is required.`);
        if (!this.client_id) throw Error(`BATTLE_NET_CLIENT_ID env var is required.`);
        if (!this.client_secret) throw Error(`BATTLE_NET_CLIENT_SECRET env var is required.`);

        this.creds = null
    }

    /**
     * Get Oauth2 Token
     */
    async auth() {
        // curl -u {client_id}:{client_secret} -d grant_type=client_credentials https://oauth.battle.net/token
        const url = `${BattleNet.AUTH_API_BASE}/token`
        const fd = new FormData()
        fd.set('grant_type', 'client_credentials')
        const opts = {
            method: BattleNet.HTTP_POST,
            headers: {
                Authorization: `Basic ${btoa(`${this.client_id}:${this.client_secret}`)}`,
            },
            body: fd,
        }
        const response = await fetch(url, opts)
        this.creds = await response.json()
        if (!this.creds?.access_token) {
            throw Error(`Unable to authenticate API Client to retrieve OAuth2 token. `+
                `res: ${JSON.stringify(this.creds)}`)
        }
    }

    /**
     * Dispatch an authenticated API request.
     * @param {string} method HTTP request method
     * @param {string} uri HTTP request URI
     * @param {object} query (optional) HTTP request query string parameters
     * @returns {object} Parsed JSON response.
     */
    async request(method, uri, query) {
        // curl -H "Authorization: Bearer {access_token}" https://us.api.blizzard.com/data/wow/token/?namespace=dynamic-us
        const queryString = (new URLSearchParams(query)).toString()
        const url = `${BattleNet.API_BASE(this.region)}${uri}?${queryString}`
        const opts = () => ({
            method,
            headers: {
                Authorization: `Bearer ${this.creds?.access_token}`,
            },
        })
        let res = await fetch(url, opts())
        if (401 === res.status && 'Unauthorized' === res.statusText) {
            // auto-renew access_token on expiry
            await this.auth()

            // try again, once more
            res = await fetch(url, opts())
        }
        else if (200 !== res.status) {
            throw Error(`Unexpected Battle.net HTTPS API response. status: ${res.status} ${res.statusText}, url: ${url}`)
        }
        const data = await res.json()
        return data
    }
}