/** @see {https://github.com/parcel-bundler/parcel/issues/1762} */
import "regenerator-runtime/runtime";
import { get } from "axios";
import config from "./config.js";

/**
 * @class
 */
export default class Api {
	/**
	 * @constructor
	 * @param  {string} baseUrl Base URL for API calls
	 */
	constructor(baseUrl) {
		baseUrl = baseUrl || config.baseUrl;
		if (!baseUrl) {
			console.error("Api needs a base URL");
			throw new Error("an error is thrown");
		}
		/**
		 * Base URL
		 * @type {string}
		 * @private
		 */
		this.baseUrl = baseUrl;
	}

	/**
	 * Get Game initial state
	 *
	 * @return {Object}
	 */
	async getCurrentGame() {
		const res = await this.get("games/1");
		if (res) {
			return res.gameData;
		} else {
			return null;
		}
	}

	// -------
	// Private
	// -------

	/**
	 * Request API with a GET.
	 * Concatenates {baseUrl} and the given endpoint
	 * @param  {string} endpoint Ex: "boardgame"
	 * @private
	 */
	async get(endpoint) {
		const base = this.baseUrl;
		const url = base + (base.endsWith("/") ? "" : "/") + endpoint;
		const p = await get(url)
			.then(res => {
				console.group();
				console.info("GET %c%s%c", "font-weight: bold;", endpoint, "");
				console.info(res.data);
				console.groupEnd();
				return res.data;
			})
			.catch(e => {
				console.error("Can't GET %c%s%c", "font-weight: bold;", endpoint, "");
				throw e;
			});
		return p;
	}
}
