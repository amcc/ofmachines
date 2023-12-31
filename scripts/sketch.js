let mobilenet;
let capture;
let captureEvent;
let probability;
let resultNumber;
let receivedResult = false;
let animFrameRate = 15;
let screenOrientation = "unset";

// webcam restart technique
let allBlack = 0;

//pixelation
let gridSize = 11;
let img;
let squareSize = 0;
let camDiff = 0;
let camShortSide = 0;
let camWidth = 0;
let camHeight = 0;
let loadedCamera;

//text
let lemonProbability;
let predictionText1 = "";
let predictionText2 = "";
let predictionText3 = "";
let firstPrediction;
let secondPrediction;
let thirdPrediction;
let predictionTexts;
let predictionPercentage1 = "";
let lemonPercentage1 = "";
let lemonPercentage2 = "";
let lemonPercentage;
let decimalPlaces = 3;
// alpha of the lemon words
let currentLemonValue = 0;
let lemonValue = 0;
let lerpRate = 0.4;

let mouseDownTimer = 0;
let canTakeImage = true;

// info
// info and download buttons for the html
let camera;

let root = document.documentElement;

function setup() {
  // console.log(document.body, root);
  // put setup code here

  const canvasSide = canvasDimension();
  const canvas = createCanvas(canvasSide, canvasSide);
  canvas.parent("canvas-container");
  // describe("pixellated image from the webcam or phone camera", FALLBACK);
  frameRate(animFrameRate);

  captureWebcam();

  background(255);
  mobilenet = ml5.imageClassifier("MobileNet", capture, modelReady);

  // get text ready
  predictionPercentage1 = select("#prediction-percentage-1");
  predictionPercentage2 = select("#prediction-percentage-2");
  predictionPercentage3 = select("#prediction-percentage-3");
  lemonPercentage1 = select("#lemon-percentage-1");
  lemonText = select("#lemon-text");
  lemonPercentage2 = select("#lemon-percentage-2");

  firstPrediction = selectAll(".firstPredictionText");
  secondPrediction = selectAll(".secondPredictionText");
  thirdPrediction = selectAll(".thirdPredictionText");
  lemonPercentage = selectAll(".lemonPercentage");
  predictionTexts = [firstPrediction, secondPrediction, thirdPrediction];

  // info / download button stuff
  document.getElementById("camera").addEventListener("click", takePicture);
}

function captureWebcam() {
  capture = createCapture(
    {
      audio: false,
      video: {
        facingMode: "environment",
      },
    },
    function (e) {
      captureEvent = e;
      // do things when video ready
      // until then, the video element will have no dimensions, or default 640x480
      setCameraDimensions();
    }
  );
  capture.elt.setAttribute("playsinline", "");
  capture.hide();
}

function draw() {
  // check orientation
  if (
    screenOrientation !== screen.orientation.type.match(/\w+/)[0] &&
    screenOrientation !== "unset"
  ) {
    console.log("reload");
    location.reload();
  }

  screenOrientation = screen.orientation.type.match(/\w+/)[0];

  // the camera is loaded with correct sizes here, we must wait
  // default when camera is loaded is landscape and 640 x 480, but it will
  // show correct settings when loaded
  if (loadedCamera && capture) makeCamImage();
  pixelate();
  // image(img, 0, 0, img.width * 23.4, img.height * 23.4);

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

function makeCamImage() {
  getSizes();

  img = createImage(gridSize, gridSize);

  if (screenOrientation === "landscape" || screenOrientation === "unset") {
    // if (loadedCamera.width > loadedCamera.height) {
    img.copy(
      capture,
      camDiff,
      0,
      camShortSide,
      camShortSide,
      0,
      0,
      gridSize,
      gridSize
    );
  } else {
    img.copy(
      capture,
      0,
      camDiff,
      camShortSide,
      camShortSide,
      0,
      0,
      gridSize,
      gridSize
    );
  }

  image(capture, 0, 0, width, height);
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

    lemonProbability = percentagise(results[resultNumber].probability);

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

    // loop through prediction classes
    predictionTexts.forEach((text, index) => {
      text.forEach((element) => {
        element.html(results[index].className.split(",", 1));
      });
    });

    lemonPercentage.forEach((element) => {
      element.html(lemonProbability + "%");
    });

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

function pixelate() {
  //to do - scale image down to 11px then go through all px
  if (img) {
    let pixImage = img.get();
    pixImage.loadPixels();
    // let step = Math.ceil(squareSize / 11);
    let step = squareSize / gridSize;
    let vScale = 1;

    allBlack = 0;
    for (let y = 0; y < pixImage.height; y += 1) {
      for (let x = 0; x < pixImage.width; x += 1) {
        let index = (x + y * pixImage.width) * 4;
        // let r = pixImage.pixels[index + 0] || 255;
        // let g = pixImage.pixels[index + 1] || 255;
        // let b = pixImage.pixels[index + 2] || 255;
        let r = pixImage.pixels[index + 0];
        let g = pixImage.pixels[index + 1];
        let b = pixImage.pixels[index + 2];
        allBlack += r + g + b;
        noStroke();
        fill(r, g, b);
        // stroke(255);
        let rectSize = vScale * step;

        rect(x * vScale * step, y * vScale * step, rectSize, rectSize);
      }
    }
    if (allBlack === 0 && frameCount % animFrameRate === 0) {
      captureWebcam();
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

function setCameraDimensions() {
  loadedCamera = captureEvent.getTracks()[0].getSettings();
  console.log("cameraDimensions", loadedCamera);
}

function windowResized() {
  // capture = null;
  // captureWebcam();
  const canvasSide = canvasDimension();
  resizeCanvas(canvasSide, canvasSide);
  debounce(() => getSizes());
  // debounce(() => captureWebcam());
  // debounce(() => setCameraDimensions());
  setCameraDimensions();
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

const captureScreen = async () => {
  const predictionArea = document.getElementById("prediction-area");
  html2canvas(predictionArea).then(function (canvas) {
    // console.log(canvas);
    simulateDownloadImageClick(
      canvas.toDataURL(),
      "learning to see lemon " + lemonProbability + "%.png"
    );
  });

  function simulateDownloadImageClick(uri, filename) {
    var link = document.createElement("a");
    if (typeof link.download !== "string") {
      window.open(uri);
    } else {
      link.href = uri;
      link.download = filename;
      accountForFirefox(clickLink, link);
    }
  }

  function clickLink(link) {
    link.click();
  }

  function accountForFirefox(click) {
    // wrapper function
    let link = arguments[1];
    document.body.appendChild(link);
    click(link);
    document.body.removeChild(link);
  }
};

function takePicture() {
  console.log("snap");
  // if (allBlack && lemonProbability) {
  captureScreen();
  // }
}
