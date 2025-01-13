"use strict";

/**
 * When the page loads, insert message strings, add input validation, and
 * button click behaviour.
 */
document.addEventListener("DOMContentLoaded", () => {
  fetch("../lang/messages/en/user.js")
    .then((response) => response.json())
    .then((data) => {
      const gameManager = new GameManager(data);
      gameManager.insertText();
      gameManager.validateInput();
      gameManager.onBtnClickStartGame();
    });
});

/** @class GameManager which starts, manages, and restarts a memory game. */
class GameManager {
  /**
   * Create a GameManager with a list of game messages and no game.
   * @param {Object} data The list of user-facing strings.
   */
  constructor(data) {
    this.data = data;
    this.game = null;
  }

  /** Insert the user-facing game instructions. */
  insertText() {
    document
      .getElementById("instructionLabel")
      .insertAdjacentHTML("afterbegin", this.data.instruction);
    document.getElementById("startGame").innerHTML = this.data.start;
  }

  /**
   * Ensure that game can only be started with valid input, which is a number
   * between 3 and 7 inclusive.
   */
  validateInput() {
    const input = document.getElementById("input");
    input.onkeyup = () => {
      document.getElementById("startGame").disabled = !input.checkValidity();
    };
  }

  /**
   * When the start game button is clicked, start a new game. If a current game
   * is in progress or over, clear the buttons for that game first.
   */
  onBtnClickStartGame() {
    document.getElementById("startGame").onclick = () => {
      if (this.game) this.game.clearButtons();
      this.game = new Game(
        parseInt(document.getElementById("input").value),
        this.data
      );
      this.game.start();
    };
  }
}

/** @class Game which represents a memory game. */
class Game {
  /**
   * Creates the game with the specified number of buttons, and a list of game
   * messages.
   * @param {number} num The number of buttons.
   * @param {Object} data List of game messages.
   */
  constructor(num, data) {
    this.num = num;
    this.data = data;
    /** ChatGPT was used to help generate this line */
    this.buttons = Array.from({ length: num }, (_, i) => new Button(i, this));
    this.nextNum = 1;
  }

  /**
   * Starts the game by making the buttons visible and setting a timer to
   * scramble after a number of seconds equal to the number of buttons.
   */
  start() {
    this.buttons.forEach((button) => document.body.appendChild(button.html));
    setTimeout(() => this.scramble(), this.num * 1000);
  }

  /**
   * Scrambles the buttons a number of times equal to the number of buttons,
   * with 2 seconds between each scramble.
   */
  async scramble() {
    this.freeButtons();
    await new Promise((resolve) => this.randomizePositions(this.num, resolve));
    this.unlockButtons();
  }

  /** Unlock the positions of all the buttons. */
  freeButtons() {
    this.buttons.forEach((button) => button.freePosition());
  }

  /**
   * ChatGPT was used to help generate this function
   * Recursive function that randomizes the positions of the buttons and calls
   * itself every 2 seconds until scrambling is complete.
   * @param {Object} buttons The array of buttons.
   * @param {number} count The number of randomizations remaining.
   * @param {Function} resolve The callback function when scrambling complete.
   */
  randomizePositions(count, resolve) {
    this.buttons.forEach((button) => button.randomizePosition());
    if (--count)
      setTimeout(() => this.randomizePositions(count, resolve), 2000);
    else resolve();
  }

  /** Make all buttons clickable and hide their numbers. */
  unlockButtons() {
    this.buttons.forEach((button) => {
      button.unlock();
      button.hideNumber();
    });
  }

  /** Removes the buttons from the screen, in preparation for a new game. */
  clearButtons() {
    this.buttons.forEach((button) => button.html.remove());
  }

  /**
   * Checks the number of the button that was clicked. If order is correct,
   * display the number on the button. If all buttons have been clicked, display
   * win message. If order is incorrect, display a lose message and lock all
   * buttons to end game.
   * @param {number} num The number of the clicked button.
   */
  notify(num) {
    if (num === this.nextNum) {
      if (num === this.num) this.win();
      else this.nextNum++;
      this.correctButton(num - 1);
    } else this.lose();
  }

  /**
   * When a correct button is clicked, show its number and lock it.
   * @param {number} num The number of the correctly clicked button.
   */
  correctButton(num) {
    this.buttons[num].showNumber();
    this.buttons[num].lock();
  }

  /** Display a win message. */
  win() {
    window.alert(this.data.win);
  }

  /** Display a lose message, lock all buttons and show their numbers. */
  lose() {
    window.alert(this.data.lose);
    this.buttons.forEach((button) => {
      button.lock();
      button.showNumber();
    });
  }
}

/** @class Button represents a button on the screen. */
class Button {
  /**
   * Creates the button with appropriate onclick behaviour, the number
   * displayed, disabled, and with a random background colour.
   * @param {number} num The number to display on the button - 1.
   * @param {Object} game The game object to notify when the button is clicked.
   */
  constructor(num, game) {
    this.num = num + 1;
    this.html = document.createElement("BUTTON");
    this.html.innerHTML = this.num;
    this.html.disabled = true;
    this.html.onclick = () => game.notify(this.num);
    /** ChatGPT was used to help generate this line */
    this.html.style.backgroundColor = `rgb(${Math.floor(Math.random() * 256)},
                                           ${Math.floor(Math.random() * 256)},
                                           ${Math.floor(Math.random() * 256)})`;
  }

  /** Set the button to absolute position. */
  freePosition() {
    this.html.classList.add("absolute");
  }

  /** Hide the button's number. */
  hideNumber() {
    this.html.innerHTML = null;
  }

  /** Show the button's number. */
  showNumber() {
    this.html.innerHTML = this.num;
  }

  /**
   * ChatGPT was used to help generate this function
   * Moves the button to a random location on the screen.
   */
  randomizePosition() {
    this.html.style.top = `${Math.floor(
      Math.random() * (window.innerHeight - this.html.offsetHeight)
    )}px`;
    this.html.style.left = `${Math.floor(
      Math.random() * (window.innerWidth - this.html.offsetWidth)
    )}px`;
  }

  /** Allow clicking the button. */
  unlock() {
    this.html.disabled = false;
  }

  /** Disallow clicking the button. */
  lock() {
    this.html.disabled = true;
  }
}
