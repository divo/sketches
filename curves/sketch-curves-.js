const canvasSketch = require('canvas-sketch'); 
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const colormap = require('colormap');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
};

const sketch = ({ width, height }) => {
  const cols = 80;
  const rows = 80;
  const numCells = cols * rows;

  // grid
  const gw = width * 0.8;
  const gh = height * 0.8;

  //cells
  const cw = gw / cols;
  const ch = gh / rows;

  // Margins
  const mx = (width - gw) * 0.5;
  const my = (height - gh) * 0.5;


  const points = [];

  let x, y;

  let n;
  let frequency = 0.002;
  let amplitude = 90;
  let color;

  const colors = colormap({
    colormap: 'salinity',
    nshades: amplitude,
  });

  let lineWidth;

  for (let i = 0; i < numCells; i++) {
    x = (i % cols) * cw;
    y = Math.floor(i / cols) * ch;

    n = random.noise2D(x, y, frequency, amplitude);
//    x += n;
//    y += n;

    lineWidth = math.mapRange(n, -amplitude, amplitude, 2, 5);

    color = colors[Math.floor(math.mapRange(n, -amplitude, amplitude, 0, amplitude))];

    points.push(new Point({ x, y, lineWidth, color }));
  }

  return ({ context, width, height, frame }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    context.save();
    context.translate(mx, my); // Add margin
    context.translate( cw * 0.5, ch * 0.5 ); // Draw from center of cell
    context.lineWidth = 4;

    points.forEach(point => {
      // how the fuck does this produce a gradient of values over time????
      // Ok, so without understanding the math it does create a sequence of numbers
      // that are ordered in some way
      n = random.noise2D(point.ix + frame * 3, point.iy, frequency, amplitude);
      point.x = point.ix + n;
      point.y = point.iy + n;
    });

    let lastx, lasty;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c ++ ){
        const curr = points[r * cols + c + 0]; // +0 to make clear this is current point. Not clear
        const next = points[r * cols + c + 1];

        // This is a technique to string together multiple curves into one seamless one. 
        // It works by treating the mid point between two points as the anchor points
        // and the points themselves as the control points.
        const mx = curr.x + (next.x - curr.x) * 0.5; // Current position + half the distance to the next point
        const my = curr.y + (next.y - curr.y) * 0.5; // Current position + half the distance to the next point

        if (!c) {
          lastx = curr.x;
          lasty = curr.y;
        }

        context.beginPath();
        context.lineWidth = curr.lineWidth;
        context.strokeStyle = curr.color;

        context.moveTo(lastx, lasty);
        context.quadraticCurveTo(curr.x, curr.y, mx, my);

        context.stroke();

        lastx = mx - c / cols * 250;
        lasty =  my  - r / rows * 250;
      }

    }

    points.forEach(point => {
//      point.draw(context);
    });

    context.restore();
  };
};

canvasSketch(sketch, settings);

class Point {
  constructor({x, y, lineWidth, color}) {
    this.x = x;
    this.y = y;
    this.lineWidth = lineWidth;
    this.color = color;

    this.ix = x;
    this.iy = y;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.fillStyle = 'red';

    context.beginPath();
    context.arc(0, 0, 10, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
