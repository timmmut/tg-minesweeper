// Игровые настройки по уровням сложности
const DIFFICULTY_SETTINGS = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

// Игровые состояния
const GAME_STATES = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    WIN: 'win'
};

// Инициализация основных переменных
let gameState = GAME_STATES.WAITING;
let currentDifficulty = 'easy';
let board = [];
let minesCount;
let timer;
let seconds = 0;
let firstClick = true;

// DOM элементы
const gameBoard = document.getElementById('game-board');
const newGameBtn = document.getElementById('new-game-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const minesCountDisplay = document.getElementById('mines-count');
const timerDisplay = document.getElementById('timer');

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeGame(currentDifficulty);
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка новой игры
    newGameBtn.addEventListener('click', function() {
        initializeGame(currentDifficulty);
    });
    
    // Кнопки сложности
    difficultyBtns.forEach(button => {
        button.addEventListener('click', function() {
            difficultyBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentDifficulty = this.dataset.difficulty;
            initializeGame(currentDifficulty);
        });
    });
}

// Инициализация игры с заданной сложностью
function initializeGame(difficulty) {
    // Сброс состояния игры
    stopTimer();
    seconds = 0;
    timerDisplay.textContent = '0';
    firstClick = true;
    gameState = GAME_STATES.WAITING;
    
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const { rows, cols, mines } = settings;
    
    // Установка счетчика мин
    minesCount = mines;
    minesCountDisplay.textContent = minesCount;
    
    // Настройка стилей игрового поля
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    // Создание пустой сетки
    board = [];
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i][j] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                row: i,
                col: j
            };
        }
    }
    
    // Отрисовка игрового поля
    renderBoard();
}

// Отрисовка игрового поля
function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];
            const cellElement = document.createElement('div');
            
            cellElement.className = 'cell';
            cellElement.dataset.row = row;
            cellElement.dataset.col = col;
            
            if (cell.isRevealed) {
                cellElement.classList.add('revealed');
                
                if (cell.isMine) {
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣';
                } else if (cell.neighborMines > 0) {
                    cellElement.textContent = cell.neighborMines;
                    cellElement.dataset.mines = cell.neighborMines;
                }
            } else if (cell.isFlagged) {
                cellElement.classList.add('flagged');
                cellElement.textContent = '🚩';
            }
            
            // Переменные для обработки долгого нажатия
            let pressTimer;
            let longPressTriggered = false;
            
            // Обработчик начала нажатия
            cellElement.addEventListener('mousedown', function(e) {
                if (e.button === 0) { // Только для левой кнопки мыши
                    pressTimer = setTimeout(function() {
                        longPressTriggered = true;
                        toggleFlag(row, col);
                    }, 1500); // 1.5 секунды
                }
            });
            
            // Обработчик отпускания кнопки мыши
            cellElement.addEventListener('mouseup', function(e) {
                clearTimeout(pressTimer);
                if (!longPressTriggered && e.button === 0) {
                    handleCellClick(row, col);
                }
                longPressTriggered = false;
            });
            
            // Обработчик выхода курсора за пределы элемента
            cellElement.addEventListener('mouseout', function() {
                clearTimeout(pressTimer);
                longPressTriggered = false;
            });
            
            // Для мобильных устройств
            cellElement.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(function() {
                    longPressTriggered = true;
                    toggleFlag(row, col);
                }, 1500); // 1.5 секунды
            });
            
            cellElement.addEventListener('touchend', function(e) {
                clearTimeout(pressTimer);
                if (!longPressTriggered) {
                    handleCellClick(row, col);
                }
                longPressTriggered = false;
                e.preventDefault(); // Предотвращаем двойные события
            });
            
            cellElement.addEventListener('touchmove', function(e) {
                clearTimeout(pressTimer);
                longPressTriggered = false;
            });
            
            // Обработчик правой кнопки мыши (контекстное меню)
            cellElement.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                if (gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.WAITING) {
                    toggleFlag(row, col);
                }
            });
            
            gameBoard.appendChild(cellElement);
        }
    }
}

// Обработка клика по ячейке
function handleCellClick(row, col) {
    const cell = board[row][col];
    
    // Если игра не началась или закончилась, или ячейка уже открыта или помечена флагом - выходим
    if (gameState === GAME_STATES.GAME_OVER || gameState === GAME_STATES.WIN || 
        cell.isRevealed || cell.isFlagged) {
        return;
    }
    
    // Если это первый клик - запускаем игру
    if (firstClick) {
        startGame(row, col);
        return;
    }
    
    // Открываем ячейку
    revealCell(row, col);
    
    // Проверяем условия проигрыша и победы
    if (cell.isMine) {
        gameOver();
    } else {
        checkWinCondition();
    }
}

