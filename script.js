window.onload = function() {
	// The initial setup
	const boardSize = 10;
	const pieceRowCount = 4;
	const pieceSize = 3.5; // size in 'rem'
	const gameBoard = [];

	// Player 1 pieces
	for (let i = 0; i < pieceRowCount; ++i) {
		gameBoard[i] = [];
		for (let j = 0; j < boardSize; ++j) {
			gameBoard[i][j] = (j + (i % 2)) % 2;
		}
	}

	// Middle game
	for (let i = pieceRowCount; i < boardSize - pieceRowCount; ++i) {
		gameBoard[i] = [];
		for (let j = 0; j < boardSize; ++j) {
			gameBoard[i][j] = 0;
		}
	}

	// Player 2 pieces
	for (let i = boardSize - 1; i >= boardSize - pieceRowCount; --i) {
		gameBoard[i] = [];
		for (let j = 0; j < boardSize; ++j) {
			gameBoard[i][j] = (j + (i % 2)) % 2 ? 2 : 0;
		}
	}

	// Result should be something like this :
	// (Ex here for boardSize = 8 and pieceRowCount = 3)
	// [0, 1, 0, 1, 0, 1, 0, 1],
	// [1, 0, 1, 0, 1, 0, 1, 0],
	// [0, 1, 0, 1, 0, 1, 0, 1],
	// [0, 0, 0, 0, 0, 0, 0, 0],
	// [0, 0, 0, 0, 0, 0, 0, 0],
	// [2, 0, 2, 0, 2, 0, 2, 0],
	// [0, 2, 0, 2, 0, 2, 0, 2],
	// [2, 0, 2, 0, 2, 0, 2, 0]

	// TEST King
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

	// TEST End of game
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

	// arrays to store the instances
	const pieces = [];
	const tiles = [];

	/**
	 * Distance
	 *
	 * @param {*} x1
	 * @param {*} y1
	 * @param {*} x2
	 * @param {*} y2
	 * @return {Number} distance
	 */
	const dist = function(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	};

	/**
	 * Piece object - there are 24 instances of them in a checkers game
	 *
	 * @param {*} element
	 * @param {*} position
	 * @param {int} playerNumber
	 * @param {*} testInitKing
	 */
	function Piece(element, position, playerNumber, testInitKing) {
		// when jump exist, regular move is not allowed since there is
		// no jump at round 1, all pieces are allowed to move initially
		this.allowedtomove = true;
		// linked DOM element
		this.element = element;
		// positions on gameBoard array in format row, column
		this.position = position;
		// which player's piece i it
		this.player = "";
		this.player = playerNumber <= 2 ? playerNumber : playerNumber - 2;
		// -2 for kings...

		// makes object a king
		this.makeKing = function() {
			this.element.css(
				"backgroundImage",
				"url('img/king" + this.player + ".png')"
			);
			this.king = true;
		};
		if (testInitKing) {
			this.makeKing();
		} else {
			this.king = false;
		}
		// moves the piece
		this.move = function(tile, isJump) {
			this.element.removeClass("selected");
			if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) {
				return false;
			}
			// if it's not a jump, make sure piece doesn't go backwards
			// if it's not a king
			if (!isJump) {
				if (this.player == 1 && this.king == false) {
					if (tile.position[0] < this.position[0]) return false;
				} else if (this.player == 2 && this.king == false) {
					if (tile.position[0] > this.position[0]) return false;
				}
			}
			// remove the mark from Board.board and put it in the new spot
			Board.board[this.position[0]][this.position[1]] = 0;
			Board.board[tile.position[0]][tile.position[1]] = this.player;
			this.position = [tile.position[0], tile.position[1]];
			// change the css using board's dictionary
			this.element.css("top", Board.dictionary[this.position[0]]);
			this.element.css("left", Board.dictionary[this.position[1]]);
			// if piece reaches the end of the row on opposite side crown it a king
			// (can move all directions)
			if (
				!this.king &&
				(this.position[0] == 0 || this.position[0] == boardSize - 1)
			) {
				this.makeKing();
			}
			return true;
		};

		/**
		 * Tells if this Piece is for Player 1 (otherwise it's for Player 2...)
		 * @return {boolean}
		 */
		this.isPlayer1 = function() {
			return this.player === 1 || this.player === 3;
		};

		/**
		 * Tests if piece can jump anywhere
		 * @return {boolean}
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
		 * Tests if an opponent jump can be made to a specific place
		 *
		 * @param {array} newPosition
		 * @return {boolean}
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

			// make sure object doesn't go backwards if not a king
			// if (this.player == 1 && this.king == false) {
			//   if (newY < oldY) return false;
			// } else if (this.player == 2 && this.king == false) {
			//   if (newY > oldY) return false;
			// }
			// "middle" tile where the piece to be conquered sits
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

			// Here checkY, checkX correspond to the opponant to be jumped
			// find which object instance is sitting there
			for (const pieceIndex in pieces) {
				if (
					pieces[pieceIndex].position[0] == checkY &&
					pieces[pieceIndex].position[1] == checkX
				) {
					if (this.player != pieces[pieceIndex].player) {
						// return the piece sitting there
						return pieces[pieceIndex];
					}
				}
			}
		};

		/**
		 * Opponent Jump
		 *
		 * @param {Tile} tile
		 * @return {boolean}
		 */
		this.opponentJump = function(tile) {
			const pieceToRemove = this.canOpponentJump(tile.position);
			// if there is a piece to be removed, remove it
			if (pieceToRemove) {
				pieceToRemove.remove();
				return true;
			}
			return false;
		};

		/**
		 * Remove
		 */
		this.remove = function() {
			// remove it and delete it from the gameboard
			this.element.css("display", "none");
			if (this.player == 1) {
				$("#player2").append("<div class='capturedPiece'></div>");
				Board.score.player2 += 1;
			}
			if (this.player == 2) {
				$("#player1").append("<div class='capturedPiece'></div>");
				Board.score.player1 += 1;
			}
			Board.board[this.position[0]][this.position[1]] = 0;

			// Reset position so it doesn't get picked up by the for loop in the
			// canOpponentJump method
			this.position = [];
			const playerWon = Board.checkifAnybodyWon();
			if (playerWon !== false) {
				if (playerWon === 0) {
					$("#winner").html("Égalité");
				} else {
					$("#winner").html("Le joueur " + playerWon + " gagne !");
				}
			}
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
				this.king
			) {
				// jump move
				return "regular";
			} else {
				return false;
			}
		};
	}

	// The Board object controls the logic of the game
	const Board = {
		board: gameBoard,
		score: {
			player1: 0,
			player2: 0
		},
		playerTurn: 1,
		jumpexist: false,
		continuousjump: false,
		tilesElement: $("div.tiles"),
		// Dictionary to convert position in Board.board to the viewport units
		dictionary: [],

		/**
		 * Initialize the board
		 */
		initalize: function() {
			// Initialize dictionnary
			// Should be something like :
			// dictionary: ['0rem', '10rem', '20rem', '30rem', '40rem',
			//   '50rem', '60rem', '70rem', '80rem', '90rem']
			let pos = 0;
			const dictionary = this.dictionary;
			for (let i = 0; i <= boardSize; ++i) {
				dictionary[i] = pos + "rem";
				pos += pieceSize;
			}

			let countPieces = 0;
			let countTiles = 0;

			for (let row = 0; row < boardSize; ++row) {
				for (let column = 0; column < boardSize; ++column) {
					const piece = this.board[row][column];
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
					if (piece == 1) {
						countPieces = this.playerPiecesRender(1, row, column, countPieces);
					} else if (piece == 2) {
						countPieces = this.playerPiecesRender(2, row, column, countPieces);
					} else if (piece == 3) {
						countPieces = this.playerPiecesRender(
							1,
							row,
							column,
							countPieces,
							true
						);
					} else if (piece == 4) {
						countPieces = this.playerPiecesRender(
							2,
							row,
							column,
							countPieces,
							true
						);
					}
				}
			}
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
			this.tilesElement.append(
				"<div class='tile' id='tile" +
					countTiles +
					"' style='top:" +
					this.dictionary[row] +
					";left:" +
					this.dictionary[column] +
					";'></div>"
			);
			tiles[countTiles] = new Tile($("#tile" + countTiles), [
				parseInt(row),
				parseInt(column)
			]);
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
		 * @return {int} number of pieces
		 */
		playerPiecesRender: function(
			playerNumber,
			row,
			column,
			countPieces,
			testInitKing
		) {
			$(`.player${playerNumber}pieces`).append(
				"<div class='piece' id='" +
					countPieces +
					"' style='top:" +
					this.dictionary[row] +
					";left:" +
					this.dictionary[column] +
					";'></div>"
			);
			pieces[countPieces] = new Piece(
				$("#" + countPieces),
				[parseInt(row), parseInt(column)],
				playerNumber,
				testInitKing
			);
			return countPieces + 1;
		},

		/**
		 * Check if the location has an object
		 *
		 * @param {int} row
		 * @param {int} column
		 * @return {boolean}
		 */
		isInBoundaries: function(row, column) {
			return row >= 0 && row < boardSize && column >= 0 && column < boardSize;
		},

		/**
		 * Check if the location has an object
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
		changePlayerTurn: function() {
			if (this.playerTurn == 1) {
				this.playerTurn = 2;
				$(".turn").css(
					"background",
					"linear-gradient(to right, transparent 50%, #BEEE62 50%)"
				);
			} else {
				this.playerTurn = 1;
				$(".turn").css(
					"background",
					"linear-gradient(to right, #BEEE62 50%, transparent 50%)"
				);
			}
			this.check_if_jump_exist();
			return;
		},
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
		 * Reset the game
		 */
		clear: function() {
			location.reload();
		},

		/**
		 * Check if jump exists
		 */
		check_if_jump_exist: function() {
			this.jumpexist = false;
			this.continuousjump = false;
			for (const k of pieces) {
				k.allowedtomove = false;
				// if jump exist, only set those "jump" pieces "allowed to move"
				if (
					k.position.length != 0 &&
					k.player == this.playerTurn &&
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
		},

		/**
		 * Possibly helpful for communication with back-end
		 * @return {string}
		 */
		str_board: function() {
			let ret = "";
			for (let row = 0; row < boardSize; ++row) {
				for (let column = 0; column < boardSize; ++column) {
					const piece = this.board[row][column];
					let found = false;
					for (const k of pieces) {
						if (k.position[0] == row && k.position[1] == column) {
							if (k.king) ret += piece + 2;
							else ret += piece;
							found = true;
							break;
						}
					}
					if (!found) {
						ret += "0";
					}
				}
			}
			return ret;
		}
	};

	// Initialize the board
	Board.initalize();

	/** *
  Events
  ***/

	/**
	 * Select the piece on click if it is the player's turn
	 */
	$(".piece").on("click", function() {
		let selected;
		const isPlayersTurn =
			$(this)
				.parent()
				.attr("class")
				.split(" ")[0] ==
			"player" + Board.playerTurn + "pieces";
		if (isPlayersTurn) {
			if (!Board.continuousjump && pieces[$(this).attr("id")].allowedtomove) {
				if ($(this).hasClass("selected")) selected = true;
				$(".piece").each(function(index) {
					$(".piece")
						.eq(index)
						.removeClass("selected");
				});
				if (!selected) {
					$(this).addClass("selected");
				}
			} else {
				const exist =
					"jump exist for other pieces, that piece is not allowed to move";
				const continuous =
					"continuous jump exist, you have to jump the same piece";
				const message = !Board.continuousjump ? exist : continuous;
				console.log(message);
			}
		}
	});

	/**
	 * Reset game when clear button is pressed
	 */
	$("#cleargame").on("click", function() {
		Board.clear();
	});

	/**
	 * Move piece when tile is clicked
	 */
	$(".tile").on("click", function() {
		// make sure a piece is selected
		if ($(".selected").length != 0) {
			// find the tile object being clicked
			const tileID = $(this)
				.attr("id")
				.replace(/tile/, "");
			const tile = tiles[tileID];
			// find the piece being selected
			const piece = pieces[$(".selected").attr("id")];
			// check if the tile is in range from the object
			const inRange = tile.inRange(piece);
			if (inRange != "wrong") {
				// if the move needed is jump, then move it but also check if another
				// move can be made (double and triple jumps)
				if (inRange == "jump") {
					if (piece.opponentJump(tile)) {
						piece.move(tile, true);
						if (piece.canJumpAny()) {
							// change back to original since another turn can be made
							//  Board.changePlayerTurn();
							piece.element.addClass("selected");
							// exist continuous jump, you are not allowed to de-select this
							// piece or select other pieces
							Board.continuousjump = true;
						} else {
							Board.changePlayerTurn();
						}
					}
					// if it's regular then move it if no jumping is available
				} else if (inRange == "regular" && !Board.jumpexist) {
					if (!piece.canJumpAny()) {
						piece.move(tile);
						Board.changePlayerTurn();
					} else {
						alert("Si un pion peut être capturé, vous devez le faire !");
					}
				}
			}
		}
	});
};
