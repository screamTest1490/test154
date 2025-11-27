class AutoMinesGame {
    constructor() {
        this.players = [];
        this.visualBots = [];
        this.mine = null;
        this.userBalance = 10;
        this.currentPlayerCell = null;
        this.isGameActive = false;
        this.roundTimer = null;
        this.timeLeft = 10;
        this.botAddTimers = [];
        this.autoCloseTimer = null;
        
        this.botNames = ['Игрок1', 'Игрок2', 'Игрок3', 'Игрок4', 'Игрок5'];
        this.botBets = [1, 2, 3, 5];
        
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateUI();
        this.startRoundTimer();
        this.scheduleBotAdditions();
    }

    createGrid() {
        const grid = document.getElementById('gameGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.innerHTML = `<span>${i}</span>`;
            cell.dataset.cell = i;
            cell.addEventListener('click', () => this.selectCell(i));
            grid.appendChild(cell);
        }
    }

    selectCell(cellNumber) {
        if (this.isGameActive) return;
        
        this.currentPlayerCell = cellNumber;
        this.updateCellSelectionUI();
    }

    updateCellSelectionUI() {
        const selectedCellElement = document.getElementById('selectedCell');
        if (selectedCellElement) {
            selectedCellElement.textContent = this.currentPlayerCell ? this.currentPlayerCell : '-';
        }
        
        document.querySelectorAll('.cell').forEach(cell => {
            const cellNum = parseInt(cell.dataset.cell);
            cell.classList.toggle('selected', cellNum === this.currentPlayerCell);
        });
    }

    placeBet() {
        if (this.isGameActive) {
            return;
        }
        
        const betInput = document.getElementById('playerBet');
        const bet = parseInt(betInput.value);
        
        if (!bet || bet < 1) {
            return;
        }
        
        if (bet > this.userBalance) {
            return;
        }
        
        if (!this.currentPlayerCell) {
            return;
        }
        
        const userAlreadyBet = this.players.some(player => player.isUser);
        if (userAlreadyBet) {
            return;
        }
        
        const player = {
            id: Date.now(),
            bet: bet,
            cell: this.currentPlayerCell,
            order: this.players.length + 1,
            isUser: true,
            name: 'Вы'
        };
        
        this.players.push(player);
        this.userBalance -= bet;
        betInput.value = '';
        this.updateCellSelectionUI();
        this.updateUI();
        
        this.cancelScheduledBotAdditions();
    }

    scheduleBotAdditions() {
        this.cancelScheduledBotAdditions();
        
        const botAdditionTimes = [4, 6, 9, 9.5];
        
        botAdditionTimes.forEach((seconds) => {
            const timeUntilAddition = (this.timeLeft - seconds) * 1000;
            if (timeUntilAddition > 0) {
                const timer = setTimeout(() => {
                    if (!this.isGameActive) {
                        this.addSingleVisualBot();
                    }
                }, timeUntilAddition);
                
                this.botAddTimers.push(timer);
            }
        });
    }

    cancelScheduledBotAdditions() {
        this.botAddTimers.forEach(timer => clearTimeout(timer));
        this.botAddTimers = [];
    }

    addSingleVisualBot() {
        const availableCells = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const usedCells = [...this.players, ...this.visualBots].map(p => p.cell);
        const freeCells = availableCells.filter(cell => !usedCells.includes(cell));
        
        if (freeCells.length === 0) return;
        
        const randomCell = freeCells[Math.floor(Math.random() * freeCells.length)];
        const randomBet = this.botBets[Math.floor(Math.random() * this.botBets.length)];
        const randomName = this.botNames[Math.floor(Math.random() * this.botNames.length)];
        
        const bot = {
            id: Date.now(),
            bet: randomBet,
            cell: randomCell,
            order: this.getTotalPlayersCount() + 1,
            isUser: false,
            name: randomName,
            isVisualBot: true
        };
        
        this.visualBots.push(bot);
        this.updateUI();
    }

    getTotalPlayersCount() {
        return this.players.length + this.visualBots.length;
    }

    startRoundTimer() {
        this.timeLeft = 10;
        this.updateTimer();
        
        this.roundTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.roundTimer);
                this.startGame();
            }
        }, 1000);
    }

    updateTimer() {
        const timerElement = document.getElementById('roundTimer');
        if (timerElement) {
            timerElement.textContent = `${this.timeLeft}с`;
            
            if (this.timeLeft <= 3) {
                timerElement.style.color = 'var(--accent)';
                timerElement.style.textShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
            } else {
                timerElement.style.color = 'var(--warning)';
                timerElement.style.textShadow = '0 0 10px rgba(255, 165, 0, 0.5)';
            }
        }
    }

    startGame() {
        this.cancelScheduledBotAdditions();
        
        // Игра начинается ВСЕГДА
        if (this.getTotalPlayersCount() === 0) {
            // Добавляем несколько ботов для демонстрации
            for (let i = 0; i < 3; i++) {
                this.addSingleVisualBot();
            }
        }
        
        this.isGameActive = true;
        this.generateMine();
        this.playGameAnimation();
    }

    playGameAnimation() {
        const cells = document.querySelectorAll('.cell');
        
        let flashes = 0;
        const flashInterval = setInterval(() => {
            const randomCell = cells[Math.floor(Math.random() * cells.length)];
            randomCell.style.background = 'rgba(255, 255, 255, 0.3)';
            
            setTimeout(() => {
                randomCell.style.background = '';
            }, 200);
            
            flashes++;
            if (flashes >= 8) {
                clearInterval(flashInterval);
                this.revealResults();
            }
        }, 300);
    }

    revealResults() {
        this.calculateResults();
        this.highlightCells();
        
        setTimeout(() => {
            this.showResultsAnimation();
        }, 2000);
    }

    generateMine() {
        // Если играют только боты, выбираем случайную ячейку из 9
        if (this.players.length === 0) {
            this.mine = Math.floor(Math.random() * 9) + 1;
            return;
        }
        
        const cellStats = {};
        for (let i = 1; i <= 9; i++) {
            cellStats[i] = { totalBet: 0, players: 0 };
        }
        
        // Учитываем только реальных игроков для алгоритма определения мины
        this.players.forEach(player => {
            cellStats[player.cell].totalBet += player.bet;
            cellStats[player.cell].players += 1;
        });
        
        const usedCells = Object.entries(cellStats)
            .filter(([cell, stats]) => stats.players > 0)
            .map(([cell, stats]) => ({
                cell: parseInt(cell),
                totalBet: stats.totalBet,
                players: stats.players
            }));
        
        if (usedCells.length === 1) {
            this.mine = usedCells[0].cell;
        } else if (usedCells.length === 2) {
            const cell1 = usedCells[0];
            const cell2 = usedCells[1];
            
            const ratio1 = cell1.totalBet / cell2.totalBet;
            const ratio2 = cell2.totalBet / cell1.totalBet;
            
            if (ratio1 <= 2 && ratio2 <= 2) {
                this.mine = cell1.totalBet < cell2.totalBet ? cell1.cell : cell2.cell;
            } else {
                this.mine = cell1.totalBet > cell2.totalBet ? cell1.cell : cell2.cell;
            }
        } else {
            const minPlayers = Math.min(...usedCells.map(cell => cell.players));
            const leastPopularCells = usedCells.filter(cell => cell.players === minPlayers);
            
            const randomIndex = Math.floor(Math.random() * leastPopularCells.length);
            this.mine = leastPopularCells[randomIndex].cell;
        }
    }

    calculateResults() {
        // Определяем победителей среди реальных игроков
        const winners = this.players.filter(player => player.cell !== this.mine);
        const losers = this.players.filter(player => player.cell === this.mine);
        
        winners.forEach(winner => {
            const bonus = winner.bet * 0.25;
            winner.payout = winner.bet + bonus;
            winner.netResult = bonus;
            
            if (winner.isUser) {
                this.userBalance += winner.payout;
                this.userResult = { win: true, amount: bonus };
            }
        });
        
        losers.forEach(loser => {
            loser.payout = 0;
            loser.netResult = -loser.bet;
            if (loser.isUser) {
                this.userResult = { win: false, amount: -loser.bet };
            }
        });
    }

    highlightCells() {
        document.querySelectorAll('.cell').forEach(cell => {
            const cellNum = parseInt(cell.dataset.cell);
            cell.classList.remove('selected');
            cell.classList.add('revealing');
            
            setTimeout(() => {
                if (cellNum === this.mine) {
                    cell.classList.add('mine');
                    cell.innerHTML = '💣<br><small>' + cellNum + '</small>';
                } else {
                    cell.classList.add('safe');
                    cell.innerHTML = '💰<br><small>' + cellNum + '</small>';
                }
                
                setTimeout(() => {
                    cell.classList.remove('revealing');
                }, 600);
            }, 100);
        });
    }

    showResultsAnimation() {
        const userPlayer = this.players.find(p => p.isUser);
        
        // Если играли только боты, сразу переходим к следующему раунду
        if (!userPlayer) {
            this.nextRound();
            return;
        }
        
        const animation = document.getElementById('resultsAnimation');
        const content = document.getElementById('animationContent');
        
        if (!animation || !content) return;
        
        const isWinner = userPlayer.cell !== this.mine;
        
        if (isWinner) {
            const bonus = userPlayer.bet * 0.25;
            content.innerHTML = `
                <div class="win-animation">🎉</div>
                <div class="result-text">ВЫ ВЫИГРАЛИ!</div>
                <div class="result-amount win-amount">+${bonus.toFixed(2)} TON</div>
                <div class="auto-close-notice">Автоматическое продолжение через 3 секунды</div>
                <button class="continue-btn" onclick="game.nextRound()">ПРОДОЛЖИТЬ</button>
            `;
        } else {
            content.innerHTML = `
                <div class="lose-animation">💥</div>
                <div class="result-text">ВЫ ПРОИГРАЛИ</div>
                <div class="result-amount lose-amount">-${userPlayer.bet} TON</div>
                <div class="auto-close-notice">Автоматическое продолжение через 3 секунды</div>
                <button class="continue-btn" onclick="game.nextRound()">ПРОДОЛЖИТЬ</button>
            `;
        }
        
        animation.classList.add('active');
        
        this.autoCloseTimer = setTimeout(() => {
            this.nextRound();
        }, 3000);
    }

    nextRound() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        
        const animation = document.getElementById('resultsAnimation');
        if (animation) {
            animation.classList.remove('active');
        }
        
        this.players = [];
        this.visualBots = [];
        this.mine = null;
        this.currentPlayerCell = null;
        this.isGameActive = false;
        
        this.createGrid();
        this.updateUI();
        
        setTimeout(() => {
            this.startRoundTimer();
            this.scheduleBotAdditions();
        }, 1000);
    }

    updateUI() {
        const userBalanceElement = document.getElementById('userBalance');
        const playersCountElement = document.getElementById('playersCount');
        const placeBetBtn = document.querySelector('.place-bet-btn');
        
        if (userBalanceElement) userBalanceElement.textContent = `${this.userBalance.toFixed(1)} TON`;
        
        const totalPlayers = this.getTotalPlayersCount();
        if (playersCountElement) {
            playersCountElement.innerHTML = `Игроков: <span>${totalPlayers}</span>`;
        }
        
        if (placeBetBtn) {
            placeBetBtn.disabled = this.isGameActive;
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bet = parseInt(e.target.dataset.bet);
                document.getElementById('playerBet').value = bet;
            });
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
}

let game;

document.addEventListener('DOMContentLoaded', function() {
    game = new AutoMinesGame();
    
    window.placeBet = () => game.placeBet();
    window.nextRound = () => game.nextRound();
});