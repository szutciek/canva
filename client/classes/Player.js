const maxS = 15;
const diff = 1;

const f = (x) => {
  // 2 is vert stretch, 1 is horizontal translation, using change of base
  return (10 * (15 * Math.log(x + 1))) / Math.log(8);
};

const lerp = (s, e, t) => {
  return (1 - t) * s + t * e;
};

export default class Player {
  #x = 0;
  #y = 0;

  prevPos = undefined;

  #w = 100;
  #h = 200;

  velX = 0;
  velY = 0;

  #inpE = false;
  #inpW = false;
  #inpN = false;
  #inpS = false;

  pose = {
    crouching: false,
    madLeft: false,
    madRight: false,
  };

  animationMovement = {
    state: "idle",
    left: {
      disp: 0,
      returning: false,
    },
    right: {
      disp: 0,
      returning: false,
    },
  };

  lastTimeStamp = undefined;

  audio = [];

  constructor(position = [0, 0, 100, 200], username = "Anonymous") {
    this.#x = position[0];
    this.#y = position[1];
    this.#w = position[2];
    this.#h = position[3];

    this.username = username;
  }

  addAudioBlob(blob) {
    this.audio.push(blob);
  }

  subtractVelocity = () => {
    if (!this.pose.crouching) {
      if (!this.#inpS && !this.#inpN) {
        this.velY = lerp(this.velY, 0, 0.1);
      }
      if (!this.#inpW && !this.#inpE) {
        this.velX = lerp(this.velX, 0, 0.1);
      }
    } else {
      if (!this.#inpS && !this.#inpN) {
        this.velY = lerp(this.velY, 0, 0.3);
      }
      if (!this.#inpW && !this.#inpE) {
        this.velX = lerp(this.velX, 0, 0.3);
      }
    }
  };
  addVelocity = () => {
    let currentMax = maxS;
    if (this.pose.crouching) currentMax /= 20;

    if (this.#inpN && this.velY > -currentMax) {
      this.velY -= diff;
    }
    if (this.#inpS && this.velY < currentMax) {
      this.velY += diff;
    }
    if (this.#inpE && this.velX < currentMax) {
      this.velX += diff;
    }
    if (this.#inpW && this.velX > -currentMax) {
      this.velX -= diff;
    }

    if (Math.abs(this.velX) > currentMax) {
      this.velX = Math.sign(this.velX) * currentMax;
    }
    if (Math.abs(this.velY) > currentMax) {
      this.velY = Math.sign(this.velY) * currentMax;
    }

    if (Math.abs(this.velX) < 0.1) {
      this.velX = 0;
    }
    if (Math.abs(this.velY) < 0.1) {
      this.velY = 0;
    }
  };

