const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const eases = require('eases');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let minDB, maxDB;

const sketch = () => {
  const numCircles = 5;
  const numSlices = 9;
  const slice = Math.PI * 2 / numSlices; // Size of a slice, in radians
  const radius = 200;

  const bins = [];
  const lineWidths = [];

  let lineWidth, bin, mapped;

  // Loop through all the slices picking a random frequency bin for each one
  // the 60 bins at the start of the range is arbitrary
  // FFT produces a lot more diverse values at the start of the range
  // for reasons I don't understand
  // Basically I think a lot of sound ends up getting represented in the lower frequency ranges
  //
  // Delete half of them to give a checkerboard pattern
  for (let i = 0; i < numCircles * numSlices; i++) {
    bin = random.rangeFloor(4, 64);
    if (random.value() > 0.5) bin = 0;
    bins.push(bin);
  }

  // Get sizes for the segments using an easing function so they are somewhat
  // close together
  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    lineWidth = eases.quadIn(t) * 200 + 20;
    lineWidths.push(lineWidth);
  }

  return ({ context, width, height }) => {
    context.fillStyle = '#EEEAE0'; // Offwhite
    context.fillRect(0, 0, width, height);

    if (!audioContext) return;

    // FFT analysis of the frequency data for the current "frame"
    // (or whatever audio calls a moment)
    // This ends up as an array of floats. I think the idea is
    // each index corrisponds to a frequency and the number
    // corrisponds to the magnitude (amplitude)
    analyserNode.getFloatFrequencyData(audioData);	

    context.save();
    context.translate(width * 0.5, height * 0.5);

    let cradius = radius;

    for (let i = 0; i < numCircles; i++) {
      context.save();

      for (let j = 0; j < numSlices; j++) {
        context.rotate(slice);
        context.lineWidth = lineWidths[i];

        bin = bins[i * numSlices + j];
        if (!bin) continue; // Ignore 0s to produce checker pattern

        mapped = math.mapRange(audioData[bin], minDB, maxDB, 0, 1, true);

        lineWidth = lineWidths[i] * mapped;
        if (lineWidth < 1) continue; // If the lineWidth is invalid ( < 1 I think ) it causes the drawing to stutter

        context.lineWidth = lineWidth;

        context.beginPath();
        context.arc(0, 0, cradius + context.lineWidth * 0.5, 0, slice);
        context.stroke();
      }

      cradius += lineWidths[i];

      context.restore();
    }
    context.restore();
  };
};

const addListeners = () => {
  window.addEventListener('mouseup', () => {
    if (!audioContext) createAudio(); // We have to create the audio conext inside a listener. Browsers demand
    // some human interaction before you can play audio

    if (audio.paused) {
      audio.play();
      manager.play();
    } else {
      audio.pause();
      manager.pause();
    }
  });
};

const createAudio = () => {
  audio = document.createElement('audio'); // Not added to page, we just need a DOM element to get at the API

  audio.src = 'sounds/Skizologic - Robotized.mp3';

  audioContext = new AudioContext();

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(audioContext.destination);

  analyserNode = audioContext.createAnalyser();
  //  analyserNode.fftSize = 512;
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.9;
  sourceNode.connect(analyserNode);


  minDB = analyserNode.minDecibels;
  maxDB = analyserNode.maxDecibels;

  audioData = new Float32Array(analyserNode.frequencyBinCount);
};

const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
};

start();
