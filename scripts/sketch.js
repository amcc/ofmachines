let mobilenet;
let capture;
let probability;
let resultNumber;
let countDown = 5;
let receivedResult = false;

//pixelation
let img;
let squareSize = 0;
let camDiff = 0;
let camShortSide = 0;
let camWidth = 0;
let camHeight = 0;

//text
let predictionText1 = "";
let predictionText2 = "";
let predictionText3 = "";
let predictionPercentage1 = "";
let lemonPercentage1 = "";
let lemonPercentage2 = "";
let decimalPlaces = 3;
// alpha of the lemon words
let currentLemonValue = 0;
let lemonValue = 0;
let lerpRate = 0.4;

let root = document.documentElement;

function setup() {
  // put setup code here

  const canvasSide = canvasDimension();
  const canvas = createCanvas(canvasSide, canvasSide);
  canvas.parent("canvas-container");
  describe("pixellated image from the webcam or phone camera", FALLBACK);
  frameRate(15);
  capture = createCapture(
    {
      audio: false,
      video: {
        facingMode: "environment",
      },
    },
    function (e) {
      // do things when video ready
    }
  );
  capture.elt.setAttribute("playsinline", "");
  capture.hide();
  background(255);
  mobilenet = ml5.imageClassifier("MobileNet", capture, modelReady);

  // get text ready
  predictionText1 = select("#prediction-text-1");
  predictionText2 = select("#prediction-text-2");
  predictionText3 = select("#prediction-text-3");
  predictionPercentage1 = select("#prediction-percentage-1");
  predictionPercentage2 = select("#prediction-percentage-2");
  predictionPercentage3 = select("#prediction-percentage-3");
  lemonPercentage1 = select("#lemon-percentage-1");
  lemonText = select("#lemon-text");
  lemonPercentage2 = select("#lemon-percentage-2");
}

function draw() {
  makeCamImage();
  pixelate();
  // image(img, 0, 0, img.width * 23.4, img.height * 23.4);

  // background(0);
  // only predict every now and then
  // if (countDown == 0) {
  //   mobilenet.predict(1000, gotResult);
  //   countDown = 15;
  // }
  countDown--;
  // make the text
  fill(0);
  textFont("Roboto Condensed");
  textSize(height / 19);

  if (receivedResult && frameCount % 6 === 0) {
    mobilenet.predict(1000, gotResult);
    receivedResult = false;
  }

  // change the yellow of the lemon words
  lemonValue = lerp(lemonValue, currentLemonValue, lerpRate);
  root.style.setProperty("--lemon", `rgb(255, 255, 0, ${lemonValue})`);
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

    let predictionProbability1 = percentagise(results[0].probability, 0);
    let predictionProbability2 = percentagise(results[1].probability, 0);
    let predictionProbability3 = percentagise(results[2].probability, 0);

    let lemonProbability = percentagise(results[resultNumber].probability);

    let lemonProbabilityArray = splitToArray(results[resultNumber].probability);
    lemonPercentage1.html(`
    <span>${lemonProbabilityArray[0]}</span>
    <span>${lemonProbabilityArray[1]}</span>
    <span>.</span>
    <span>${lemonProbabilityArray[2]}</span>
    <span>${lemonProbabilityArray[3]}</span>
    <span>${lemonProbabilityArray[4]}</span>
    <span>%</span>`);

    // lemonPercentage1.html(`
    // <span>l</span>
    // <span>e</span>
    // <span>m</span>
    // <span>o</span>
    // <span>n</span>
    // <span></span>
    // <span></span>
    // <span></span>
    // <span>${lemonProbabilityArray[0] > 0 ? lemonProbabilityArray[0] : ""}</span>
    // <span>${lemonProbabilityArray[1]}</span>
    // <span>%</span>
    // `);

    predictionText1.html(results[0].className.split(",", 1) + ", ");
    predictionText2.html(results[1].className.split(",", 1) + ", ");
    predictionText3.html(results[2].className.split(",", 1));
    predictionPercentage1.html(predictionProbability1 + "%");
    predictionPercentage2.html(predictionProbability2 + "%");
    predictionPercentage3.html(predictionProbability3 + "%");
    if (resultNumber > 2) {
      lemonText.html("lemon");
      lemonPercentage2.html(lemonProbability + "%");
    } else {
      lemonText.html(" ");
      lemonPercentage2.html(" ");
    }

    //change yellow:
    currentLemonValue = results[resultNumber].probability.toFixed(3) * 10;

    //predict again:
    receivedResult = true;
    // noLoop();
  }
}

function percentagise(number, places = decimalPlaces) {
  const percentage = Math.round(number * 1000000) / 10000;
  const fixed = percentage.toFixed(places);
  if (fixed < 10) {
    return "0" + fixed;
  } else {
    return fixed;
  }
}

function splitToArray(number) {
  let limitedNumber = number.toFixed(decimalPlaces + 2);
  let split = String(limitedNumber).split(".")[1];
  let numberArray = [];
  for (let i = 0; i < decimalPlaces + 2; i++) {
    numberArray.push(split[i]);
  }
  return numberArray;
}

function makeCamImage() {
  // if (capture.width !== camWidth || capture.height !== camHeight) {
  //   debounce(() => getSizes());
  //   camWidth = capture.width;
  //   camHeight = capture.height;
  // }
  getSizes();
  // The capture element is initially smaller than it should be

  img = createImage(11, 11);

  if (capture.width > capture.height) {
    img.copy(capture, camDiff, 0, camShortSide, camShortSide, 0, 0, 11, 11);
  } else {
    img.copy(capture, 0, camDiff, camShortSide, camShortSide, 0, 0, 11, 11);
  }
}

function pixelate() {
  //to do - scale image down to 11px then go through all px
  if (img) {
    let pixImage = img.get();
    pixImage.loadPixels();
    // let step = Math.ceil(squareSize / 11);
    let step = squareSize / 11;
    let vScale = 1;

    for (let y = 0; y < pixImage.height; y += 1) {
      for (let x = 0; x < pixImage.width; x += 1) {
        let index = (x + y * pixImage.width) * 4;
        // let r = pixImage.pixels[index + 0] || 255;
        // let g = pixImage.pixels[index + 1] || 255;
        // let b = pixImage.pixels[index + 2] || 255;
        let r = pixImage.pixels[index + 0];
        let g = pixImage.pixels[index + 1];
        let b = pixImage.pixels[index + 2];
        noStroke();
        fill(r, g, b);
        // stroke(255);
        let rectSize = vScale * step;

        rect(x * vScale * step, y * vScale * step, rectSize, rectSize);
      }
    }
  }
}

function getSizes() {
  squareSize = width > height ? height : width;
  // camDiff =
  //   capture.width > capture.height
  //     ? Math.floor((capture.width - capture.height) / 2)
  //     : Math.floor((capture.height - capture.width) / 2);
  camDiff =
    capture.width > capture.height
      ? (capture.width - capture.height) / 2
      : (capture.height - capture.width) / 2;
  camShortSide =
    capture.width > capture.height ? capture.height : capture.width;
}

function canvasDimension() {
  const squarePercentage = Number(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--square-number"
    ) / 100
  );
  let shortWindowSide =
    windowWidth > windowHeight
      ? windowHeight * squarePercentage
      : windowWidth * squarePercentage;
  return shortWindowSide;
}

function windowResized() {
  const canvasSide = canvasDimension();
  resizeCanvas(canvasSide, canvasSide);
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