  activateMovement() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }
  deactivateMovement() {
    this.#inpN = false;
    this.#inpS = false;
    this.#inpW = false;
    this.#inpE = false;
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown = (e) => {
    if (e.key === "w" || e.key === "W") {
      this.#inpN = true;
    }
    if (e.key === "s" || e.key === "S") {
      this.#inpS = true;
    }
    if (e.key === "a" || e.key === "A") {
      this.#inpW = true;
    }
    if (e.key === "d" || e.key === "D") {
      this.#inpE = true;
    }

    if (e.key === "Shift") {
      this.pose.crouching = true;

      // // doesnt work with current collisions
      // if (this.#h !== 150) this.#y += 50;
      // this.#h = 150;
    }
  };

  handleKeyUp = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (e.key === "w" || e.key === "W") {
      this.#inpN = false;
    }
    if (e.key === "s" || e.key === "S") {
      this.#inpS = false;
    }
    if (e.key === "a" || e.key === "A") {
      this.#inpW = false;
    }
    if (e.key === "d" || e.key === "D") {
      this.#inpE = false;
    }

    if (e.key === "Shift") {
      this.pose.crouching = false;

      // // doesnt work with current collisions
      // if (this.#h !== 200 && this.nothing50Above()) {
      //   this.#y -= 50;
      // }
      // this.#h = 200;
    }
  };

  serverOverride({ x, y, w, h }) {
    this.#x = x;
    this.#y = y;
    this.#w = w;
    this.#h = h;
  }

  rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x2 >= w1 + x1 || x1 >= w2 + x2 || y2 >= h1 + y1 || y1 >= h2 + y2) {
      return false;
    }
    return true;
  }

  collisionDetectionSAT(target) {
    if (target.shape === "rect" || target.shape === "player") {
      // if not colliding and is not a player return
      if (!target.colliding && target.shape !== "player") return;

      if (
        !this.rectIntersect(
          this.#x,
          this.#y,
          this.#w,
          this.#h,
          target.xMap,
          target.yMap,
          target.w,
          target.h
        )
      )
        return;

      const halfWidthPlayerX = this.#w / 2;
      const halfWidthTargetX = target.w / 2;

      const centerPlayerX = this.#x + halfWidthPlayerX;
      const centerTargetX = target.xMap + halfWidthTargetX;

      const diffX = centerTargetX - centerPlayerX;
      const gapX = diffX - halfWidthPlayerX - halfWidthTargetX;

      const halfHeightPlayer = this.#h / 2;
      const halfHeightTarget = target.h / 2;

      const centerPlayerY = this.#y + halfHeightPlayer;
      const centerTargetY = target.yMap + halfHeightTarget;

      const diffY = centerTargetY - centerPlayerY;
      const gapY = diffY - halfHeightPlayer - halfHeightTarget;

      const determineDisplacement = (gap, playerDimension, targetDimension) => {
        let min = gap;

        const other = gap + playerDimension + targetDimension;
        if (other < Math.abs(min)) min = other;

        return min;
      };

      const xDisp = determineDisplacement(gapX, this.#w, target.w);
      const yDisp = determineDisplacement(gapY, this.#h, target.h);

      if (Math.abs(yDisp) < Math.abs(xDisp)) {
        this.velY = 0;
        this.#y += yDisp;
      } else {
        this.velX = 0;
        this.#x += xDisp;
      }

      return;
    } else if (target.shape === "circ") {
      // if not colliding return
      if (!target.colliding) return;

      return;
    }
  }

  performMovement = (secondsPassed) => {
    this.#x += Math.sign(this.velX) * f(Math.abs(this.velX * secondsPassed));
    this.#y += Math.sign(this.velY) * f(Math.abs(this.velY * secondsPassed));

    this.updateAnimation();

    document.getElementById("position").innerText = `${Math.floor(
      this.#x
    )}, ${Math.floor(this.#y)}`;
  };

  updateAnimation() {
    if (this.velX) {
      if (this.animationMovement.state === "idle") {
        if (this.velX < 0) {
          this.animationMovement.left.returning = true;
          this.animationMovement.left.disp = -30;
        } else {
          this.animationMovement.right.returning = true;
          this.animationMovement.right.disp = 30;
        }
      }

      this.animationMovement.state = "moving";

      if (this.animationMovement.left.returning) {
        this.animationMovement.left.disp -= this.velX / 2;
      } else {
        this.animationMovement.left.disp += this.velX / 10;
      }

      if (this.animationMovement.left.disp > 30) {
        this.animationMovement.left.disp = 30;
        if (!this.animationMovement.left.returning) {
          this.animationMovement.left.returning = true;
        } else {
          this.animationMovement.left.returning = false;
        }
      }
      if (this.animationMovement.left.disp < -30) {
        this.animationMovement.left.disp = -30;
        if (!this.animationMovement.left.returning) {
          this.animationMovement.left.returning = true;
        } else {
          this.animationMovement.left.returning = false;
        }
      }

      if (this.animationMovement.right.returning) {
        this.animationMovement.right.disp -= this.velX / 2;
      } else {
        this.animationMovement.right.disp += this.velX / 10;
      }

      if (this.animationMovement.right.disp > 30) {
        this.animationMovement.right.disp = 30;
        if (!this.animationMovement.right.returning) {
          this.animationMovement.right.returning = true;
        } else {
          this.animationMovement.right.returning = false;
        }
      }
      if (this.animationMovement.right.disp < -30) {
        this.animationMovement.right.disp = -30;
        if (!this.animationMovement.right.returning) {
          this.animationMovement.right.returning = true;
        } else {
          this.animationMovement.right.returning = false;
        }
      }
    } else {
      this.animationMovement = {
        state: "idle",
        left: {
          disp: 0,
          returning: false,
        },
        right: {
          disp: 0,
          returning: false,
        },
      };
    }
  }

  get x() {
    return this.#x;
  }
  get y() {
    return this.#y;
  }
  get w() {
    return this.#w;
  }
  get h() {
    return this.#h;
  }

  get position() {
    return {
      x: this.#x,
      y: this.#y,
      w: this.#w,
      h: this.#h,
    };
  }
  get velocities() {
    return {
      x: this.velX,
      y: this.velY,
    };
  }
  get inputs() {
    return {
      n: this.#inpN,
      e: this.#inpE,
      s: this.#inpS,
      w: this.#inpW,
    };
  }

  get latestAudio() {
    return this.audio[this.audio.length - 1];
  }
}
