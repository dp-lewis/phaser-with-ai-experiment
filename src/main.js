import Phaser from 'phaser';

const PLAYER_RADIUS = 30;
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
    backgroundColor: '#b3e0ff', // pale blue sky
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
            const GROUND_HEIGHT = Math.floor(config.height * 0.25); // 25% of screen height
            this.currentPlayer = 1;
            this.playerHealth = [100, 100];

            // Parallax hills background
            this.hills = [];
            const hillColors = [0x99d98c, 0x52b788, 0x168aad];
            const hillHeights = [80, 120, 180];
            const hillOffsets = [0.1, 0.2, 0.3]; // parallax factors
            for (let i = 0; i < 3; i++) {
                const graphics = this.add.graphics();
                graphics.fillStyle(hillColors[i], 1);
                graphics.beginPath();
                graphics.moveTo(0, config.height - (GROUND_HEIGHT + hillHeights[i]));
                for (let x = 0; x <= WORLD_WIDTH; x += 80) {
                    const y = config.height - (GROUND_HEIGHT + hillHeights[i]) + Math.sin((x / WORLD_WIDTH) * Math.PI * 2 + i) * 30 + i * 10;
                    graphics.lineTo(x, y);
                }
                graphics.lineTo(WORLD_WIDTH, config.height);
                graphics.lineTo(0, config.height);
                graphics.closePath();
                graphics.fillPath();
                graphics.setScrollFactor(hillOffsets[i], 1);
                this.hills.push(graphics);
            }

            // Parallax trees (foreground)
            this.trees = [];
            const treeColor = 0x26734d;
            const treeCount = 18;
            const treeParallax = 0.5; // foreground, moves faster than hills
            for (let i = 0; i < treeCount; i++) {
                const treeX = (i + 0.5) * (WORLD_WIDTH / treeCount) + (Math.random() - 0.5) * 60;
                const baseY = config.height - GROUND_HEIGHT;
                const treeHeight = 70 + Math.random() * 40;
                const treeWidth = 32 + Math.random() * 16;
                const tree = this.add.graphics();
                tree.fillStyle(treeColor, 1);
                tree.beginPath();
                tree.moveTo(treeX, baseY - treeHeight);
                tree.lineTo(treeX - treeWidth / 2, baseY);
                tree.lineTo(treeX + treeWidth / 2, baseY);
                tree.closePath();
                tree.fillPath();
                tree.setScrollFactor(treeParallax, 1);
                this.trees.push(tree);
            }

            // Set world bounds
            this.physics.world.setBounds(0, 0, WORLD_WIDTH, 1200);
            this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1200);

            // Terrain (simple ground)
            this.ground = this.add.rectangle(
                WORLD_WIDTH / 2,
                config.height - (GROUND_HEIGHT / 2), // center at bottom
                WORLD_WIDTH,
                GROUND_HEIGHT,
                0x27ae60 // green grass
            );
            this.physics.add.existing(this.ground, true);

            // Position players so they stand on the ground
            const PLAYER_Y = config.height - GROUND_HEIGHT - PLAYER_RADIUS;

            // Player 1 (left, orange)
            this.player1Circle = this.add.circle(PLAYER1_X, PLAYER_Y, PLAYER_RADIUS, 0xff9900); // bright orange
            this.add.text(PLAYER1_X, PLAYER_Y + 45, 'Player 1', {
                font: '18px Arial', color: '#ff9900',
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
            this.titleText = this.add.text(0, 20, 'Dynamite Duel', {
                font: 'bold 48px Arial Black, Arial, sans-serif',
                color: '#ff3333', // dynamite red
                stroke: '#fff',
                strokeThickness: 6
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
                // Dynamite stick: red rectangle with yellow fuse
                this.arrow = this.add.container(x, y);
                const body = this.add.rectangle(0, 0, 40, 10, 0xff3333).setOrigin(0, 0.5);
                const fuse = this.add.rectangle(40, 5, 10, 2, 0xffe066).setOrigin(0, 0.5);
                this.arrow.add([body, fuse]);
                this.physics.add.existing(this.arrow);
                this.arrow.body.setAllowGravity(true);
                const power = dragDist * 6;
                const vx = dx / dragDist * power;
                const vy = dy / dragDist * power;
                this.arrow.body.setVelocity(vx, vy);
                this.arrow.body.setSize(40, 10);
                this.arrow.body.setOffset(0, -5);
                // Set rotation to match trajectory
                this.arrow.setRotation(Math.atan2(vy, vx));

                // Camera follow logic (unchanged)
                const cam = this.cameras.main;
                cam.stopFollow();
                cam.pan(this.arrow.x, config.height / 2, 400, 'Power2', false, (camera, progress) => {
                    if (progress === 1) {
                        cam.startFollow(this.arrow, true, 0.08, 0, 0, 0, (cam, target) => {
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

                // EXPLODE ON GROUND COLLISION
                this.physics.add.collider(this.arrow, this.ground, () => {
                    if (!this.arrow) return;
                    this.cameras.main.stopFollow();
                    // Explosion effect (same as player hit)
                    this.createExplosion(this.arrow.x, this.arrow.y);
                    this.arrow.destroy();
                    this.arrow = null;
                    this.time.delayedCall(400, () => {
                        this.nextTurn();
                    });
                }, null, this);

                // Remove arrow and end turn if it goes off world bounds
                this.arrow.update = () => {
                    // Rotate to match velocity
                    if (this.arrow.body && this.arrow.body.velocity) {
                        const vx = this.arrow.body.velocity.x;
                        const vy = this.arrow.body.velocity.y;
                        this.arrow.setRotation(Math.atan2(vy, vx));
                    }
                    if (
                        this.arrow.x < -50 || this.arrow.x > WORLD_WIDTH + 50 ||
                        this.arrow.y < -50 || this.arrow.y > 1200 + 50
                    ) {
                        this.cameras.main.stopFollow();
                        this.arrow.destroy();
                        this.arrow = null;
                        this.time.delayedCall(400, () => {
                            this.nextTurn();
                        });
                    }
                };
            };

            // Explosion effect (expanding/fading circles)
            this.createExplosion = (x, y) => {
                // Camera shake
                this.cameras.main.shake(200, 0.01);
                for (let i = 0; i < 3; i++) {
                    const circle = this.add.circle(x, y, 10, 0xffe066, 0.7 - i * 0.2);
                    this.tweens.add({
                        targets: circle,
                        radius: 40 + i * 20,
                        alpha: 0,
                        duration: 400,
                        ease: 'Cubic.easeOut',
                        onComplete: () => circle.destroy()
                    });
                }
            };

            // Handle hit
            this.handleHit = (playerNum) => {
                if (!this.arrow) return;
                this.cameras.main.stopFollow();
                // Explosion effect
                this.createExplosion(this.arrow.x, this.arrow.y);
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
