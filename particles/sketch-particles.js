const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const particles = [];
const cursor = { x: 9999, y: 9999 };

let elCanvas;

const sketch = ({ width, height, canvas }) => {
  let x, y, particle;

  elCanvas = canvas;
  canvas.addEventListener('mousedown', onMouseDown);

  for (let i = 0; i < 1; i ++) {
    x = width * 0.5;
    y = height * 0.5;

    particle= new Particle({ x, y });
    particles.push(particle);
  }

  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    particles.forEach(particle => {
      particle.update();
      particle.draw(context);
    });
  };
};

onMouseDown = (e) => {
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  onMouseMove(e);
}

const onMouseMove = (e) => {
  const x = (e.offsetX / elCanvas.offsetWidth) * elCanvas.width;
  const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height;

  cursor.x = x;
  cursor.y = y;
}

const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  // Rather than nil-checking just the cursor far away from the so it has no effect
  cursor.x = 9999;
  cursor.y = 9999;
}

canvasSketch(sketch, settings);

class Particle {
  constructor({ x, y, radius = 10 }){
    // Position
    this.x = x;
    this.y = y;

    // Acceleration
    this.ax = 0;
    this.ay = 0;

    // velocity
    this.vx = 0;
    this.vy = 0;

    // inital position
    this.ix = x;
    this.iy = y;

    this.radius = radius;

    this.minDist = 100;
    this.pushFactor = 0.02;
    this.pullFactor = 0.004;
    this.dampingFactor = 0.95;
  }

  update() {
    let dx, dy, dd, distDelta;

    // pull force
    dx = this.ix - this.x;
    dy = this.iy - this.y;

    this.ax = dx * this.pullFactor;
    this.ay = dy * this.pullFactor;

    // Push force
    dx = this.x - cursor.x;
    dy = this.y - cursor.y;
    dd = Math.sqrt(dx * dx + dy * dy);

    distDelta = this.minDist - dd;

    if (dd < this.minDist) {
      // We want the accel to be larger the closer the cursor is, in other words
      // inversly proportional to the distance between particle and cursor
      // hence the delta
      this.ax += (dx / dd) * distDelta * this.pushFactor;
      this.ay += (dy / dd) * distDelta * this.pushFactor;
    }

    this.vx += this.ax;
    this.vy += this.ay;

    this.vx *= this.dampingFactor;
    this.vy *= this.dampingFactor;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y );
    context.fillStyle = 'white';

    context.beginPath();
    context.arc(0, 0, this.radius, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}
