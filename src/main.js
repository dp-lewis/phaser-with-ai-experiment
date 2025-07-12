import Phaser from 'phaser';

const PLAYER_RADIUS = 30;
const PLAYER_Y = 500;
const PLAYER1_X = 150;
const PLAYER2_X = 650;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222',
    parent: 'game-container',
    scene: {
        create() {
            // Track current player (1 or 2)
            this.currentPlayer = 1;

            // Player 1 (left, blue)
            this.add.circle(PLAYER1_X, PLAYER_Y, PLAYER_RADIUS, 0x3498db);
            this.add.text(PLAYER1_X, PLAYER_Y + 45, 'Player 1', {
                font: '18px Arial',
                color: '#3498db',
            }).setOrigin(0.5, 0);

            // Player 2 (right, red)
            this.add.circle(PLAYER2_X, PLAYER_Y, PLAYER_RADIUS, 0xe74c3c);
            this.add.text(PLAYER2_X, PLAYER_Y + 45, 'Player 2', {
                font: '18px Arial',
                color: '#e74c3c',
            }).setOrigin(0.5, 0);

            // Title
            this.add.text(400, 50, 'Phaser is working!', {
                font: '32px Arial',
                color: '#fff',
            }).setOrigin(0.5);

            // Turn indicator
            this.turnText = this.add.text(400, 100, 'Player 1\'s turn', {
                font: '24px Arial',
                color: '#fff',
            }).setOrigin(0.5);

            // Input to end turn (for now, click anywhere)
            this.input.on('pointerdown', () => {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.turnText.setText(`Player ${this.currentPlayer}'s turn`);
            });
        }
    }
};

new Phaser.Game(config);
