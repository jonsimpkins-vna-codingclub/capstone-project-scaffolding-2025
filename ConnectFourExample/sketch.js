const COLS = 7;
const ROWS = 6;
let cellSize; // Size of each cell in pixels
let board = [];

let currentPlayer = 1; // 1 for Red, 2 for Yellow
let gameOver = false;
let winner = 0; // 0 = no winner yet, 1 = Player 1, 2 = Player 2, 3 = Draw

// Colors
let emptyColor;
let player1Color;
let player2Color;
let boardColor;

// DOM Elements
let turnIndicator;
let winnerMessage;
let resetButton;
let canvasContainer;

function setup() {
    canvasContainer = select('#canvas-container');
    let canvasWidth = min(windowWidth * 0.8, 560);
    cellSize = floor(canvasWidth / COLS);
    let canvasHeight = cellSize * ROWS;

    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(canvasContainer);

    // Initialize colors
    emptyColor = color(255);
    player1Color = color(255, 0, 0);
    player2Color = color(255, 204, 0);
    boardColor = color(0, 0, 200);

    // Get references to HTML elements
    turnIndicator = select('#turn-indicator');
    winnerMessage = select('#winner-message');
    resetButton = select('#reset-button');
    resetButton.mousePressed(resetGame);

    // Don't call resetGame() here yet, p5 elements might not be ready
    // Call it at the end of setup or rely on the initial draw cycle.
    // Let's explicitly call it at the end.
    resetGame();
}

function draw() {
    background(240);
    drawBoard();
    drawPieces();

    // Update messages regardless of game state (it handles clearing/setting)
    updateMessages();

    if (!gameOver) {
        drawHoverPreview();
        updateTurnIndicator(); // Only update turn indicator if game is running
    } else {
        // Ensure turn indicator is cleared when game is over
        turnIndicator.html('&nbsp;');

        // *** FIX: Stop the loop AFTER drawing the final frame ***
        noLoop(); // Stop draw() from looping further now that final state is drawn
    }
}

function resetGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    currentPlayer = 1;
    gameOver = false;
    winner = 0;
    winnerMessage.html('');
    // *** FIX: Pass classes as separate arguments ***
    winnerMessage.removeClass('player1-color', 'player2-color', 'draw-color');
    resetButton.hide();

    loop();
    updateTurnIndicator();
    redraw();
}


function drawBoard() {
    noStroke();
    fill(boardColor);
    rect(0, 0, width, height);

    fill(emptyColor);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let x = c * cellSize + cellSize / 2;
            let y = r * cellSize + cellSize / 2;
            ellipse(x, y, cellSize * 0.85, cellSize * 0.85);
        }
    }
}

function drawPieces() {
    noStroke();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] !== 0) {
                fill(board[r][c] === 1 ? player1Color : player2Color);
                let x = c * cellSize + cellSize / 2;
                let y = r * cellSize + cellSize / 2;
                ellipse(x, y, cellSize * 0.85, cellSize * 0.85);
            }
        }
    }
}

function drawHoverPreview() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let col = floor(mouseX / cellSize);
        if (col >= 0 && col < COLS) {
             if (isColumnAvailable(col)) {
                let previewX = col * cellSize + cellSize / 2;
                let previewY = cellSize / 2;
                let previewColor = (currentPlayer === 1) ? player1Color : player2Color;
                previewColor.setAlpha(150);
                fill(previewColor);
                noStroke();
                ellipse(previewX, previewY - (cellSize * 0.7), cellSize * 0.80, cellSize * 0.80);
                previewColor.setAlpha(255);
            }
        }
    }
}


function mousePressed() {
    // Check if the click is within the canvas bounds
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        // Only handle clicks if the game is not over
        if (!gameOver) {
            let col = floor(mouseX / cellSize);
            if (col >= 0 && col < COLS) {
                if (dropPiece(col)) {
                    // If a piece was successfully dropped, force a redraw immediately
                    // This makes the piece appear instantly without waiting for the next draw cycle.
                    redraw();
                }
            }
        }
    }
     // No explicit restart on click here - rely on the button.
     // If you wanted any click to restart when game over, add:
     // else if (gameOver) {
     //    resetGame();
     // }
}


