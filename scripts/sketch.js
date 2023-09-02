let mobilenet;
let video;
let label;
let probability;
let resultOne = false;
let resultNumber;
let countDown = 5;
let easing = 0.05;
let barLength = 0;
let lemonBar = 0;
let videoLoaded;

//pixelation
let img;
let vScale = 10;
let grid = 11;
let slider;

function modelReady() {
  console.log("model is ready");
  mobilenet.predict(1000, gotResult);
}
// function imageReady() {
//   image(puffin, 0,0,width, height);
// }

function gotResult(error, results) {
  if (error) {
    // console.error(error)
  } else {
    if (!resultOne) {
      // console.log(results);
      resultOne = true;
    }

    resultNumber = search("lemon", results);
    // console.log('search = ' + resultNumber);

    label = results[0].className;
    label += "\n";
    var firstProb = Math.round(results[0].probability * 1000000) / 10000;
    firstProb = firstProb.toFixed(3);
    if (firstProb < 10) {
      firstProb = "0" + firstProb;
    }
    label += firstProb + "%";
    label += "\n";
    label += results[resultNumber].className;
    label += "\n";
    var secondProb =
      Math.round(results[resultNumber].probability * 1000000) / 10000;
    secondProb = Math.abs(secondProb.toFixed(3));
    if (secondProb < 10) {
      secondProb = "0" + secondProb;
    }
    label += secondProb + "%";

    // label += "\n";
    // label += resultNumber + " - " + (1000-resultNumber)/10 + "%";

    // bar length as number out of 1000
    // barLength = (1000-resultNumber)/1000 * width;

    // bar length as percentage of best guess
    barLength =
      (results[resultNumber].probability / results[0].probability) * width;
    // bar length as percentage of best guess with a bit of position
    // barLength = results[resultNumber].probability/results[0].probability * width;
  }
}

function setup() {
  // put setup code here
  createCanvas(windowWidth, windowHeight);
  // console.log("the width is " + width + " and the height is " + height);
  label = "loading AI model";
  video = createCapture(
    {
      audio: false,
      video: {
        facingMode: "environment",
      },
    },
    function () {
      // videoLoaded = true;
      // console.log('capture ready.')
    }
  );
  video.elt.setAttribute("playsinline", "");
  video.hide();
  // video.size(w, h);
  // canvas = createCanvas(w, h);
  // video = createCapture(constraints);
  // video.hide();
  background(0);
  mobilenet = ml5.imageClassifier("MobileNet", video, modelReady);
}

function draw() {
  clear();

  let grid = 11;
  let img = video.loadPixels();
  let landscape = img.width > img.height;
  let sideDif = landscape ? img.width - img.height : img.height - img.width;

  let step = landscape ? Math.ceil(img.height / 11) : Math.ceil(img.width / 11);
  console.log(step, img.width, img.height);

  let vScale = Math.floor(width / img.width) / 1.1;

  for (var y = 0; y < img.height; y += step) {
    for (var x = sideDif / 2; x < img.width - sideDif / 2; x += step) {
      var index = (img.width - x + 1 + y * img.width) * 4;
      var r = img.pixels[index + 0];
      var g = img.pixels[index + 1];
      var b = img.pixels[index + 2];
      var bright = (r + g + b) / 3;
      noStroke();
      fill(r, g, b);
      // rectMode(CENTER);
      rect(x * vScale, y * vScale, vScale * step, vScale * step);
    }
  }

  // background(0);
  // only predict every now and then
  if (countDown == 0) {
    mobilenet.predict(1000, gotResult);
    countDown = 15;
  }
  countDown--;
  // make the text
  fill(255);
  textFont("Roboto Condensed");
  textSize(height / 19);
  text(label, 20, height / 2);
}

function search(nameKey, myArray) {
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].className === nameKey) {
      return i;
    }
  }
}
