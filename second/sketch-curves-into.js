const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
};

let elCanvas;
let points;

// Cursor interaction:
// Add event listeners
// Add event handlers
// Calculate cursor positions with scaling
// Update whatever with cursor position
const sketch = ({ canvas }) => {
  points = [
    new Point({ x: 200, y: 540}),
    new Point({ x: 400, y: 400, control: true}),
    new Point({ x: 880, y: 540}),
  ];

  elCanvas = canvas;

  canvas.addEventListener('mousedown', onMouseDown);

  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    context.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
    context.stroke();

    points.forEach(point => {
      point.draw(context);
    });
  };
};

const onMouseDown = (e) => {
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  const x = (e.offsetX / elCanvas.offsetWidth) * elCanvas.width;
  const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height;

  // Are we over any points?
  points.forEach(point => {
    point.isDragging = point.hitTest(x, y);
  });
}

const onMouseMove = (e) => {
  // This is needed to get the x,y position accounting for canvas scaling by browser
  const x = (e.offsetX / elCanvas.offsetWidth) * elCanvas.width;
  const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height;

  points.forEach(point => {
    if (point.isDragging) {
      point.x = x;
      point.y = y;
    }
  });
}

const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

canvasSketch(sketch, settings);

class Point {
  constructor({x, y, control = false}) {
    this.x = x;
    this.y = y;
    this.control = control;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.fillStyle = this.control ? 'red' : 'black';

    context.beginPath();
    context.arc(0, 0, 10, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  // Use trig to get the distance between two points.
  // We can get the distance between their X and Y components easily
  // with simple arithmatic, and use pythagoras to get the distance 
  // between the two points.
  // The it's just a simple check if it's inside the circle radius, or
  // slighlty larger in this case to make it easier to grab
  hitTest(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dd = Math.sqrt(dx * dx + dy * dy);

    return dd < 20;
  }
}
