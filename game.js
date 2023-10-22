let game;

const gameOptions = {
  dudeGravity: 800,
  dudeSpeed: 300,
  maxDoubleJumps: 2,
};

window.onload = function() {
  let gameConfig = {
    type: Phaser.AUTO,
    backgroundColor: "#112211",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
    },
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: {
          y: 0,
        },
      },
    },
    scene: [IntroductionScene, PlayGame, BossFight],
  };

  game = new Phaser.Game(gameConfig);
  game.scene.add("GameOver", GameOver);
  game.scene.start("PlayGame");

  window.focus();
};

function resetGameToNormal() {
  gameOptions.dudeSpeed = 300; 
  gameOptions.dudeGravity = 800;
}

class IntroductionScene extends Phaser.Scene {
  constructor() {
    super("IntroductionScene");
  }

  create() {
    const introText = this.add.text(
      game.config.width / 2,
      game.config.height / 2,
      "You have 3 mins to collect as many points as possible",
      {
        fontSize: "24px",
        fill: "#ffffff",
        align: "center",
      }
    );
    introText.setOrigin(0.5);

    this.time.delayedCall(3000, () => {
    });
  }
}

class PlayGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
    this.score = 0;
    this.timer = 180;
    this.doubleJumps = 0;
    this.isDudeBigger = false;
    this.lives = 3;
    this.powerupDuration = 10000;
    this.powerupExpirationTime = 0; 
    this.hasUsedPowerUp = false;
  }

  preload() {
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
    this.load.image("sword", "assets/sword.png");
    this.load.image("mushroom", "assets/mushroom.png")
    this.load.image("sky", "assets/sky.png");
    this.load.image("heart", "assets/heart.png")
    this.load.image("bullet", "assets/bullet.png");
    this.load.audio("coinSound", "assets/coin.mp3");
    this.load.audio("jumpSound", "assets/jump.mp3");
    this.load.audio("starSound", "assets/starSound.mp3");
    this.load.audio("themeSound", "assets/theme.mp3");
    this.load.audio("grunt", "assets/grunt.mp3");
  }

  create() {
    this.groundGroup = this.physics.add.staticGroup();
    this.add.image(0, 0, "sky").setOrigin(0, 0);

    for (let i = 0; i < 20; i++) {
      const groundX = Phaser.Math.Between(0, game.config.width);
      if (groundX < game.config.width / 2 - 100 || groundX > game.config.width / 2 + 100) {
        this.groundGroup.create(groundX, game.config.height - 32, "ground");
      }
    }

    this.platformsGroup = this.physics.add.staticGroup();

    for (let i = 0; i < 5; i++) {
      this.platformsGroup.create(
        Phaser.Math.Between(100, game.config.width - 100),
        Phaser.Math.Between(100, game.config.height - 100),
        "ground"
      );
    }

    const themeSound = this.sound.add("themeSound");
    themeSound.setVolume(0.5);
    themeSound.play({ loop: true });

    this.dude = this.physics.add.sprite(100, game.config.height / 2, "dude");
    this.dude.body.gravity.y = gameOptions.dudeGravity;
    this.physics.add.collider(this.dude, this.groundGroup);
    this.physics.add.collider(this.dude, this.platformsGroup);

    this.starsGroup = this.physics.add.group();
    this.bulletsGroup = this.physics.add.group();

    this.physics.add.overlap(this.dude, this.starsGroup, this.collectStar, null, this);
    this.physics.add.overlap(this.dude, this.bulletsGroup, this.hitByBullet, null, this);

    this.add.image(16, 16, "star");
    this.scoreText = this.add.text(32, 3, "0", { fontSize: "30px", fill: "#ffffff" });

    this.add.image(16, 50, "heart");
    this.livesText = this.add.text(32, 37, "3", { fontSize: "30px", fill: "#ffffff" });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.starSound = this.sound.add("starSound");
    this.grunt = this.sound.add("grunt")

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 10,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });

    this.timerText = this.add.text(game.config.width - 10, 10, "3:00", {
      fontSize: "24px",
      fill: "#ffffff",
      align: "right",
    }).setOrigin(1, 0);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 179,
      callback: this.updateTimer,
      callbackScope: this,
    });

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: this.addStars,
      callbackScope: this,
    });

    this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: this.addMushrooms,
      callbackScope: this,
    });

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.addBullets,
      callbackScope: this,
    });

  }

  addBullets() {
    const bullet = this.bulletsGroup.create(game.config.width, Phaser.Math.Between(100, game.config.height - 100), "bullet");
    bullet.setVelocityX(-gameOptions.dudeSpeed);
  }

  addStars() {
    const randomNumber = Math.random();

    if (randomNumber < 0.2) {
      this.starsGroup.create(game.config.width, Phaser.Math.Between(100, game.config.height - 100), "sword");
      this.starsGroup.setVelocityX(-gameOptions.dudeSpeed);
    } else if (randomNumber < 0.6) {
      this.starsGroup.create(game.config.width, Phaser.Math.Between(100, game.config.height - 100), "star");
      this.starsGroup.setVelocityX(-gameOptions.dudeSpeed);
    }
  }

  addMushrooms() {
      const mushroom = this.starsGroup.create(game.config.width, 0, "mushroom");
      mushroom.setVelocity(0, 100);
  }


  collectStar(dude, star) {
    const coinSound = this.sound.add("coinSound");
    if (star.texture.key === "star") {
      this.score += 1;
      coinSound.setVolume(0.5);
      coinSound.play();
    } else if (star.texture.key === "sword") {
      this.score += 10;
      coinSound.play();
    } else if (star.texture.key === "mushroom") {
      this.isDudeBigger = true;
      this.dude.setScale(2);

      if (this.isDudeBigger) {
        this.dude.body.gravity.y = gameOptions.dudeGravity / 2;
        this.dude.body.velocity.x = gameOptions.dudeSpeed * 2;
      }

      this.time.addEvent({
        delay: 25000,
        callback: () => {
          this.isDudeBigger = false;
          this.dude.setScale(1);
          this.sound.play("starSound");
          this.dude.body.gravity.y = gameOptions.dudeGravity;
          this.dude.body.velocity.x = gameOptions.dudeSpeed;
        },
        callbackScope: this,
        loop: false
      });
    }
    star.disableBody(true, true);
    this.scoreText.setText(this.score);
  }


