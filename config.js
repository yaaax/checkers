/* eslint-disable no-process-env */
export default {
	/**
	 * Base URL for API calls
	 * @constant
	 * @type {string}
	 */
	baseUrl: process.env.BASE_URL,

	board: {
		/**
		 * Board size : number of tiles (same horizontally and vertically)
		 * @constant
		 * @type {int}
		 */
		size: 10,

		/**
		 * Number of rows filled with pieces at the beggining of the game
		 * @constant
		 * @type {int}
		 */
		pieceRowCount: 4,

		/**
		 * Network mode
		 * @constant
		 * @type {boolean}
		 */
		networkMode: true
	}
};
