import config from "./config.js";
import Api from "./api.js";
import styles from "./assets/styles/export.scss";

import "./style.scss";

console.info(
	// eslint-disable-next-line no-process-env
	"NODE_ENV: %c" + process.env.NODE_ENV,
	"font-weight: bold"
);
console.info("Config loaded:");
console.dir(config);

const boardConf = config.board;
window.addEventListener("DOMContentLoaded", event => {
	/**
	 * Array storing the Piece instances
	 * @constant
	 * @type {Piece[]}
	 */
	const pieces = [];

	/**
	 * Array storing the Tile instances
	 * @constant
	 * @type {Tile[]}
	 */
	const tiles = [];

	/**
	 * Utility function calculating the distance between 2 positions
	 *
	 * @param {int} x1 Position 1 x
	 * @param {int} y1 Position 1 y
	 * @param {int} x2 Position 2 x
	 * @param {int} y2 Position 2 y
	 *
	 * @return {number} distance
	 */
	const dist = function(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	};

	/**
	 * Piece Object
	 *
	 * @param {HTMLDivElement} element The <div> element of the DOM linked to this
	 * 																	Piece
	 * @param {int[]} position	Array describing the position of this Piece on the
	 *													board [row, column]
	 * @param {int} playerNumber	1 for Player 1, 2 for player 2
	 * @param {boolean} testInitKing	Only used for tests purpose to instanciate
	 *																a piece directly as a king
	 */
	function Piece(element, position, playerNumber, testInitKing) {
		this.element = element;
		this.position = position;

		// -2 for kings (3 is king for player 1, 4 is king for player 2)
		this.player = playerNumber <= 2 ? playerNumber : playerNumber - 2;

		// when jump exist, regular move is not allowed since there is
		// no jump at round 1, all pieces are allowed to move initially
		this.allowedtomove = true;

		/**
		 * Make this Piece a king
		 * A king can move in all 4 directions and several tiles at the same time
		 */
		this.makeKing = function() {
			this.element.style.backgroundImage =
				"url('./king" + this.player + ".png')";
			this.king = true;
		};
		if (testInitKing) {
			this.makeKing();
		} else {
			this.king = false;
		}

		/**
		 * Move this Piece to a given Tile, specifying if it's a jump or not
		 *
		 * @param	{Tile} tile
		 * @param {boolean} isJump
		 *
		 * @return {boolean} true if this Piece has been moved, otherwise false
		 */
		this.move = function(tile, isJump) {
			this.element.classList.remove("selected");
			const tileRow = tile.position[0];
			const tileCol = tile.position[1];
			if (!Board.isValidPlacetoMove(tileRow, tileCol)) {
				return false;
			}

			// If it's not a jump, and this Piece is not a king,
			// make sure this Piece doesn't go backwards
			if (!isJump) {
				if (this.player === 1 && !this.king) {
					if (tileRow < this.position[0]) {
						return false;
					}
				} else if (this.player === 2 && !this.king) {
					if (tileRow > this.position[0]) {
						return false;
					}
				}
			}

			// Move the mark (1, 2, 3 or 4) in Board.board (previous mark becomes 0)
			Board.board[this.position[0]][this.position[1]] = 0;
			Board.board[tileRow][tileCol] = this.player;

			// Update position
			this.position = [tileRow, tileCol];

			// Change the css using board's dictionary
			this.element.style.top = Board.dictionary[this.position[0]];
			this.element.style.left = Board.dictionary[this.position[1]];

			// If this Piece reaches the end of the column on the opposite side of the
			// board, it becomes a king
			if (
				!this.king &&
				(this.position[0] === 0 || this.position[0] === boardConf.size - 1)
			) {
				this.makeKing();
			}
			return true;
		};

		/**
		 * Tells if this Piece is for Player 1 (otherwise it's for Player 2...)
		 *
		 * @return {boolean} true if this Piece is player 1's otherwise false
		 */
		this.isPlayer1 = function() {
			return this.player === 1 || this.player === 3;
		};

		/**
		 * Tell if this Piece can jump somewhere
		 *
		 * @return {boolean} true if this Piece can jump somewhere, otherwise false
		 */
		this.canJumpAny = function() {
			const oldX = this.position[1];
			const oldY = this.position[0];
			return (
				this.canOpponentJump([oldY + 2, oldX + 2]) ||
				this.canOpponentJump([oldY + 2, oldX - 2]) ||
				this.canOpponentJump([oldY - 2, oldX + 2]) ||
				this.canOpponentJump([oldY - 2, oldX - 2])
			);
		};

		/**
		 * Tell if an opponent jump can be made to a specific position
		 *
		 * @param {int[]} newPosition Array describing the position of this Piece on
		 * 														the board [row, column]
		 *
		 * @return {boolean} true if an opponent jump is possible, otherwise false
		 */
		this.canOpponentJump = function(newPosition) {
			// find what the displacement is
			const newX = newPosition[1];
			const newY = newPosition[0];

			// New position musy be valid
			if (!Board.isValidPlacetoMove(newY, newX)) {
				return false;
			}

			const oldX = this.position[1];
			const oldY = this.position[0];

			const stepX = newX > oldX ? 1 : -1;
			const stepY = newY > oldY ? 1 : -1;

			let checkX;
			let checkY;
			for (
				checkX = oldX + stepX, checkY = oldY + stepY;
				checkX < newX;
				checkX += stepX, checkY += stepY
			) {
				const type = Board.getPlaceType(checkY, checkX);
				if (type === -1) {
					// out of boundaries
					return false;
				} else if (type === 0) {
					// empty place
					if (!this.king) {
						return false;
					}
					continue;
				} else {
					// piece found. Is next place empty?
					if (Board.getPlaceType(checkY + stepY, checkX + stepX) === 0) {
						// ok, this is the one
						break;
					}
					return false;
				}
			}

			// From here checkY and checkX correspond to the opponent to be jumped

			// Find which Piece instance is sitting there
			for (const pieceIndex in pieces) {
				if (
					pieces[pieceIndex].position[0] === checkY &&
					pieces[pieceIndex].position[1] === checkX
				) {
					if (this.player != pieces[pieceIndex].player) {
						// return the piece sitting there
						return pieces[pieceIndex];
					}
				}
			}
		};

		/**
		 * Make an opponent Jump by going to a Tile
		 *
		 * @param {Tile} tile Tile at final destination
		 *
		 * @return {boolean} true if an opponent jump has been made, otherwise false
		 */
		this.opponentJump = function(tile) {
			const pieceToRemove = this.canOpponentJump(tile.position);
			if (!pieceToRemove) {
				return false;
			}

			// remove the opponent Piece
			pieceToRemove.remove();
			return true;
		};

		/**
		 * Remove this Piece from th board
		 * /!\ It only sets the position to an empty array ([])
		 * @todo rework
		 */
		this.remove = function() {
			// remove it and delete it from the gameboard
			this.element.style.display = "none";
			document
				.getElementById("player" + (this.player === 1 ? "2" : "1"))
				.insertAdjacentHTML("beforeend", "<div class='capturedPiece'></div>");
			Board.score["player" + this.player] += 1;
			Board.board[this.position[0]][this.position[1]] = 0;

			// Reset position
			this.position = [];
		};
	}

	/**
	 *
	 * @param {*} element
	 * @param {*} position
	 */
	function Tile(element, position) {
		// linked DOM element
		this.element = element;
		// position in gameboard
		this.position = position;
		// if tile is in range from the piece
		this.inRange = function(piece) {
			/** @todo improve performance */
			for (const k of pieces) {
				if (
					k.position[0] == this.position[0] &&
					k.position[1] == this.position[1]
				) {
					return "wrong";
				}
			}
			if (piece.canOpponentJump(position)) {
				return "jump";
			}
			if (
				dist(
					this.position[0],
					this.position[1],
					piece.position[0],
					piece.position[1]
				) == Math.sqrt(2)
			) {
				if (
					!piece.king &&
					piece.player == 1 &&
					this.position[0] < piece.position[0]
				) {
					return "wrong";
				}
				if (
					!piece.king &&
					piece.player == 2 &&
					this.position[0] > piece.position[0]
				) {
					return "wrong";
				} else {
					// regular move
					return "regular";
				}
			} else if (
				dist(
					this.position[0],
					this.position[1],
					piece.position[0],
					piece.position[1]
				) > Math.sqrt(2) &&
				piece.king
			) {
				// jump move
				return "regular";
			} else {
				return false;
			}
		};
	}

	/**
	 * The Board object controls the logic of the game
	 * @namespace
	 */
	const Board = {
		/**
		 * Array describing the initial state of the game with numbers:
		 * - 0: empty tile
		 * - 1: player 1 piece
		 * - 2: player 2 piece
		 * - 3: player 1 king piece
		 * - 4: player 2 king piece
		 * It's an array of rows, each row being an array of columns
		 *
		 * 	Example for boardSize = 8 and pieceRowCount = 3:
		 * 	[0, 1, 0, 1, 0, 1, 0, 1],
		 * 	[1, 0, 1, 0, 1, 0, 1, 0],
		 * 	[0, 1, 0, 1, 0, 1, 0, 1],
		 * 	[0, 0, 0, 0, 0, 0, 0, 0],
		 * 	[0, 0, 0, 0, 0, 0, 0, 0],
		 * 	[2, 0, 2, 0, 2, 0, 2, 0],
		 * 	[0, 2, 0, 2, 0, 2, 0, 2],
		 * 	[2, 0, 2, 0, 2, 0, 2, 0]
		 *
		 * @constant
		 * @type {int[]int[]}
		 */
		board: null,

		/**
		 * Object storing the score of each player
		 * @constant
		 * @type {object} score
		 * @type {int} score.player1 - Player 1 score
		 * @type {int} score.player2 - Player 2 score
		 * @todo check if still usefull
		 */
		score: {
			player1: 0,
			player2: 0
		},

		/**
		 * Active player number : 1 or 2
		 * In Network mode, player 1 is the local player (player 2 is remote)
		 * @constant
		 * @type {int} [1]
		 */
		activePlayer: 1,

		/**
		 * Tell if local player is waiting for the remote opponent to play
		 * Always false when {config.board.networkMode} is false
		 * @constant
		 * @type {boolean} [false]
		 */
		waitingOpponent: false,

		/**
		 * Flag telling if a jump exists. In that case it's not allowed to move
		 * other pieces
		 * @type {boolean} [false]
		 */
		jumpexist: false,

		/**
		 * Flag telling if game board is in "continuous jump" mode
		 * -> "is it in the middle of a multiple jump move?"
		 * @type {boolean} [false]
		 */
		continuousjump: false,

		/**
		 * The <div> of the DOM holding all the tiles
		 * @constant
		 * @type {HTMLDivElement} [document.getElementsByClassName("tiles")[0]]
		 */
		tilesElement: document.getElementsByClassName("tiles")[0],

		/**
		 * Dictionary to convert position in Board.board to 'rem' units
		 * Ex: ['0rem', '10rem', '20rem', '30rem', '40rem',
		 *       '50rem', '60rem', '70rem', '80rem', '90rem']
		 * @constant
		 * @type {string[]}
		 */
		dictionary: [],

		initalize: function(gameBoard) {
			console.log("Initialize %o", "Board game");
			this.board = gameBoard;

			// Initialize dictionnary
			// Should be something like :
			let pos = 0;
			const pieceSize = parseFloat(styles.pieceSize);
			const dictionary = this.dictionary;
			for (let i = 0; i <= boardConf.size; ++i) {
				dictionary[i] = pos + "rem";
				pos += pieceSize;
			}

			let pieceId = 0;
			let countTiles = 0;

			for (let row = 0; row < boardConf.size; ++row) {
				for (let column = 0; column < boardConf.size; ++column) {
					let piece = gameBoard[row][column];
					let isKing = false;
					// Whole set of if statements control where the tiles and pieces
					// should be placed on the board
					if (row % 2 == 1) {
						if (column % 2 == 0) {
							countTiles = this.tileRender(row, column, countTiles);
						}
					} else {
						if (column % 2 == 1) {
							countTiles = this.tileRender(row, column, countTiles);
						}
					}

					if (piece === 3 || piece === 4) {
						piece -= 2;
						isKing = true;
					}
					if (piece > 0) {
						this.playerPiecesRender(piece, row, column, pieceId++, isKing);
					}
				}
			}

			Board.initEventListeners();
		},

		// ------
		// Events
		// ------
		/**
		 * Add event listeners on Pieces, Tiles and Reset button
		 */
		initEventListeners: function() {
			/**
			 * Select the piece on click if it is the player's turn
			 */
			const pieceDivs = document.getElementsByClassName("piece");
			for (const piece of pieceDivs) {
				piece.onclick = event => {
					const isPlayersTurn = piece.parentNode.classList.contains(
						"player" + Board.activePlayer + "pieces"
					);
					if (isPlayersTurn) {
						if (Board.waitingOpponent) {
							return;
						}
						if (
							!Board.continuousjump &&
							pieces[piece.attributes["id"].value].allowedtomove
						) {
							const selectedPiece = this.getSelectedPiece();
							if (selectedPiece) {
								selectedPiece.classList.toggle("selected");
							}
							if (!piece.classList.contains("selected")) {
								piece.classList.add("selected");
							}
						} else {
							const exist =
								"a jump exists for another piece => not allowed to move";
							const continuous =
								"continuous jump exists => you have to jump the same piece";
							const message = !Board.continuousjump ? exist : continuous;
							console.info(message);
						}
					}
				};
			}

			/**
			 * Move piece when tile is clicked
			 */
			const tileDivs = document.getElementsByClassName("tile");
			for (const tile of tileDivs) {
				tile.onclick = event => {
					// make sure a piece is selected
					const selectedPiece = this.getSelectedPiece();
					if (!selectedPiece) {
						return;
					}
					const selectedId = selectedPiece.attributes["id"].value;

					// find the tile object being clicked
					const tileID = tile.attributes["id"].value.replace(/tile/, "");
					const tileObj = tiles[tileID];

					// find the piece being selected
					const pieceObj = pieces[selectedId];

					// check if the tile is in range from the object
					const inRange = tileObj.inRange(pieceObj);
					if (inRange != "wrong") {
						// if the move needed is jump, then move it but also check if
						// another move can be made (double and triple jumps)
						if (inRange == "jump") {
							if (pieceObj.opponentJump(tileObj)) {
								pieceObj.move(tileObj, true);
								if (pieceObj.canJumpAny()) {
									// change back to original since another turn can be made
									//  Board.changeActivePlayer();
									pieceObj.element.classList.add("selected");
									// exist continuous jump, you are not allowed to de-select
									// this piece or select other pieces
									Board.continuousjump = true;
								} else {
									Board.changeActivePlayer();
								}
							}
							// if it's regular then move it if no jumping is available
						} else if (inRange == "regular" && !Board.jumpexist) {
							if (!pieceObj.canJumpAny()) {
								pieceObj.move(tileObj);
								Board.changeActivePlayer();
							} else {
								alert("Si un pion peut être capturé, vous devez le faire !");
							}
						}
					}
				};
			}

			/**
			 * Reset game when clear button is pressed
			 */
			const clearGameButton = document.getElementsByClassName("cleargame");
			console.assert(clearGameButton, "Button with id 'cleargame' is missing");
			clearGameButton.onclick = () => {
				Board.clear();
			};
		},

		/**
		 * Render a tile
		 *
		 * @param {int} row
		 * @param {int} column
		 * @param {int} countTiles
		 * @return {int}
		 */
		tileRender: function(row, column, countTiles) {
			this.tilesElement.insertAdjacentHTML(
				"beforeend",
				"<div class='tile' id='tile" +
					countTiles +
					"' style='top:" +
					this.dictionary[row] +
					";left:" +
					this.dictionary[column] +
					";'></div>"
			);
			tiles[countTiles] = new Tile(
				document.getElementById("tile" + countTiles),
				[parseInt(row), parseInt(column)]
			);
			return countTiles + 1;
		},

		/**
		 * Render player's pieces
		 *
		 * @param {int} playerNumber 1 or 2
		 * @param {int} row
		 * @param {int} column
		 * @param {int} countPieces
		 * @param {boolean} testInitKing
		 */
		playerPiecesRender: function(
			playerNumber,
			row,
			column,
			countPieces,
			testInitKing
		) {
			document
				.getElementsByClassName(`player${playerNumber}pieces`)[0]
				.insertAdjacentHTML(
					"beforeend",
					"<div class='piece' id='" +
						countPieces +
						"' style='top:" +
						this.dictionary[row] +
						";left:" +
						this.dictionary[column] +
						";'></div>"
				);
			pieces[countPieces] = new Piece(
				document.getElementById(countPieces),
				[row, column],
				playerNumber,
				testInitKing
			);
		},

		/**
		 * Retrieves the currently selected piece div
		 *
		 * @return {HTMLDivElement}
		 */
		getSelectedPiece: function() {
			const selectedPieces = document.getElementsByClassName("piece selected");
			console.assert(
				selectedPieces.length <= 1,
				"There should only be O or 1 selected piece"
			);

			if (!selectedPieces.length) {
				return null;
			}

			return selectedPieces[0];
		},

		/**
		 * Check if the position is in the boundaries of the board
		 *
		 * @param {int} row
		 * @param {int} column
		 * @return {boolean}
		 */
		isInBoundaries: function(row, column) {
			return (
				row >= 0 &&
				row < boardConf.size &&
				column >= 0 &&
				column < boardConf.size
			);
		},

		/**
		 * Get the type of object at a given position of the board
		 *
		 * @param {int} row
		 * @param {int} column
		 * @return {int} -1: out of boundaries, 0: empty, 1: player 1, 2: player 2,
		 * 							 3: king 1 (used for test), 4: king 2 (used for test)
		 */
		getPlaceType: function(row, column) {
			if (!this.isInBoundaries(row, column)) {
				return -1;
			}
			return this.board[row][column];
		},

		/**
		 * Check if the location has an object
		 *
		 * @param {int} row
		 * @param {int} column
		 * @return {boolean}
		 */
		isValidPlacetoMove: function(row, column) {
			if (!this.isInBoundaries(row, column)) {
				return false;
			}
			if (this.board[row][column] === 0) {
				return true;
			}
			return false;
		},

		/**
		 * Change the active player - also changes div.turn's CSS
		 */
		changeActivePlayer: function() {
			const turnDiv = document.getElementById("turn");
			console.assert(turnDiv, "Div with id 'turn' is missing");

			if (this.activePlayer === 1) {
				if (boardConf.networkMode) {
					this.startWaitingForOpponent();
				}
				this.activePlayer = 2;
				turnDiv.style.background =
					"linear-gradient(to right, transparent 50%, #BEEE62 50%)";
			} else {
				this.activePlayer = 1;
				turnDiv.style.background =
					"linear-gradient(to right, #BEEE62 50%, transparent 50%)";
			}
			this.check_if_jump_exist();

			// Display a message if the party is finished
			// (someone won or there is a draw)
			const playerWon = Board.checkifAnybodyWon();
			const winnerDiv = document.getElementById("winner");
			console.assert(winnerDiv, "Div with id 'winner' is missing");

			if (playerWon !== false) {
				if (playerWon === 0) {
					winnerDiv.innerHtml = "Égalité";
				} else {
					winnerDiv.innerHTML = "Le joueur " + playerWon + " gagne !";
				}
			}
		},

		startWaitingForOpponent: function() {
			this.waitingOpponent = true;
		},

		/**
		 * Check if anybody won, or if there is a draw
		 *
		 * @return {boolean|int}  false if the game must go on,
		 * 												0 if there is a draw
		 * 												1 if player 1 has won
		 * 												2 if player 2 has won
		 */
		checkifAnybodyWon: function() {
			let nbPiecesPlayer1 = 0;
			let nbPiecesPlayer2 = 0;
			for (const k of pieces) {
				if (k.position.length) {
					if (k.isPlayer1()) {
						nbPiecesPlayer1++;
					} else {
						nbPiecesPlayer2++;
					}
				}
			}
			if (nbPiecesPlayer1 === 0) {
				return 2;
			}
			if (nbPiecesPlayer2 === 0) {
				return 1;
			}

			for (const k of pieces) {
				if (k.allowedtomove) {
					return false;
				}
			}

			if (nbPiecesPlayer1 > nbPiecesPlayer2) {
				return 1;
			} else if (nbPiecesPlayer1 < nbPiecesPlayer2) {
				return 2;
			} else {
				return 0;
			}
		},

		/**
		 * Reset the game by simply reloading the page
		 */
		clear: function() {
			location.reload();
		},

		/**
		 * Check if a jump exists
		 */
		check_if_jump_exist: function() {
			this.jumpexist = false;
			this.continuousjump = false;
			for (const k of pieces) {
				k.allowedtomove = false;
				// if jump exist, only set those "jump" pieces "allowed to move"
				if (
					k.position.length != 0 &&
					k.player == this.activePlayer &&
					k.canJumpAny()
				) {
					this.jumpexist = true;
					k.allowedtomove = true;
				}
			}
			// if jump doesn't exist, all pieces are allowed to move
			if (!this.jumpexist) {
				for (const k of pieces) k.allowedtomove = true;
			}
		}
	};

	/**
	 * Set the initial board game from API
	 */
	async function initGameFromApi() {
		try {
			const api = new Api();
			const gameBoard = await api.getCurrentGame();
			Board.initalize(gameBoard);
		} catch (error) {
			console.error("Issue initializing the game from API.", error);
		}
	}
	/**
	 * Set the initial board game from scratch, for local games
	 */
	function initLocalGame() {
		const gameBoard = [];

		// Player 1 pieces
		for (let i = 0; i < boardConf.pieceRowCount; ++i) {
			gameBoard[i] = [];
			for (let j = 0; j < boardConf.size; ++j) {
				gameBoard[i][j] = (j + (i % 2)) % 2;
			}
		}

		// Middle game
		for (
			let i = boardConf.pieceRowCount;
			i < boardConf.size - boardConf.pieceRowCount;
			++i
		) {
			gameBoard[i] = [];
			for (let j = 0; j < boardConf.size; ++j) {
				gameBoard[i][j] = 0;
			}
		}

		// Player 2 pieces
		for (
			let i = boardConf.size - 1;
			i >= boardConf.size - boardConf.pieceRowCount;
			--i
		) {
			gameBoard[i] = [];
			for (let j = 0; j < boardConf.size; ++j) {
				gameBoard[i][j] = (j + (i % 2)) % 2 ? 2 : 0;
			}
		}

		// -----
		// Tests
		// -----

		// // TEST King
		// gameBoard = [
		// 	[0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
		// 	[1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
		// 	[0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
		// 	[1, 0, 3, 0, 1, 0, 1, 0, 1, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
		// 	[0, 2, 0, 4, 0, 0, 0, 2, 0, 2],
		// 	[2, 0, 2, 0, 2, 0, 0, 0, 2, 0],
		// 	[0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
		// 	[2, 0, 2, 0, 2, 0, 2, 0, 0, 0]
		// ];

		// // TEST End of game
		// gameBoard = [
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 2, 0, 1, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 4, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		// 	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		// ];

		Board.initalize(gameBoard);
	}

	if (boardConf.networkMode) {
		initGameFromApi();
	} else {
		initLocalGame();
	}
});
