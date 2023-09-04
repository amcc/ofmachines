let mobilenet;
let capture;
let label;
let probability;
let resultNumber;
let countDown = 5;

//pixelation
let img;
let squareSize = 0;
let camDiff = 0;
let camShortSide = 0;
let camWidth = 0;
let camHeight = 0;

//text
let predictionText = "";
let predictionPercentage = "";
let lemonPercentage = "";

let facingMode = "not set";
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: { exact: "environment" },
      },
    })
    .then(function (stream) {
      console.log("video loaded environment");
      facingMode = "environment";
    })
    .catch(function (err0r) {
      console.log("Something went wrong with environment!");
      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then(function (stream) {
          console.log("video loaded user");
          facingMode = "user";
        })
        .catch(function (err0r) {
          console.log("Something went wrong with user!");
        });
    });
}

function setup() {
  // put setup code here
  let shortWindowSide = windowWidth > windowHeight ? windowHeight : windowWidth;
  const canvas = createCanvas(shortWindowSide, shortWindowSide);
  canvas.parent("canvas-container");
  label = "loading AI model";
  capture = createCapture(
    {
      audio: false,
      video: {
        facingMode: "environment",
      },
    },
    function (e) {
      // do things when video ready
      console.log("loaded", e);
    }
  );
  capture.elt.setAttribute("playsinline", "");
  console.log(capture);
  capture.hide();
  background(0);
  mobilenet = ml5.imageClassifier("MobileNet", capture, modelReady);

  // get text ready
  predictionText = select("#prediction-text");
  predictionPercentage = select("#prediction-percentage");
  lemonPercentage = select("#lemon-percentage");
  facingModeText = select("#facing-mode");
}

function draw() {
  makeCamImage();
  // image(img, 0, 0, squareSize, squareSize);
  pixelate();

  // background(0);
  // only predict every now and then
  if (countDown == 0) {
    mobilenet.predict(1000, gotResult);
    countDown = 15;
  }
  countDown--;
  // make the text
  fill(0);
  textFont("Roboto Condensed");
  textSize(height / 19);
  // text(label, 20, height / 2);
}

function search(nameKey, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].className === nameKey) {
      return i;
    }
  }
}

function modelReady() {
  mobilenet.predict(1000, gotResult);
}

function gotResult(error, results) {
  if (error) {
    console.error(error);
  } else {
    resultNumber = search("lemon", results);

    let predictionProbability = percentagise(results[0].probability);
    // Math.round(results[0].probability * 1000000) / 10000;
    // predictionProbability = predictionProbability.toFixed(3);

    let lemonProbability = percentagise(results[resultNumber].probability);
    // Math.round(results[resultNumber].probability * 1000000) / 10000;

    predictionText.html(results[0].className);
    predictionPercentage.html(predictionProbability + "%");
    lemonPercentage.html(lemonProbability + "%");
    facingModeText.html(facingMode);
  }
}

function percentagise(number) {
  const percentage = Math.round(number * 1000000) / 10000;
  const fixed = percentage.toFixed(3);
  if (fixed < 10) {
    return "0" + fixed;
  } else {
    return fixed;
  }
}

function makeCamImage() {
  if (capture.width !== camWidth || capture.height !== camHeight) {
    debounce(() => getSizes());
    camWidth = capture.width;
    camHeight = capture.height;
  }
  getSizes();
  // The capture element is initially smaller than it should be

  img = createImage(squareSize, squareSize);

  img.copy(
    capture,
    camDiff,
    0,
    camShortSide,
    camShortSide,
    0,
    0,
    squareSize,
    squareSize
  );
}

function pixelate() {
  if (img) {
    let pixImage = img.get();
    pixImage.loadPixels();
    let step = Math.ceil(squareSize / 11);
    let vScale = 1;
    for (var y = 0; y < pixImage.height; y += step) {
      for (var x = 0; x < pixImage.width; x += step) {
        var index = (x + y * pixImage.width) * 4;
        var r = pixImage.pixels[index + 0];
        var g = pixImage.pixels[index + 1];
        var b = pixImage.pixels[index + 2];
        // var bright = (r + g + b) / 3;
        noStroke();
        fill(r, g, b);
        // rectMode(CENTER);
        let rectSize = vScale * step;

        // rect(
        //   squareSize - x * vScale - rectSize,
        //   y * vScale,
        //   rectSize,
        //   rectSize
        // );
        rect(x * vScale, y * vScale, rectSize, rectSize);
      }
    }
  }
}

function getSizes() {
  squareSize = width > height ? height : width;
  camDiff =
    capture.width > capture.height
      ? Math.floor((capture.width - capture.height) / 2)
      : Math.floor((capture.height - capture.width) / 2);
  camShortSide =
    capture.width > capture.height ? capture.height : capture.width;
}

function windowResized() {
  let shortWindowSide = windowWidth > windowHeight ? windowHeight : windowWidth;
  resizeCanvas(shortWindowSide, shortWindowSide);
  debounce(() => getSizes());
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
