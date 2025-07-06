document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chessboard = document.getElementById('chessboard');
    const startStopBtn = document.getElementById('startStopBtn');
    const speedControls = document.getElementById('speedControls');
    const soundToggle = document.getElementById('soundToggle');
    const guideToggle = document.getElementById('guideToggle');
    const arrowContainer = document.getElementById('arrow-container');

    // --- Sound Synthesis ---
    const moveSound = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.1 }
    }).toDestination();

    // --- Constants ---
    const BOARD_SIZE = 8;
    const KNIGHT_MOVES = [
        [1, 2], [1, -2], [-1, 2], [-1, -2],
        [2, 1], [2, -1], [-2, 1], [-2, -1]
    ];

    // --- State Variables ---
    let boardState = [];
    let knightPosition = { x: 0, y: 0 };
    let simulationInterval;
    let isRunning = false;
    let isSoundOn = false;
    let isGuideOn = false;
    let currentSpeed = 2000;

    function init() {
        createBoard();
        setupEventListeners();
        resetSimulation();
    }

    function createBoard() {
        chessboard.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.dataset.x = col;
                square.dataset.y = row;
                if ((row + col) % 2 === 0) square.classList.add('brown');
                else square.classList.add('black');
                chessboard.appendChild(square);
            }
        }
    }

    function setupEventListeners() {
        startStopBtn.addEventListener('click', toggleSimulation);
        speedControls.addEventListener('click', handleSpeedChange);
        soundToggle.addEventListener('change', (e) => isSoundOn = e.target.checked);
        guideToggle.addEventListener('change', (e) => {
            isGuideOn = e.target.checked;
            updateGuideArrowVisibility();
        });
    }

    function resetSimulation() {
        boardState = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
        knightPosition.x = Math.floor(Math.random() * BOARD_SIZE);
        knightPosition.y = Math.floor(Math.random() * BOARD_SIZE);
        boardState[knightPosition.y][knightPosition.x] = 1;
        updateBoardUI();
    }

    function toggleSimulation() {
        isRunning = !isRunning;
        if (isRunning) {
            if (isSoundOn) Tone.start();
            startStopBtn.textContent = 'Stop';
            startStopBtn.classList.replace('bg-blue-600', 'bg-red-600');
            startStopBtn.classList.replace('hover:bg-blue-700', 'hover:bg-red-700');
            simulationInterval = setInterval(moveKnight, currentSpeed);
        } else {
            startStopBtn.textContent = 'Start';
            startStopBtn.classList.replace('bg-red-600', 'bg-blue-600');
            startStopBtn.classList.replace('hover:bg-red-700', 'hover:bg-blue-700');
            clearInterval(simulationInterval);
        }
        updateGuideArrowVisibility();
    }

    function handleSpeedChange(event) {
        if (event.target.classList.contains('speed-btn')) {
            document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            currentSpeed = 2000 / parseInt(event.target.dataset.speed, 10);
            if (isRunning) {
                clearInterval(simulationInterval);
                simulationInterval = setInterval(moveKnight, currentSpeed);
            }
        }
    }

    function moveKnight() {
        const nextMove = findNextMove(knightPosition.x, knightPosition.y);
        if (nextMove) {
            if (isSoundOn) moveSound.triggerAttackRelease("A5", "64n");
            knightPosition.x = nextMove.x;
            knightPosition.y = nextMove.y;
            boardState[knightPosition.y][knightPosition.x]++;
            updateBoardUI();
        } else {
            toggleSimulation();
            console.log("Tour ended. No more valid moves.");
        }
    }

    function findNextMove(x, y) {
        const possibleMoves = getValidMoves(x, y);
        if (possibleMoves.length === 0) return null;
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

    function getValidMoves(x, y) {
        return KNIGHT_MOVES.map(move => ({ x: x + move[0], y: y + move[1] }))
            .filter(pos => pos.x >= 0 && pos.x < BOARD_SIZE && pos.y >= 0 && pos.y < BOARD_SIZE && boardState[pos.y][pos.x] === 0);
    }

    function updateBoardUI() {
        document.querySelectorAll('.square').forEach(square => {
            const x = parseInt(square.dataset.x, 10);
            const y = parseInt(square.dataset.y, 10);
            square.innerHTML = '';
            square.classList.remove('visited-once', 'visited-twice');
            const visitCount = boardState[y][x];
            if (visitCount === 1) square.classList.add('visited-once');
            else if (visitCount > 1) square.classList.add('visited-twice');
            if (x === knightPosition.x && y === knightPosition.y) {
                square.innerHTML = '<span class="knight">♞</span>';
            }
        });
        updateGuideArrowVisibility();
    }
    
    function updateGuideArrowVisibility() {
        clearGuideArrow();
        if (isGuideOn && isRunning) {
            const nextMove = findNextMove(knightPosition.x, knightPosition.y);
            if (nextMove) {
                drawGuideArrow(knightPosition, nextMove);
            }
        }
    }

    function clearGuideArrow() {
        arrowContainer.innerHTML = '';
    }

    function drawGuideArrow(from, to) {
        const squareSize = chessboard.offsetWidth / BOARD_SIZE;
        const startX = (from.x + 0.5) * squareSize;
        const startY = (from.y + 0.5) * squareSize;
        const endX = (to.x + 0.5) * squareSize;
        const endY = (to.y + 0.5) * squareSize;

        const dx = to.x - from.x;
        
        // Determine the corner point of the "L" for a sharp 90-degree angle
        let cornerX, cornerY;
        if (Math.abs(dx) === 2) { // Move is 2 horizontal, 1 vertical
            // The corner is at the end of the horizontal leg
            cornerX = endX;
            cornerY = startY;
        } else { // Move is 1 horizontal, 2 vertical
            // The corner is at the end of the vertical leg
            cornerX = startX;
            cornerY = endY;
        }
        
        // Create the two segments of the L
        createArrowSegment(startX, startY, cornerX, cornerY);
        createArrowSegment(cornerX, cornerY, endX, endY, true); // Add arrowhead to the second segment
    }

    function createArrowSegment(x1, y1, x2, y2, hasHead = false) {
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        const segment = document.createElement('div');
        segment.classList.add('arrow-segment');
        segment.style.width = `${length}px`;
        segment.style.left = `${x1}px`;
        segment.style.top = `${y1 - 3}px`; // Center the line vertically
        segment.style.transform = `rotate(${angle}deg)`;
        arrowContainer.appendChild(segment);

        if (hasHead) {
            const head = document.createElement('div');
            head.classList.add('arrow-head');
            head.style.left = `${x2}px`;
            head.style.top = `${y2}px`;
            // Position head correctly at the end of the line
            head.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            arrowContainer.appendChild(head);
        }
    }

    init();
});
