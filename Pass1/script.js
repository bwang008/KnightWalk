document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chessboard = document.getElementById('chessboard');
    const startStopBtn = document.getElementById('startStopBtn');
    const speedControls = document.getElementById('speedControls');

    // --- Constants ---
    const BOARD_SIZE = 8;
    const KNIGHT_MOVES = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1]
    ];

    // --- State Variables ---
    let boardState = []; // 2D array to track visited counts
    let knightPosition = { x: 0, y: 0 };
    let simulationInterval;
    let isRunning = false;
    let currentSpeed = 1000; // Base speed: 1 move per second (1000ms)

    /**
     * Initializes the entire simulation.
     */
    function init() {
        createBoard();
        setupEventListeners();
        resetSimulation();
    }

    /**
     * Creates the chessboard grid and squares in the DOM.
     */
    function createBoard() {
        chessboard.innerHTML = ''; // Clear existing board
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.dataset.x = col;
                square.dataset.y = row;
                // Set alternating colors
                if ((row + col) % 2 === 0) {
                    square.classList.add('brown');
                } else {
                    square.classList.add('black');
                }
                chessboard.appendChild(square);
            }
        }
    }

    /**
     * Sets up event listeners for the control buttons.
     */
    function setupEventListeners() {
        startStopBtn.addEventListener('click', toggleSimulation);
        speedControls.addEventListener('click', handleSpeedChange);
    }

    /**
     * Resets the board state and places the knight randomly.
     */
    function resetSimulation() {
        // Initialize board state with 0s (unvisited)
        boardState = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
        
        // Place knight at a random position
        knightPosition.x = Math.floor(Math.random() * BOARD_SIZE);
        knightPosition.y = Math.floor(Math.random() * BOARD_SIZE);

        // Mark the starting square
        boardState[knightPosition.y][knightPosition.x] = 1;
        updateBoardUI();
    }

    /**
     * Starts or stops the knight's movement.
     */
    function toggleSimulation() {
        isRunning = !isRunning;
        if (isRunning) {
            startStopBtn.textContent = 'Stop';
            startStopBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            startStopBtn.classList.add('bg-red-600', 'hover:bg-red-700');
            simulationInterval = setInterval(moveKnight, currentSpeed);
        } else {
            startStopBtn.textContent = 'Start';
            startStopBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            startStopBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            clearInterval(simulationInterval);
        }
    }

    /**
     * Handles clicks on the speed control buttons.
     */
    function handleSpeedChange(event) {
        if (event.target.classList.contains('speed-btn')) {
            // Update active button style
            document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // Set speed
            const speedMultiplier = parseInt(event.target.dataset.speed, 10);
            currentSpeed = 1000 / speedMultiplier;

            // If running, restart the interval with the new speed
            if (isRunning) {
                clearInterval(simulationInterval);
                simulationInterval = setInterval(moveKnight, currentSpeed);
            }
        }
    }

    /**
     * Calculates and executes the knight's next move using Warnsdorff's rule.
     */
    function moveKnight() {
        const nextMove = findNextMove(knightPosition.x, knightPosition.y);

        if (nextMove) {
            knightPosition.x = nextMove.x;
            knightPosition.y = nextMove.y;
            boardState[knightPosition.y][knightPosition.x]++;
            updateBoardUI();
        } else {
            // No valid moves left, stop the simulation
            toggleSimulation();
            console.log("Tour ended. No more valid moves.");
        }
    }

    /**
     * Implements Warnsdorff's rule to find the best next move.
     * The knight moves to the square with the fewest onward moves.
     */
    function findNextMove(x, y) {
        const possibleMoves = getValidMoves(x, y);
        if (possibleMoves.length === 0) {
            return null;
        }

        let bestMove = null;
        let minOnwardMoves = Infinity;

        for (const move of possibleMoves) {
            const onwardMovesCount = getValidMoves(move.x, move.y).length;
            if (onwardMovesCount < minOnwardMoves) {
                minOnwardMoves = onwardMovesCount;
                bestMove = move;
            }
        }
        return bestMove;
    }

    /**
     * Gets all valid, unvisited moves from a given position.
     * @param {number} x - The current x-coordinate.
     * @param {number} y - The current y-coordinate.
     * @returns {Array<{x: number, y: number}>} - An array of valid moves.
     */
    function getValidMoves(x, y) {
        const validMoves = [];
        for (const move of KNIGHT_MOVES) {
            const newX = x + move[0];
            const newY = y + move[1];

            // Check if the move is within the board and the square hasn't been visited
            if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE && boardState[newY][newX] === 0) {
                validMoves.push({ x: newX, y: newY });
            }
        }
        return validMoves;
    }

    /**
     * Updates the entire chessboard UI based on the current boardState.
     */
    function updateBoardUI() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const x = parseInt(square.dataset.x, 10);
            const y = parseInt(square.dataset.y, 10);

            // Clear previous state classes and knight
            square.innerHTML = '';
            square.classList.remove('visited-once', 'visited-twice');

            // Apply new state classes
            const visitCount = boardState[y][x];
            if (visitCount === 1) {
                square.classList.add('visited-once');
            } else if (visitCount > 1) {
                square.classList.add('visited-twice');
            }

            // Place the knight
            if (x === knightPosition.x && y === knightPosition.y) {
                square.innerHTML = '<span class="knight">♞</span>';
            }
        });
    }

    // --- Start the application ---
    init();
});
