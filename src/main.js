import Phaser from 'phaser';

const PLAYER_RADIUS = 30;
const PLAYER_Y = 500;
const WORLD_WIDTH = 2400;
const PLAYER1_X = 200;
const PLAYER2_X = WORLD_WIDTH - 200;

const ARROW_COLOR = 0xffff00;
const AIM_LINE_COLOR = 0xffffff;
const MAX_DRAG_DIST = 150;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
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
        preload() {
            // No assets yet
        },
        create() {
            this.currentPlayer = 1;
            this.playerHealth = [100, 100];

            // Set world bounds
            this.physics.world.setBounds(0, 0, WORLD_WIDTH, 1200);
            this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1200);

            // Terrain (simple ground)
            this.ground = this.add.rectangle(WORLD_WIDTH / 2, PLAYER_Y + PLAYER_RADIUS + 30, WORLD_WIDTH, 60, 0x654321);
            this.physics.add.existing(this.ground, true);

            // Player 1 (left, blue)
            this.player1Circle = this.add.circle(PLAYER1_X, PLAYER_Y, PLAYER_RADIUS, 0x3498db);
            this.add.text(PLAYER1_X, PLAYER_Y + 45, 'Player 1', {
                font: '18px Arial', color: '#3498db',
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
                font: '18px Arial', color: '#e74c3c',
            }).setOrigin(0.5, 0);
            this.player2HealthText = this.add.text(PLAYER2_X, PLAYER_Y - 50, '100', {
                font: '18px Arial', color: '#fff'
            }).setOrigin(0.5);
            this.player2Body = this.physics.add.staticImage(PLAYER2_X, PLAYER_Y, null)
                .setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2)
                .setVisible(false);

            // Title (fixed to camera)
            this.titleText = this.add.text(0, 20, 'Phaser is working!', {
                font: '32px Arial', color: '#fff',
            }).setOrigin(0.5, 0).setScrollFactor(0);
            this.titleText.x = config.width / 2;

            // Turn indicator (fixed to camera)
            this.turnText = this.add.text(0, 70, 'Player 1\'s turn', {
                font: '24px Arial', color: '#fff',
            }).setOrigin(0.5, 0).setScrollFactor(0);
            this.turnText.x = config.width / 2;

            // Aiming state
            this.isAiming = false;
            this.aimLine = this.add.graphics();
            this.arrow = null;

            // Arrow function for getCurrentPlayerPos
            this.getCurrentPlayerPos = () => {
                return this.currentPlayer === 1
                    ? { x: PLAYER1_X, y: PLAYER_Y }
                    : { x: PLAYER2_X, y: PLAYER_Y };
            };

            // Camera to current player
            this.isCameraPanning = false;
            this.centerCameraOnCurrentPlayer = () => {
                this.isCameraPanning = true;
                const { x } = this.getCurrentPlayerPos();
                this.cameras.main.pan(x, config.height / 2, 500, 'Power2', false, (cam, progress) => {
                    if (progress === 1) {
                        this.isCameraPanning = false;
                    }
                });
            };
            this.centerCameraOnCurrentPlayer();

            // Input events for aiming and shooting
            this.input.on('pointerdown', (pointer) => {
                if (this.arrow || this.isAiming || this.isCameraPanning) return;
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const { x, y } = this.getCurrentPlayerPos();
                // Only start aiming if pointer is near the current player
                if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, x, y) < PLAYER_RADIUS + 10) {
                    this.isAiming = true;
                    this.aimStart = { x: worldPoint.x, y: worldPoint.y };
                }
            });

            this.input.on('pointermove', (pointer) => {
                if (this.isAiming && !this.arrow) {
                    this.aimLine.clear();
                    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    const { x, y } = this.getCurrentPlayerPos();
                    const dragDist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, x, y);
                    const capped = dragDist > MAX_DRAG_DIST ? MAX_DRAG_DIST / dragDist : 1;
                    const endX = x - (worldPoint.x - x) * capped;
                    const endY = y - (worldPoint.y - y) * capped;
                    this.aimLine.lineStyle(3, AIM_LINE_COLOR, 1);
                    this.aimLine.strokeLineShape(new Phaser.Geom.Line(x, y, endX, endY));
                }
            });

            this.input.on('pointerup', (pointer) => {
                if (this.isAiming && !this.arrow) {
                    this.aimLine.clear();
                    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    const { x, y } = this.getCurrentPlayerPos();
                    const dx = x - worldPoint.x;
                    const dy = y - worldPoint.y;
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

                // Smoothly pan to the arrow's initial position horizontally, then follow only horizontally
                const cam = this.cameras.main;
                cam.stopFollow();
                cam.pan(this.arrow.x, config.height / 2, 400, 'Power2', false, (camera, progress) => {
                    if (progress === 1) {
                        cam.startFollow(this.arrow, true, 0.08, 0, 0, 0, (cam, target) => {
                            // Only follow x, keep y fixed at center
                            return {
                                x: target.x,
                                y: config.height / 2
                            };
                        });
                    }
                });

                // Only check collision with the opponent
                if (this.currentPlayer === 1) {
                    this.physics.add.overlap(this.arrow, this.player2Body, () => this.handleHit(2), null, this);
                } else {
                    this.physics.add.overlap(this.arrow, this.player1Body, () => this.handleHit(1), null, this);
                }

                // Remove arrow and end turn if it goes off world bounds
                this.arrow.update = () => {
                    if (
                        this.arrow.x < -50 || this.arrow.x > WORLD_WIDTH + 50 ||
                        this.arrow.y < -50 || this.arrow.y > 1200 + 50
                    ) {
                        this.cameras.main.stopFollow();
                        this.arrow.destroy();
                        this.arrow = null;
                        // Pan back to next player after a short delay
                        this.time.delayedCall(400, () => {
                            this.nextTurn();
                        });
                    }
                };
            };

            // Handle hit
            this.handleHit = (playerNum) => {
                if (!this.arrow) return;
                this.cameras.main.stopFollow();
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
                    // Pan back to next player after a short delay
                    this.time.delayedCall(400, () => {
                        this.nextTurn();
                    });
                }
            };

            // Next turn
            this.nextTurn = () => {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.turnText.setText(`Player ${this.currentPlayer}'s turn`);
                this.centerCameraOnCurrentPlayer();
            };
        },
        update() {
            // If an arrow is in flight, block aiming and clear any aim UI
            if (this.arrow) {
                this.isAiming = false;
                this.aimLine.clear();
            }
            if (this.arrow && this.arrow.update) {
                this.arrow.update();
            }
        }
    }
};

// Remove the old camera clamp logic, as it's now handled in the follow callback

window.addEventListener('resize', () => {
    config.width = window.innerWidth;
    config.height = window.innerHeight;
    if (window.game && window.game.scene && window.game.scene.scenes[0]) {
        window.game.scale.resize(window.innerWidth, window.innerHeight);
    }
});

window.game = new Phaser.Game(config);
