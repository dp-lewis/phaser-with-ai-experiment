import Phaser from 'phaser';

const PLAYER_RADIUS = 30;
const PLAYER_Y = 500;
const PLAYER1_X = 150;
const PLAYER2_X = 650;

const ARROW_COLOR = 0xffff00;
const AIM_LINE_COLOR = 0xffffff;
const MAX_DRAG_DIST = 150;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: {
        create() {
            this.currentPlayer = 1;
            this.playerHealth = [100, 100];

            // Player 1 (left, blue)
            this.player1Circle = this.add.circle(PLAYER1_X, PLAYER_Y, PLAYER_RADIUS, 0x3498db);
            this.add.text(PLAYER1_X, PLAYER_Y + 45, 'Player 1', {
                font: '18px Arial',
                color: '#3498db',
            }).setOrigin(0.5, 0);
            this.player1HealthText = this.add.text(PLAYER1_X, PLAYER_Y - 50, '100', {
                font: '18px Arial', color: '#fff'
            }).setOrigin(0.5);
            this.player1Body = this.physics.add.staticImage(PLAYER1_X, PLAYER_Y, null)
                .setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2)
                .setVisible(false);

            // Player 2 (right, red)
            this.player2Circle = this.add.circle(PLAYER2_X, PLAYER_Y, PLAYER_RADIUS, 0xe74c3c);
            this.add.text(PLAYER2_X, PLAYER_Y + 45, 'Player 2', {
                font: '18px Arial',
                color: '#e74c3c',
            }).setOrigin(0.5, 0);
            this.player2HealthText = this.add.text(PLAYER2_X, PLAYER_Y - 50, '100', {
                font: '18px Arial', color: '#fff'
            }).setOrigin(0.5);
            this.player2Body = this.physics.add.staticImage(PLAYER2_X, PLAYER_Y, null)
                .setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2)
                .setVisible(false);

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

            // Aiming state
            this.isAiming = false;
            this.aimLine = this.add.graphics();
            this.arrow = null;

            // Input events for aiming and shooting
            this.input.on('pointerdown', (pointer) => {
                if (this.arrow || this.isAiming) return; // Don't allow aiming if arrow is in flight or already aiming
                const { x, y } = this.getCurrentPlayerPos();
                // Only start aiming if pointer is near the current player
                if (Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y) < PLAYER_RADIUS + 10) {
                    this.isAiming = true;
                    this.aimStart = { x: pointer.x, y: pointer.y };
                }
            });

            this.input.on('pointermove', (pointer) => {
                if (this.isAiming && !this.arrow) {
                    this.aimLine.clear();
                    const { x, y } = this.getCurrentPlayerPos();
                    const dragDist = Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y);
                    const capped = dragDist > MAX_DRAG_DIST ? MAX_DRAG_DIST / dragDist : 1;
                    const endX = x - (pointer.x - x) * capped;
                    const endY = y - (pointer.y - y) * capped;
                    this.aimLine.lineStyle(3, AIM_LINE_COLOR, 1);
                    this.aimLine.strokeLineShape(new Phaser.Geom.Line(x, y, endX, endY));
                }
            });

            this.input.on('pointerup', (pointer) => {
                if (this.isAiming && !this.arrow) {
                    this.aimLine.clear();
                    const { x, y } = this.getCurrentPlayerPos();
                    const dx = x - pointer.x;
                    const dy = y - pointer.y;
                    const dragDist = Phaser.Math.Clamp(Math.sqrt(dx*dx + dy*dy), 0, MAX_DRAG_DIST);
                    if (dragDist > 10) {
                        // Fire arrow
                        this.shootArrow(x, y, dx, dy, dragDist);
                    }
                    this.isAiming = false;
                } else {
                    this.isAiming = false;
                    this.aimLine.clear();
                }
            });

            // Arrow function for getCurrentPlayerPos
            this.getCurrentPlayerPos = () => {
                return this.currentPlayer === 1
                    ? { x: PLAYER1_X, y: PLAYER_Y }
                    : { x: PLAYER2_X, y: PLAYER_Y };
            };

            // Arrow function for shootArrow
            this.shootArrow = (x, y, dx, dy, dragDist) => {
                if (this.arrow) this.arrow.destroy();
                this.isAiming = false;
                this.aimLine.clear();
                this.arrow = this.physics.add.image(x, y, null)
                    .setDisplaySize(40, 8)
                    .setOrigin(0, 0.5)
                    .setAngle(Phaser.Math.RadToDeg(Math.atan2(dy, dx)))
                    .setTint(ARROW_COLOR);
                const power = dragDist * 6;
                this.arrow.body.allowGravity = true;
                this.arrow.setVelocity(dx / dragDist * power, dy / dragDist * power);

                // Only check collision with the opponent
                if (this.currentPlayer === 1) {
                    this.physics.add.overlap(this.arrow, this.player2Body, () => this.handleHit(2), null, this);
                } else {
                    this.physics.add.overlap(this.arrow, this.player1Body, () => this.handleHit(1), null, this);
                }

                // Remove arrow and end turn if it goes off screen
                this.arrow.update = () => {
                    if (
                        this.arrow.x < -50 || this.arrow.x > this.sys.game.config.width + 50 ||
                        this.arrow.y < -50 || this.arrow.y > this.sys.game.config.height + 50
                    ) {
                        this.arrow.destroy();
                        this.arrow = null;
                        this.nextTurn();
                    }
                };
            };

            // Add update loop to check arrow position
            this.events.on('update', () => {
                // If an arrow is in flight, block aiming and clear any aim UI
                if (this.arrow) {
                    this.isAiming = false;
                    this.aimLine.clear();
                }
                if (this.arrow && this.arrow.update) {
                    this.arrow.update();
                }
            });

            // Handle hit
            this.handleHit = (playerNum) => {
                if (!this.arrow) return;
                this.arrow.destroy();
                this.arrow = null;
                if (this.arrowTimeout) this.arrowTimeout.remove();
                this.playerHealth[playerNum - 1] -= 34;
                if (playerNum === 1) {
                    this.player1HealthText.setText(this.playerHealth[0]);
                } else {
                    this.player2HealthText.setText(this.playerHealth[1]);
                }
                if (this.playerHealth[playerNum - 1] <= 0) {
                    this.turnText.setText(`Player ${playerNum} loses!`);
                    this.input.removeAllListeners();
                } else {
                    this.nextTurn();
                }
            };

            // Next turn
            this.nextTurn = () => {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.turnText.setText(`Player ${this.currentPlayer}'s turn`);
            };
        }
    }
};

new Phaser.Game(config);
