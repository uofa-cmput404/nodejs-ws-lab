// This is browser code that gets transformed using Parcel/Babel
// Therefore you can now use ES6 style imports

import * as Phaser from "phaser";

interface ICoords {
  [key: string]: {
    x: number;
    y: number;
    frame: number;
  }
}

const DEBUG = false; // Render debug physics entities

function uuid(
  a?: any               // placeholder
): string {
  return a              // if the placeholder was passed, return
    ? (                 // a random number from 0 to 15
      a ^               // unless b is 8,
      Math.random()     // in which case
      * 16              // a random number from
      >> a / 4          // 8 to 11
    ).toString(16)      // in hexadecimal
    : (                 // or otherwise a concatenated string:
      1e7.toString() +  // 10000000 +
      -1e3 +            // -1000 +
      -4e3 +            // -4000 +
      -8e3 +            // -80000000 +
      -1e11             // -100000000000,
    ).replace(          // replacing
      /[018]/g,         // zeroes, ones, and eights with
      uuid              // random hex digits
    )
}

class GameScene extends Phaser.Scene {
  private HOST = window.location.hostname; // localhost and 127.0.0.1 handled
  private PORT = 8080; // change this if needed

  private VELOCITY = 100;
  private wsClient?: WebSocket;
  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;

  private id = uuid();
  private players: { [key: string]: Phaser.GameObjects.Sprite } = {};

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

    this.wsClient.onmessage = (wsMsgEvent) => {
      const allCoords: ICoords = JSON.parse(wsMsgEvent.data);
      for (const playerId of Object.keys(allCoords)) {
        if (playerId === this.id) {
          // we don't need to update ourselves
          continue;
        }
        const { x, y, frame } = allCoords[playerId];
        if (playerId in this.players) {
          // We have seen this player before, update it!
          const player = this.players[playerId];
          if (player.texture.key === "__MISSING") {
            // Player was instantiated before texture was ready, reinstantiate
            player.destroy();
            this.players[playerId] = this.add.sprite(x, y, "player", frame);
          } else {
            player.setX(x);
            player.setY(y);
            player.setFrame(frame);
          }
        } else {
          // We have not seen this player before, create it!
          this.players[playerId] = this.add.sprite(x, y, "player", frame);
        }
      }
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
    this.players[this.id] = this.physics.add.sprite(48, 48, "player", 1);
    this.physics.add.collider(this.players[this.id], layer);
    this.cameras.main.startFollow(this.players[this.id]);
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
    for (const playerId of Object.keys(this.players)) {
      const player = this.players[playerId];

      if (playerId !== this.id) {
        player.setTint(0x0000aa);
        player.update();
        continue;
      }

      let moving = false;
      if (this.leftKey && this.leftKey.isDown) {
        (player.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.VELOCITY);
        player.play("left", true);
        moving = true;
      } else if (this.rightKey && this.rightKey.isDown) {
        (player.body as Phaser.Physics.Arcade.Body).setVelocityX(this.VELOCITY);
        player.play("right", true);
        moving = true;
      } else {
        (player.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
      }
      if (this.upKey && this.upKey.isDown) {
        (player.body as Phaser.Physics.Arcade.Body).setVelocityY(-this.VELOCITY);
        player.play("up", true);
        moving = true;
      } else if (this.downKey && this.downKey.isDown) {
        (player.body as Phaser.Physics.Arcade.Body).setVelocityY(this.VELOCITY);
        player.play("down", true);
        moving = true;
      } else {
        (player.body as Phaser.Physics.Arcade.Body).setVelocityY(0);
      }
      if (!moving) {
        (player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
        player.anims.stop();
      } else if (this.wsClient) {
        this.wsClient.send(JSON.stringify({
          id: this.id,
          x: player.x,
          y: player.y,
          frame: player.frame.name
        }));
      }
      player.update();
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