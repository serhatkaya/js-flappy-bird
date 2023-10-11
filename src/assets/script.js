(() => {
  class BirdAnimator {
    constructor() {
      this.animationId = null;
      this.startTime = null;
      this.bird = document.getElementById("bird");
      this.isAnimating = false;
    }

    animate(currentTime) {
      if (!this.startTime) {
        this.startTime = currentTime;
      }

      const progress = (currentTime - this.startTime) / 250;
      const rotation = Math.sin(progress * 5) * 50;

      this.bird.style.transform = `rotate(-${rotation}deg)`;

      if (progress < 1) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
      } else {
        cancelAnimationFrame(this.animationId);
        this.bird.style.transform = "";
        this.isAnimating = false;
      }
    }

    toggleAnimation() {
      if (this.isAnimating) {
        return;
      }

      this.isAnimating = true;
      this.startTime = null;
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  class FlappyBirdModule {
    birdAnimator = new BirdAnimator();

    elements = {
      bird: document.getElementById("bird"),
      startScreen: document.querySelector(".start-screen"),
      startButton: document.getElementById("start-button"),
      gameContainer: document.querySelector(".game-container"),
      popupBestScoreElement: document.getElementById("best-score"),
      bestScoreElement: document.getElementById("score-best"),
      gameOverPopup: document.getElementById("game-over-popup"),
      finalScoreElement: document.getElementById("final-score"),
      restartButton: document.getElementById("restart-button"),
      jumpSound: document.getElementById("jump-sound"),
      collisionSound: document.getElementById("collision-sound"),
      scoreSound: document.getElementById("score-sound"),
      startSound: document.getElementById("start-sound"),
      scoreElement: document.querySelector(".score-mid"),
    };

    settings = {
      gravity: 3,
      cheat: false,
      pipeSpeed: 1500,
      jumpDistance: 3,
      pipeGap: 128,
      gameSpeed: 20,
      jumpDelay: 0,
      animatedJump: false,
    };

    state = {
      isJumping: false,
      score: 0,
      bestScore: 0,
      pipes: [],
      gameStarted: false,
      gameInterval: null,
      pipeInterval: null,
      birdPosition: 150,
    };

    initGame() {
      this.setStyle(this.elements.bird, "top", `${this.state.birdPosition}px`);
      this.setStyle(this.elements.bird, "left", "50px");
      this.initListeners();
    }

    initListeners() {
      this.addListener(this.elements.startButton, "click", () =>
        this.startGame()
      );
      this.addListener(this.elements.restartButton, "click", () => {
        this.setStyle(this.elements.gameOverPopup, "display", "none");
        this.resetGame();
      });

      this.addListener(document, "keydown", (event) => {
        this.triggerJump(true, event);
      });

      this.addListener(document, "mousedown", () => {
        this.triggerJump();
      });
    }

    startGame() {
      this.setStyle(this.elements.startScreen, "display", "none");
      this.setStyle(this.elements.gameContainer, "display", "block");
      this.setStyle(this.elements.bird, "left", "50px");
      this.setStyle(this.elements.bird, "top", "150px");
      this.setStyle(this.elements.gameOverPopup, "display", "none");
      this.setStyle(this.elements.scoreElement, "display", "block");
      this.classList(this.elements.bird).remove("animated");
      this.state.gameStarted = true;
      this.textContent(this.elements.scoreElement, "0");
      this.state.score = 0;
      this.state.pipes = [];
      this.createPipe();
      this.gameLoop();
      this.pipeLoop();
      this.playSound(this.elements.startSound);
    }

    gameLoop() {
      this.state.gameInterval = setInterval(() => {
        this.state.birdPosition += this.settings.gravity;
        this.setStyle(
          this.elements.bird,
          "top",
          `${this.state.birdPosition}px`
        );
        if (
          this.state.birdPosition + 22 >
            this.elements.gameContainer.clientHeight &&
          !this.settings.cheat
        ) {
          this.endGame();
          return;
        }

        this.movePipes();
        this.checkCollision();
      }, this.settings.gameSpeed);
    }

    createPipe() {
      const topHeight =
        Math.floor(
          Math.random() *
            (this.elements.gameContainer.clientHeight -
              this.settings.pipeGap -
              100)
        ) + 100;

      const topPipe = document.createElement("div");
      topPipe.className = "pipe";
      topPipe.style.height = `${topHeight}px`;

      const bottomHeight =
        this.elements.gameContainer.clientHeight -
        topHeight -
        this.settings.pipeGap;

      const bottomPipe = document.createElement("div");
      bottomPipe.innerHTML = `<div class="pipe-t"></div>`;
      topPipe.innerHTML = `<div class="pipe-t"></div>`;
      this.setStyle(bottomPipe, "height", `${bottomHeight}px`);
      this.setStyle(bottomPipe, "bottom", 0);
      this.classList(bottomPipe).add("pipe", "bottom");
      topPipe.scoreIndicator = true;
      const pipeArr = [topPipe, bottomPipe];
      pipeArr.forEach((pip) => this.elements.gameContainer.appendChild(pip));
      this.state.pipes.push(...pipeArr);
    }

    movePipes() {
      for (let i = 0; i < this.state.pipes.length; i++) {
        const pipe = this.state.pipes[i];
        const pipePos = parseInt(
          window.getComputedStyle(pipe).getPropertyValue("left")
        );

        if (pipePos < -100) {
          this.elements.gameContainer.removeChild(pipe);
        }

        this.setStyle(pipe, "left", `${pipePos - 5}px`);
      }
    }

    checkCollision() {
      const birdRect = this.elements.bird.getBoundingClientRect();
      console.log(birdRect);
      for (let i = 0; i < this.state.pipes.length; i++) {
        const pipe = this.state.pipes[i];
        const pipeRect = pipe.getBoundingClientRect();
        const pipeT = pipe.querySelector(".pipe-t");
        const pipeTRect = pipeT.getBoundingClientRect();

        if (
          (birdRect.right > pipeRect.left &&
            birdRect.left < pipeRect.right &&
            birdRect.bottom > pipeRect.top &&
            birdRect.top < pipeRect.bottom) ||
          (birdRect.right > pipeTRect.left &&
            birdRect.left < pipeTRect.right &&
            birdRect.bottom > pipeTRect.top &&
            birdRect.top < pipeTRect.bottom)
        ) {
          this.endGame();
          return;
        }

        if (
          birdRect.left > pipeRect.right &&
          !pipe.passed &&
          pipe.scoreIndicator
        ) {
          pipe.passed = true;
          this.increaseScore();
        }
      }
    }

    increaseScore() {
      this.state.score++;
      this.textContent(this.elements.scoreElement, this.state.score);
      this.playSound(this.elements.scoreSound);
    }

    endGame() {
      this.playSound(this.elements.collisionSound);
      this.state.gameStarted = false;
      clearInterval(this.state.pipeInterval);
      this.state.bestScore = Math.max(this.state.bestScore, this.state.score);
      this.textContent(
        this.elements.popupBestScoreElement,
        this.state.bestScore
      );
      this.textContent(this.elements.bestScoreElement, this.state.bestScore);
      clearInterval(this.state.gameInterval);
      this.textContent(this.elements.finalScoreElement, this.state.score);
      this.setStyle(this.elements.gameOverPopup, "display", "flex");
    }

    resetGame() {
      this.state.birdPosition = 150;
      this.setStyle(this.elements.bird, "top", "150px");
      this.state.score = 0;
      this.textContent(this.elements.scoreElement, "0");
      this.removeAllPipes();
      this.state.gameStarted = true;
      this.pipeLoop();
      this.gameLoop();
    }

    pipeLoop() {
      this.state.pipeInterval = setInterval(
        () => this.createPipe(),
        this.settings.pipeSpeed
      );
    }

    removeAllPipes() {
      this.elements.gameContainer
        .querySelectorAll(".pipe")
        .forEach((pipe) => pipe.remove());
      this.state.pipes = [];
    }

    triggerJump(key = false) {
      const params = [...arguments];
      if (
        key &&
        params[1].key === " " &&
        this.state.birdPosition > 0 &&
        this.state.gameStarted
      ) {
        this.jump();
      }

      if (!key && this.state.birdPosition > 0 && this.state.gameStarted) {
        this.jump();
      }
    }

    jump() {
      if (this.state.isJumping) return;
      let jumpCount = 0;

      const jumpInterval = setInterval(() => {
        if (jumpCount === 20) {
          clearInterval(jumpInterval);
          this.state.isJumping = false;
        }
        this.state.birdPosition -= this.settings.jumpDistance;
        this.setStyle(
          this.elements.bird,
          "top",
          `${this.state.birdPosition}px`
        );
        jumpCount++;
      }, this.settings.jumpDelay);

      this.playSound(this.elements.jumpSound);
      if (this.settings.animatedJump) {
        this.birdAnimator.toggleAnimation();
      }
    }

    // Helper Functions
    setStyle(element, styleProperty, value) {
      element.style[styleProperty] = value;
    }

    addListener(element, eventType, callback) {
      if (element && eventType && callback) {
        element.addEventListener(eventType, callback);
      } else {
        console.error("Please provide a valid HTML Element");
      }
    }

    classList(element) {
      return element.classList;
    }

    textContent(element, text) {
      element.textContent = text;
    }

    playSound(el) {
      if (!el.paused) {
        el.currentTime = 0;
      }

      el.play();
    }
  }

  const game = new FlappyBirdModule();

  game.initGame();
})();
