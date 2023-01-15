import BattleNet from "./BattleNet.mjs"

const validateInt = (o, k, n, min) => {
    const i = parseInt(n, 10)
    if ('number' === typeof i && i >= min) {
        o[k] = i
    }
}

const validateString = (o, k, s, min) => {
    if ('string' === typeof s && s.length > min) {
        o[k] = s
    }
}

/**
 * Interact with Blizzard Hearthstone API
 * see: https://develop.battle.net/documentation/hearthstone/game-data-apis
 */
export default class Hearthstone {
    constructor(bnet) {
        this.bnet = bnet
    }
    
    /**
     * @returns a list of all Hearthstone cards
     *    owned by the current user
     */
    async Cards__list(query) {
        const q = {
            locale: this.bnet.locale,
        }
        validateString(q, 'class', query.class, 1)
        validateString(q, 'manaCost', query.mana, 1)
        validateString(q, 'rarity', query.rarity, 1)
        validateInt(q, 'page', query.page, 1)
        validateInt(q, 'pageSize', query.pageSize, 1)
        validateString(q, 'sort', query.sort, 1)
        const cards = await this.bnet.request(
            BattleNet.HTTP_GET,
            `/hearthstone/cards`,
            q,
        )
        return cards
    }
    
    /**
     * @returns a list of all Hearthstone API metadata
     * see: https://develop.battle.net/documentation/hearthstone/guides/metadata
     */
    async Metadata__list() {
        const metadata = await this.bnet.request(
            BattleNet.HTTP_GET,
            `/hearthstone/metadata`,
            { locale: this.bnet.locale },
        )
        return metadata
    }
}