function dropPiece(col) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            board[r][col] = currentPlayer;

            if (checkWin(currentPlayer, r, col)) {
                gameOver = true;
                winner = currentPlayer;
                // Don't call updateMessages or noLoop here. Let draw() handle it.
            } else if (checkDraw()) {
                gameOver = true;
                winner = 3; // Draw
                // Don't call updateMessages or noLoop here. Let draw() handle it.
            } else {
                // Only switch player if the game didn't end
                switchPlayer();
            }
            return true; // Piece dropped
        }
    }
    return false; // Column full
}

function switchPlayer() {
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    // Update turn indicator is now handled in draw() loop or resetGame()
}

function isColumnAvailable(col) {
    return board[0][col] === 0;
}

function checkWin(player, lastRow, lastCol) {
    // Check Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            if (board[r][c] === player &&
                board[r][c + 1] === player &&
                board[r][c + 2] === player &&
                board[r][c + 3] === player) {
                return true;
            }
        }
    }
    // Check Vertical
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === player &&
                board[r + 1][c] === player &&
                board[r + 2][c] === player &&
                board[r + 3][c] === player) {
                return true;
            }
        }
    }
    // Check Diagonal (Positive Slope /)
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            if (board[r][c] === player &&
                board[r - 1][c + 1] === player &&
                board[r - 2][c + 2] === player &&
                board[r - 3][c + 3] === player) {
                return true;
            }
        }
    }
    // Check Diagonal (Negative Slope \)
    for (let r = 0; r <= ROWS - 4; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
            if (board[r][c] === player &&
                board[r + 1][c + 1] === player &&
                board[r + 2][c + 2] === player &&
                board[r + 3][c + 3] === player) {
                return true;
            }
        }
    }
    return false;
}

function checkDraw() {
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === 0) {
            return false;
        }
    }
    return true;
}

// This function now ONLY updates the DOM elements based on game state
// It does not control the loop anymore.
function updateMessages() {
    if (gameOver) {
        if (winner === 3) { // Draw
            winnerMessage.html('It\'s a Draw!');
            winnerMessage.class('draw-color');
            // *** FIX: Pass classes as separate arguments ***
            winnerMessage.removeClass('player1-color', 'player2-color'); // Remove player colors if draw
        } else { // Win
            let winnerName = `Player ${winner}`;
            let winnerColorName = (winner === 1) ? 'Red' : 'Yellow';
            let winnerClass = (winner === 1) ? 'player1-color' : 'player2-color';
            winnerMessage.html(`${winnerName} (<span class="${winnerClass}">${winnerColorName}</span>) Wins!`);
            winnerMessage.class(winnerClass);
            winnerMessage.removeClass('draw-color'); // Remove draw class if win
             // Ensure other player class is removed
            if (winner === 1) {
                 winnerMessage.removeClass('player2-color');
            } else {
                 winnerMessage.removeClass('player1-color');
            }
        }
        resetButton.show();
        // Turn indicator is cleared within draw() when gameOver is true
    } else {
         // Ensure messages/button are reset if game is ongoing
         winnerMessage.html('');
         // *** FIX: Pass classes as separate arguments ***
         winnerMessage.removeClass('player1-color', 'player2-color', 'draw-color');
         resetButton.hide();
    }
}


function updateTurnIndicator() {
    // This should only be called when the game is NOT over.
    if (!gameOver) {
        let playerName = `Player ${currentPlayer}`;
        let playerColorName = (currentPlayer === 1) ? 'Red' : 'Yellow';
        let playerClass = (currentPlayer === 1) ? 'player1-color' : 'player2-color';
        turnIndicator.html(`${playerName}'s Turn (<span class="${playerClass}">${playerColorName}</span>)`);
    }
}


function windowResized() {
  let canvasWidth = min(windowWidth * 0.8, 560);
  cellSize = floor(canvasWidth / COLS);
  let canvasHeight = cellSize * ROWS;
  resizeCanvas(canvasWidth, canvasHeight);
  // *** FIX: Ensure redraw() is called to update view after resize ***
  // This is important especially if the loop was stopped (game over)
  redraw();
}
