const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const eases = require('eases');
const math= require('canvas-sketch-util/math');
const colormap = require('colormap');
const interpolate = require('color-interpolate');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const particles = [];
const cursor = { x: 9999, y: 9999 };

const colors = colormap({
  colormap: 'viridis',
  nshades: 20,
});

let elCanvas;
let imgA, imgB;

const sketch = ({ width, height, canvas }) => {
  let x, y, particle, radius;

  const imgACanvas = document.createElement('canvas');
  const imgAContext = imgACanvas.getContext('2d');

  imgACanvas.width = imgA.width;
  imgACanvas.height = imgA.height;

  imgAContext.drawImage(imgA, 0, 0);

  const imgAData = imgAContext.getImageData(0, 0, imgA.width, imgA.height).data;

  const imgBCanvas = document.createElement('canvas');
  const imgBContext = imgBCanvas.getContext('2d');

  imgBCanvas.width = imgB.width;
  imgBCanvas.height = imgB.height;
imgBContext.drawImage(imgB, 0, 0); const imgBData = imgBContext.getImageData(0, 0, imgB.width, imgB.height).data; let pos = [];

  const numCircles = 30;
  const gapCircle = 4;
  const gapDot = 2;
  let dotRadius = 8;
  let cirRadius = 0;
  const fitRadius = dotRadius;

  elCanvas = canvas;
  canvas.addEventListener('mousedown', onMouseDown);

  for (let i = 0; i < numCircles; i++) {
    const circumference = Math.PI * 2 * cirRadius;
    const numFit = i ? Math.floor(circumference / (fitRadius * 2 + gapDot)) : 1;
    const fitSlice = Math.PI * 2 / numFit;
    let ix, iy, idx, r, g, b, colA, colB, colMap;

    for (let j = 0; j < numFit; j++) {
      const theta = fitSlice * j;

      x = Math.cos(theta) * cirRadius;
      y = Math.sin(theta) * cirRadius;

      x += width * 0.5;
      y += height * 0.5;

      // Position of pixel in image we want to sample
      ix = Math.floor((x / width) * imgA.width);
      iy = Math.floor((y / height) * imgA.height);
      idx = (iy * imgA.width + ix) * 4; // Image is a big array

      r = imgAData[idx + 0];
      g = imgAData[idx + 1];
      b = imgAData[idx + 2];
      colA = `rgb(${r}, ${g}, ${b})`

      // radius = dotRadius;
      radius = math.mapRange(b, 0, 255, 1, 12);

      // Position of pixel in image we want to sample
      bx = Math.floor((x / width) * imgB.width);
      by = Math.floor((y / height) * imgB.height);
      bdx = (iy * imgB.width + ix) * 4; // Image is a big array

      r = imgBData[bdx + 0];
      g = imgBData[bdx + 1];
      b = imgBData[bdx + 2];
      colB = `rgb(${r}, ${g}, ${b})`

      colMap = interpolate([colA, colB]);

      particle = new Particle({x, y, radius, colMap});
      particles.push(particle);
    }

    cirRadius += fitRadius * 2 + gapCircle;
    dotRadius = (1 - eases.quadOut(i / numCircles)) * fitRadius;
  }

  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

//    context.drawImage(imgACanvas, 0, 0);

    particles.sort((a, b) => a.scale - b.scale);

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

const loadImage = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });
};

const start = async () => {
  imgA = await loadImage('img/2.jpg');
  imgB = await loadImage('img/bal.jpg');

  canvasSketch(sketch, settings);
}

start();

class Particle {
  constructor({ x, y, radius = 10, colA, colMap }){
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
    this.scale = 1;
    this.colMap = colMap;
    this.color = colMap[0];

    this.minDist = random.range(100, 200);
    this.pushFactor = random.range(0.01, 0.02);
    this.pullFactor = random.range(0.002, 0.004);
    this.dampingFactor = random.range(0.90, 0.95);
  }

  update() {
    let dx, dy, dd, distDelta;
    let idxColor;

    // pull force
    dx = this.ix - this.x;
    dy = this.iy - this.y;
    dd = Math.sqrt(dx * dx + dy * dy);

    this.ax = dx * this.pullFactor;
    this.ay = dy * this.pullFactor;

    this.scale = math.mapRange(dd, 0, 200, 1, 5);

    // idxColor = Math.floor(math.mapRange(dd, 0, 200, 0, colors.length - 1, true));
    // this.color = colors[idxColor];

    this.color = this.colMap(math.mapRange(dd, 0, 200, 0, 1, true));

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
    context.fillStyle = this.color;

    context.beginPath();
    context.arc(0, 0, this.radius * this.scale, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}
