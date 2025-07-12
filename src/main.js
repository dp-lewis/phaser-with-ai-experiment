import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222',
    parent: 'game-container',
    scene: {
        create() {
            this.add.text(400, 300, 'Phaser is working!', {
                font: '32px Arial',
                color: '#fff',
            }).setOrigin(0.5);
        }
    }
};

new Phaser.Game(config);