hitByBullet(dude, bullet) {
  bullet.disableBody(true, true);
  this.lives--;

  if (this.lives > 0) {
    this.livesText.setText(this.lives);
  } else {
    const grunt = this.sound.add("grunt");
    grunt.play();
  }
}

congratulateUser() {
  if (!this.hasUsedPowerUp) {
    this.hasUsedPowerUp = true;
    alert("Congratulations! You've reached a score of 100. You will enter the second level of the game now!!.");

    gameOptions.dudeSpeed = 900;
    gameOptions.dudeGravity = 1000;

    this.powerupExpirationTime = this.time.now + this.powerupDuration;

    this.time.delayedCall(this.powerupDuration, () => {
      resetGameToNormal();
    }, [], this);
  }
}

updateTimer() {
  this.timer -= 1;
  const minutes = Math.floor(this.timer / 60);
  const seconds = this.timer % 60;
  this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

  if (this.timer === 0) {
    this.endGame();
  }
}

endGame() {
    this.scene.start("BossFight", {
      collectedPoints: this.score,
      remainingLives: this.lives
    });
}

    update() {
      const { left, right, up } = this.cursors;
      const { dude, score, powerupPrompted, time } = this;
    
      dude.body.velocity.x = left.isDown ? -gameOptions.dudeSpeed : right.isDown ? gameOptions.dudeSpeed : 0;
      dude.anims.play(left.isDown ? "left" : right.isDown ? "right" : "turn", true);
    
      if (up.isDown && (dude.body.touching.down || this.doubleJumps < gameOptions.maxDoubleJumps)) {
        const jumpSound = this.sound.add("jumpSound");
        jumpSound.setVolume(0.5);
        jumpSound.play();
        dude.body.velocity.y = -gameOptions.dudeGravity / 1.6;
        if (!dude.body.touching.down) this.doubleJumps++;
      }
    
      if (dude.y > game.config.height) {
        this.lives--;
        this.livesText.setText(this.lives);
        if (this.lives <= 0) this.scene.start("GameOver");
        else {
          dude.x = 100;
          dude.y = game.config.height / 2;
          dude.setVelocity(0, 0);
        }
      }
      
    }
}

class GameOver extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  preload() {
    this.load.image("gameover", "assets/gameover.png");
  }

  create() {
    this.add.image(game.config.width / 2, game.config.height / 2, "gameover");

    const reloadText = this.add.text(
      game.config.width / 2,
      game.config.height - 50,
      "Click to reload the page",
      {
        fontSize: "24px",
        fill: "#ffffff",
      }
    );
    reloadText.setOrigin(0.5);

    this.input.on("pointerdown", () => {
      location.reload();
    });
  }
}

class BossFight extends Phaser.Scene {
  constructor() {
    super("bossFight");
    this.score = this.collectedPoints;
    this.lives = 3;
    this.bossHP = 50;
  }

  init(data) {
    this.collectedPoints = data.points;
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
    this.load.image("boss", "assets/boss.png");
    this.load.image("star", "assets/star.png");
    this.load.image("sword", "assets/sword.png");
    this.load.image("heart", "assets/unnamed (3).png");
    this.load.audio("jumpSound", "assets/jump.mp3");
    this.load.audio("bossTheme", "assets/bosstheme.mp3");
    this.load.image("bullet", "assets/Mario_Fireball.png");
  }
  
