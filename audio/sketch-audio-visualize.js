const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const eases = require('eases');

const settings = {
  dimensions: [ 2048, 2048 ],
  animate: true
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let mindDB, maxDB;

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
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
  sourceNode.connect(analyserNode);


  mindDB = analyserNode.minDecibles;
  maxDB = analyserNode.maxDecibles;

  audioData = new Float32Array(analyserNode.frequencyBinCount);
}

const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
};

start();