// Запуск игры после первого клика
function startGame(row, col) {
    firstClick = false;
    gameState = GAME_STATES.PLAYING;
    
    // Размещение мин (избегая первого клика)
    placeMines(row, col);
    
    // Подсчет мин у соседей
    calculateNeighborMines();
    
    // Открываем первую ячейку
    revealCell(row, col);
    
    // Запуск таймера
    startTimer();
    
    // Проверяем условие победы (на случай, если открыли большой пустой участок сразу)
    checkWinCondition();
}

// Размещение мин на поле
function placeMines(safeRow, safeCol) {
    const { mines } = DIFFICULTY_SETTINGS[currentDifficulty];
    const rows = board.length;
    const cols = board[0].length;
    
    let placedMines = 0;
    
    while (placedMines < mines) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);
        
        // Проверяем, что это не первая выбранная ячейка и не соседняя с ней
        const isSafeArea = Math.abs(randomRow - safeRow) <= 1 && Math.abs(randomCol - safeCol) <= 1;
        
        // Если это не первая выбранная ячейка и здесь еще нет мины
        if (!isSafeArea && !board[randomRow][randomCol].isMine) {
            board[randomRow][randomCol].isMine = true;
            placedMines++;
        }
    }
}

// Подсчет мин у соседей
function calculateNeighborMines() {
    const rows = board.length;
    const cols = board[0].length;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].isMine) continue;
            
            let count = 0;
            
            // Проверяем всех 8 соседей
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    
                    const newRow = row + i;
                    const newCol = col + j;
                    
                    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                        if (board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
            }
            
            board[row][col].neighborMines = count;
        }
    }
}

// Открытие ячейки
function revealCell(row, col) {
    const cell = board[row][col];
    
    // Если ячейка уже открыта или помечена флагом - выходим
    if (cell.isRevealed || cell.isFlagged) return;
    
    // Открываем ячейку
    cell.isRevealed = true;
    
    // Если это пустая ячейка, открываем соседние
    if (cell.neighborMines === 0 && !cell.isMine) {
        const rows = board.length;
        const cols = board[0].length;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }
    
    // Вибрация при нажатии на ячейку с миной или с цифрой
    if (window.telegramAPI && cell.isMine) {
        window.telegramAPI.vibrate('error');
    } else if (window.telegramAPI && cell.neighborMines > 0) {
        window.telegramAPI.vibrate('success');
    }
    
    // Обновляем отображение
    renderBoard();
}

// Установка/снятие флага
function toggleFlag(row, col) {
    const cell = board[row][col];
    
    // Если ячейка уже открыта - выходим
    if (cell.isRevealed) return;
    
    // Устанавливаем/снимаем флаг
    cell.isFlagged = !cell.isFlagged;
    
    // Обновляем счетчик мин
    minesCount += cell.isFlagged ? -1 : 1;
    minesCountDisplay.textContent = minesCount;
    
    // Вибрация при установке/снятии флага
    if (window.telegramAPI) {
        window.telegramAPI.vibrate('success');
    }
    
    // Обновляем отображение
    renderBoard();
    
    // Проверяем условие победы
    checkWinCondition();
}

// Проверка условия победы
function checkWinCondition() {
    const rows = board.length;
    const cols = board[0].length;
    const totalCells = rows * cols;
    const totalMines = DIFFICULTY_SETTINGS[currentDifficulty].mines;
    
    let revealedCount = 0;
    let correctFlagsCount = 0;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = board[row][col];
            
            if (cell.isRevealed && !cell.isMine) {
                revealedCount++;
            }
            
            if (cell.isFlagged && cell.isMine) {
                correctFlagsCount++;
            }
        }
    }
    
    // Побеждаем, если открыты все безопасные ячейки или все мины помечены флагами
    if (revealedCount === totalCells - totalMines || correctFlagsCount === totalMines) {
        gameState = GAME_STATES.WIN;
        stopTimer();
        
        // Помечаем все мины флагами (для отображения)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (board[row][col].isMine && !board[row][col].isFlagged) {
                    board[row][col].isFlagged = true;
                }
            }
        }
        
        renderBoard();
        setTimeout(() => alert('Поздравляем! Вы выиграли!'), 300);
    }
}

// Проигрыш - открываем все мины
function gameOver() {
    gameState = GAME_STATES.GAME_OVER;
    stopTimer();
    
    // Открываем все мины
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];
            
            if (cell.isMine) {
                cell.isRevealed = true;
            }
            
            // Отмечаем неправильно установленные флаги
            if (cell.isFlagged && !cell.isMine) {
                cell.isFlagged = false;
                cell.isRevealed = true;
            }
        }
    }
    
    renderBoard();
    setTimeout(() => alert('Игра окончена! Вы проиграли.'), 300);
}

// Запуск таймера
function startTimer() {
    if (timer) {
        stopTimer();
    }
    
    seconds = 0;
    timerDisplay.textContent = seconds;
    
    timer = setInterval(() => {
        seconds++;
        timerDisplay.textContent = seconds;
    }, 1000);
}

// Остановка таймера
function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
} 