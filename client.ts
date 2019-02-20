// This is browser code that gets transformed using Parcel/Babel
// Therefore you can now use ES6 style imports

import * as Phaser from "phaser";

interface ICoords {
  x: number;
  y: number;
}

class GameScene extends Phaser.Scene {
  private HOST = window.location.hostname; // localhost and 127.0.0.1 handled
  private PORT = 8080; // change this if needed

  private wsClient?: WebSocket;
  private sprite?: Phaser.GameObjects.Sprite;

  constructor() { super({ key: "GameScene" }); }

  /**
   * Load the assets required by the scene
   */
  public preload() {
    this.load.image("bunny", "static/bunny.png");
  }

  /**
   * Instantiate the private variables required by the scene
   */
  public init() {
    // Initialize the websocket client
    this.wsClient = new WebSocket(`ws://${this.HOST}:${this.PORT}`);
    this.wsClient.onopen = (event) => {
      // After the websocket is open, set interactivtiy
      console.log(event);

      // Start of the drag event (mouse click down)
      this.input.on("dragstart", (
        _: Phaser.Input.Pointer,
        gObject: Phaser.GameObjects.Sprite
      ) => {
        gObject.setTint(0xff0000);
      });

      // During the drag event (mouse movement)
      this.input.on("drag", (
        _: Phaser.Input.Pointer,
        gObject: Phaser.GameObjects.Sprite,
        dragX: number,
        dragY: number
      ) => {
        gObject.x = dragX;
        gObject.y = dragY;
        this.wsClient!.send(JSON.stringify({ x: gObject.x, y: gObject.y }));
      });

      // End of the drag event (mouse click up)
      this.input.on("dragend", (
        _: Phaser.Input.Pointer,
        gObject: Phaser.GameObjects.Sprite
      ) => {
        gObject.clearTint();
        this.wsClient!.send(JSON.stringify({ x: gObject.x, y: gObject.y }));
      });
    }

    this.wsClient.onmessage = (wsMsgEvent) => {
      console.log(wsMsgEvent);
      wsMsgEvent.data;
      const actorCoordinates: ICoords = JSON.parse(wsMsgEvent.data);
      // Sprite may not have been initialized yet
      if (this.sprite) {
        this.sprite.x = actorCoordinates.x;
        this.sprite.y = actorCoordinates.y;
      }
    }
  }

  /**
   * Create the game objects required by the scene
   */
  public create() {
    // Create an interactive, draggable bunny sprite
    this.sprite = this.add.sprite(100, 100, "bunny");
    this.sprite.setInteractive();
    this.input.setDraggable(this.sprite);
  }
}


// Phaser configuration variables
const config: GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  scene: [GameScene]
};

class LabDemoGame extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

window.addEventListener("load", () => {
  new LabDemoGame(config);
})