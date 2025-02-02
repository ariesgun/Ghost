const LinkRedirect = require('@tryghost/link-redirects').LinkRedirect;
const ObjectID = require('bson-objectid').default;

module.exports = class LinkRedirectRepository {
    /** @type {Object} */
    #LinkRedirect;
    /** @type {Object} */
    #urlUtils;

    /**
     * @param {object} deps
     * @param {object} deps.LinkRedirect Bookshelf Model
     * @param {object} deps.urlUtils
     */
    constructor(deps) {
        this.#LinkRedirect = deps.LinkRedirect;
        this.#urlUtils = deps.urlUtils;
    }

    /**
     * @param {InstanceType<LinkRedirect>} linkRedirect 
     * @returns {Promise<void>}
     */
    async save(linkRedirect) {
        const model = await this.#LinkRedirect.add({
            // Only store the parthname (no support for variable query strings)
            from: linkRedirect.from.pathname, 
            to: linkRedirect.to.href
        }, {});

        linkRedirect.link_id = ObjectID.createFromHexString(model.id);
    }

    #trimLeadingSlash(url) {
        return url.replace(/^\//, '');
    }

    fromModel(model) {
        return new LinkRedirect({
            id: model.id,
            from: new URL(this.#trimLeadingSlash(model.get('from')), this.#urlUtils.urlFor('home', true)),
            to: new URL(model.get('to'))
        });
    }

    async getAll(options) {
        const collection = await this.#LinkRedirect.findAll(options);

        const result = [];

        for (const model of collection.models) {
            result.push(this.fromModel(model));
        }

        return result;
    }

    /**
     * 
     * @param {URL} url 
     * @returns {Promise<InstanceType<LinkRedirect>|undefined>} linkRedirect 
     */
    async getByURL(url) {
        // TODO: strip subdirectory from url.pathname

        const linkRedirect = await this.#LinkRedirect.findOne({
            from: url.pathname
        }, {});

        if (linkRedirect) {
            return this.fromModel(linkRedirect);
        }
    }
};
