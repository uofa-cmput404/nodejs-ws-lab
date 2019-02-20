// This is browser code that gets transformed using Parcel/Babel
// Therefore you can now use ES6 style imports

import * as Phaser from "phaser";

interface ICoords {
  x: number;
  y: number;
}

const DEBUG = false; // Render debug physics entities

class GameScene extends Phaser.Scene {
  private HOST = window.location.hostname; // localhost and 127.0.0.1 handled
  private PORT = 8080; // change this if needed

  private VELOCITY = 100;
  private wsClient?: WebSocket;
  private player?: Phaser.GameObjects.Sprite;
  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;

  constructor() { super({ key: "GameScene" }); }

  /**
   * Load the assets required by the scene
   */
  public preload() {
    this.load.tilemapCSV("map", "static/level_map.csv");
    this.load.image("tiles", "static/tiles_16.png");
    this.load.spritesheet("player", "static/spaceman.png", {
      frameWidth: 16, frameHeight: 16
    });
  }

  /**
   * Instantiate the private variables required by the scene
   */
  public init() {
    // Initialize the websocket client
    this.wsClient = new WebSocket(`ws://${this.HOST}:${this.PORT}`);
    this.wsClient.onopen = (event) => console.log(event);
    // TODO: multiplayer functionality
    this.wsClient.onmessage = (wsMsgEvent) => {
      console.log(wsMsgEvent)
    }
  }

  /**
   * Create the game objects required by the scene
   */
  public create() {
    // Create the TileMap and the Layer
    const tileMap = this.add.tilemap("map", 16, 16);
    tileMap.addTilesetImage("tiles");
    const layer = tileMap.createDynamicLayer("layer", "tiles", 0, 0);
    tileMap.setCollisionBetween(54, 83);
    if (DEBUG) {
      layer.renderDebug(this.add.graphics(), {});
    }

    // Player animations
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 1, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("player", { start: 11, end: 13 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "down",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 6 }),
      frameRate: 10,
      repeat: -1
    });

    // Player game object
    this.player = this.physics.add.sprite(48, 48, "player", 1);
    this.physics.add.collider(this.player, layer);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(
      0, 0, tileMap.widthInPixels, tileMap.heightInPixels
    );

    // Keyboard input bindings
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  }

  public update() {
    if (this.player) {
      let moving = false;
      if (this.leftKey && this.leftKey.isDown) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.VELOCITY);
        this.player.play("left", true);
        moving = true;
      } else if (this.rightKey && this.rightKey.isDown) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(this.VELOCITY);
        this.player.play("right", true);
        moving = true;
      } else {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
      }
      if (this.upKey && this.upKey.isDown) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-this.VELOCITY);
        this.player.play("up", true);
        moving = true;
      } else if (this.downKey && this.downKey.isDown) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(this.VELOCITY);
        this.player.play("down", true);
        moving = true;
      } else {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(0);
      }
      if (!moving) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
        this.player.anims.stop();
      }
      this.player.update();
    }
  }
}


// Phaser configuration variables
const config: GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  scene: [GameScene],
  input: { keyboard: true },
  physics: {
    default: "arcade",
    arcade: { debug: DEBUG }
  },
  render: { pixelArt: true, antialias: false }
}

class LabDemoGame extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

window.addEventListener("load", () => {
  new LabDemoGame(config);
});