  create() {
    this.groundGroup = this.physics.add.staticGroup();
    this.add.image(0, 0, "sky").setOrigin(0, 0);

    for (let i = 0; i < 20; i++) {
      const groundX = Phaser.Math.Between(0, game.config.width);
      if (groundX < game.config.width / 2 - 100 || groundX > game.config.width / 2 + 100) {
        this.groundGroup.create(groundX, game.config.height - 32, "ground");
      }
    }

    this.platformsGroup = this.physics.add.staticGroup();

    for (let i = 0; i < 5; i++) {
      this.platformsGroup.create(
        Phaser.Math.Between(100, game.config.width - 100),
        Phaser.Math.Between(100, game.config.height - 100),
        "ground"
      );
    }

    const themeSound = this.sound.add("bossTheme");
    themeSound.setVolume(0.5);
    themeSound.play({ loop: true });

    this.dude = this.physics.add.sprite(100, game.config.height / 2, "dude");
    this.dude.body.gravity.y = gameOptions.dudeGravity;
    this.physics.add.collider(this.dude, this.groundGroup);
    this.physics.add.collider(this.dude, this.platformsGroup);

    this.starsGroup = this.physics.add.group();
    this.bulletsGroup = this.physics.add.group();

    this.add.image(16, 16, "star");
    this.scoreText = this.add.text(32, 3, "0", { fontSize: "30px", fill: "#ffffff" });

    this.add.image(16, 50, "heart");
    this.livesText = this.add.text(32, 37, "3", { fontSize: "30px", fill: "#ffffff" });

    this.bulletsGroup = this.physics.add.group();
    this.physics.add.collider(this.dude, this.bulletsGroup, this.hitByBullet, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();

    const boss = this.add.image(game.config.width - 100, game.config.height / 2, "boss");
    boss.setScale(2.2);  

    this.starsGroup = this.physics.add.group();



    this.bossHPText.setText(`Boss HP: ${this.bossHP}`);

    this.bossHPText = this.add.text(game.config.width - 150, 16, `Boss HP: ${this.bossHP}`, {
      fontSize: '24px',
      fill: '#ffffff'
    });

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 10,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 9 }),
      frameRate: 10,
      repeat: -1,
    });

    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.addBullets,
      callbackScope: this,
    });

  }

  shootSword() {
    if (this.score > 0) {
      this.sword.setPosition(this.dude.x, this.dude.y);
      this.sword.setVisible(true);

      this.tweens.add({
        targets: this.sword,
        x: boss.x, // Assuming boss is the boss character
        duration: 500,
        onComplete: () => {
          this.sword.setVisible(false);
        },
      });

      this.score--;
      this.scoreText.setText(this.score);
    }
  }

  
  hitBoss(sword, boss) {
    sword.disableBody(true, true);

    this.bossHP--;

    if (this.bossHP <= 0) {
      this.add.image(game.config.width / 2, game.config.height / 2, "win").setOrigin(0.5, 0.5);
    } else {
      this.bossHPText.setText(`Boss HP: ${this.bossHP}`);
    }
  }

  addBullets() {
    const bullet = this.bulletsGroup.create(game.config.width, Phaser.Math.Between(100, game.config.height - 100), "bullet");
    bullet.setVelocityX(-gameOptions.dudeSpeed);
  }

  hitByBullet(dude, bullet) {
    bullet.disableBody(true, true);
    this.lives--;
  
    if (this.lives > 0) {
      this.livesText.setText(this.lives);
    } else {
      this.scene.start("GameOver");
    }
  }

    update() {
      const { left, right, up } = this.cursors;
    
      this.dude.body.velocity.x = left.isDown ? -gameOptions.dudeSpeed : right.isDown ? gameOptions.dudeSpeed : 0;
      this.dude.anims.play(left.isDown ? "left" : right.isDown ? "right" : "turn", true);
    
      if (up.isDown && (this.dude.body.touching.down || this.doubleJumps < gameOptions.maxDoubleJumps)) {
        const jumpSound = this.sound.add("jumpSound");
        jumpSound.setVolume(0.5);
        jumpSound.play();
        this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6;
        if (!this.dude.body.touching.down) this.doubleJumps++;
      }

      if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
        this.shootSword();
      }

      if (this.dude.y > game.config.height) {
        this.lives--;
        this.livesText.setText(this.lives);
        if (this.lives <= 0) this.scene.start("GameOver");
        else {
          this.dude.x = 100;
          this.dude.y = game.config.height / 2;
          this.dude.setVelocity(0, 0);
        }
      }
    }
}