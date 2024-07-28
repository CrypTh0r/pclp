"use strict";

let canv, ctx; // canvas and context

let img; // img: image as loaded
let refData; // data extracted from resized image

let nbpx, nbpy; // number of pearls
let pdiam; // diameter of pearls

let goodImage = false; // successful image loading indicator

const messages = [];

let ui, uiv;

let lastKnownPosition; // of mouse

// shortcuts for Math.
const mrandom = Math.random;
const mfloor = Math.floor;
const mround = Math.round;
const mceil = Math.ceil;
const mabs = Math.abs;
const mmin = Math.min;
const mmax = Math.max;

const mPI = Math.PI;
const mPIS2 = Math.PI / 2;
const mPIS3 = Math.PI / 3;
const m2PI = Math.PI * 2;
const m2PIS3 = (Math.PI * 2) / 3;
const msin = Math.sin;
const mcos = Math.cos;
const matan2 = Math.atan2;

const mhypot = Math.hypot;
const msqrt = Math.sqrt;

const rac3 = msqrt(3);
const rac3s2 = rac3 / 2;

//------------------------------------------------------------------------

function alea(mini, maxi) {
  // random number in given range

  if (typeof maxi == "undefined") return mini * mrandom(); // range 0..mini

  return mini + mrandom() * (maxi - mini); // range mini..maxi
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function intAlea(mini, maxi) {
  // random integer in given range (mini..maxi - 1 or 0..mini - 1)
  //
  if (typeof maxi == "undefined") return mfloor(mini * mrandom()); // range 0..mini - 1
  return mini + mfloor(mrandom() * (maxi - mini)); // range mini .. maxi - 1
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Converts an RGB color value to HSL. Conversion formula
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
} // function rgbToHsl

//--------------------------------------------------------------------

function interleave(n) {
  /* returns an array of integers 0 to n - 1 shuffled to be used to display lines
      in an order such that they apppear as uniformly as possible
      */
  let interl = [];

  let arnb = new Array(n).fill(0).map((v, k) => k); // array of numbers 0.. n - 1

  /*  create a tree recursively by
          picking the number in the middle of the range as the node value
      */
  function next(node) {
    let ret;

    if (node.parent) {
      // first call
      let k = mfloor(node.parent.length / 2);
      ret = node.parent[k];
      if (k > 0) node.left = { parent: node.parent.slice(0, k) };
      if (k < node.parent.length - 1)
        node.right = { parent: node.parent.slice(k + 1) };
      if (node.left) node.state = 1;
      else node.state = 3;
      delete node.parent;
      return ret;
    }
    if (node.state == 1) {
      // return left child
      ret = next(node.left);
      if (node.left.state == 3) delete node.left; // left child empty now
    }
    if (node.state == 2) {
      // return right child
      ret = next(node.right);
      if (node.right.state == 3) delete node.right; // left child empty now
    }
    if (node.right && (node.state == 1 || !node.left)) node.state = 2;
    else node.state = node.left ? 1 : 3;
    return ret;
  } // next

  let par = { parent: arnb };
  do {
    interl.push(next(par));
  } while (par.state != 3);

  return interl;
} // interleave
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//------------------------------------------------------------------------
// User Interface (controls)
//------------------------------------------------------------------------
function toggleMenu() {
  if (menu.classList.contains("hidden")) {
    menu.classList.remove("hidden");
    this.innerHTML = "close controls";
  } else {
    menu.classList.add("hidden");
    this.innerHTML = "controls";
  }
} // toggleMenu

//------------------------------------------------------------------------

function getCoerce(name, min, max, isInt) {
  let parse = isInt ? parseInt : parseFloat;
  let ctrl = ui[name];
  let x = parse(ctrl.value, 10);
  if (isNaN(x)) {
    x = uiv[name];
  }
  x = mmax(x, min);
  x = mmin(x, max);
  ctrl.value = uiv[name] = x;
}

//------------------------------------------------------------------------
function prepareUI() {
  // toggle menu handler

  document.querySelector("#controls").addEventListener("click", toggleMenu);

  ui = {}; // User Interface HTML elements
  uiv = {}; // User Interface values of controls

  [
    "twidth",
    "theight",
    "load",
    "autodimension",
    "ttwidth",
    "default",
    "pearlsx"
  ].forEach((ctrlName) => (ui[ctrlName] = document.getElementById(ctrlName)));

  registerControl("twidth", readCoerced, "change", loaded);
  registerControl("autodimension", readUICheck, "input", autoDim);
  registerControl("pearlsx", readCoerced, "change", loaded);
  readUI();

  ui.load.addEventListener("click", loadUserImage);
  ui.default.addEventListener("click", loadDefaultImage);
} // prepareUI

//------------------------------------------------------------------------
function readUI() {
  if (ui.registered) {
    for (const ctrl in ui.registered) ui.registered[ctrl].readF();
  }
} // readUI

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function registerControl(
  controlName,
  readFunction,
  changeEvent,
  changedFunction
) {
  const ctrl = ui[controlName];
  ui.registered = ui.registered || [];
  ui.registered.push(ctrl); // Never register a control twice
  ctrl.readF = readFunction;
  if (changeEvent) {
    ctrl.addEventListener(changeEvent, (event) => {
      readFunction.call(ctrl);
      if (changedFunction) changedFunction.call(ctrl, event);
    });
  }
} // registerControl
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function readUIFloat() {
  uiv[this.id] = parseFloat(this.value);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function readUIInt(ctrl, event) {
  uiv[this.id] = parseInt(this.value);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function readUICheck(ctrl, event) {
  uiv[this.id] = this.checked;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function readCoerced() {
  /* the element will be read with getCoerce with values given by its min, max and step attributes
        (integer value if step == 1)
      */
  let min = this.getAttribute("min");
  let max = this.getAttribute("max");
  let step = this.getAttribute("step");
  getCoerce(this.id, min, max, step == 1);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function autoDim() {
  if (uiv.autodimension) {
    //    ui.ttwidth.style.display = "none";
    ui.twidth.setAttribute("disabled", "");
  } else {
    //    ui.ttwidth.style.display = "block";
    ui.twidth.removeAttribute("disabled");
  }

  let memo = uiv.twidth;

  if (uiv.autodimension) {
    let dimx = mround(window.innerWidth - 30);
    let dimy = mround((dimx * img.naturalHeight) / img.naturalWidth);
    if (dimy > window.innerHeight - 30) {
      dimy = mround(window.innerHeight - 30);
      dimx = mround((dimy / img.naturalHeight) * img.naturalWidth);
    }
    uiv.twidth = ui.twidth.value = mround(dimx);
    if (goodImage && uiv.twidth !== memo) loaded();
  }
}
//------------------------------------------------------------------------
function displayError(message) {
  /*
        let msg = document.getElementById('msg');
        msg.innerHTML = message;
        setTimeout(function(){msg.innerHTML = '&nbsp;'},2000);
      */
  console.log(message);
} // displayError

//------------------------------------------------------------------------

function loadUserImage() {
  let inp = document.getElementById("userfile");
  inp.onchange = function () {
    // check a few points
    if (this.files.length < 1) {
      callBackKO();
      return;
    }
    let file = this.files[0];

    if (file.type.substr(0, 6) != "image/") {
      callBackKO();
      return;
    }

    if (file.size < 1) {
      callBackKO();
      return;
    }

    let reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
      //            console.log (e.target.result);
      callBackOK();
      return;
    };

    reader.readAsDataURL(file);
  }; // inp.onchange

  inp.value = ""; // so that inp.value will actually change, even if same file reloaded
  inp.click(); // click hidden button, open control to load file

  function callBackOK() {
    loaded();
  }
  function callBackKO() {
    displayError("Could not load file");
  }
} // loadUserImage

//------------------------------------------------------------------------
function loadDefaultImage() {
  img.src = "https://i.ibb.co/QkhtFkV/40.jpg";
}
//------------------------------------------------------------------------
function loaded() {
  /* img was successfully loaded with some picture
      Now, we create a new canvas satisfying the target width requirement
      */
  /*
        if (uiv.autodimension) {
          let dimx = window.innerWidth;
          let dimy = dimx * img.naturalHeight / img.naturalWidth;
          if (dimy > window.innerHeight) {
            dimy = window.innerHeight;
            dimx = mround(dimy / img.naturalHeight * img.naturalWidth);
          }
          uiv.twidth = ui.twidth.value = dimx;
        }
      */
  // height of target image

  autoDim();

  let nbpx = uiv.pearlsx;
  pdiam = uiv.twidth / nbpx; // number of pearls horizontally

  nbpy = mround((img.naturalHeight / img.naturalWidth) * nbpx);
  uiv.tHeight = nbpy * pdiam;
  ui.theight.innerHTML = uiv.tHeight.toFixed(2);

  let ncanvas = document.createElement("canvas");
  let nctx = ncanvas.getContext("2d");
  ncanvas.width = nbpx;
  ncanvas.height = nbpy;
  nctx.drawImage(img, 0, 0, nbpx, nbpy);
  refData = nctx.getImageData(0, 0, nbpx, nbpy);
  //      console.log(refData.data);
  goodImage = true;

  messages.push({ message: "loaded" });
  canv.width = uiv.twidth;
  canv.height = uiv.tHeight;

  let ptr = 0; // pointer in refData

  let r, g, b, rcol, xc, yc, gr;

  for (let ky = 0; ky < nbpy; ++ky) {
    yc = (ky + 0.5) * pdiam;
    for (let kx = 0; kx < nbpx; ++kx) {
      xc = (kx + 0.5) * pdiam;
      r = refData.data[ptr++];
      g = refData.data[ptr++];
      b = refData.data[ptr++];
      ptr++; // ignore tansparency
      rcol = rgbToHsl(r, g, b);
      gr = ctx.createRadialGradient(
        xc,
        yc,
        pdiam / 2,
        xc + 0.15 * pdiam,
        yc - 0.15 * pdiam,
        0
      );
      gr.addColorStop(
        0,
        `hsl(${rcol.h * 360} ${rcol.s * 100}% ${rcol.l * 40}%)`
      );
      gr.addColorStop(
        0.5,
        `hsl(${rcol.h * 360} ${rcol.s * 100}% ${rcol.l * 100}%)`
      );
      gr.addColorStop(
        1,
        `hsl(${rcol.h * 360} ${rcol.s * 100}% ${rcol.l * 250}%)`
      );
      ctx.beginPath();
      ctx.fillStyle = gr;
      ctx.arc(xc, yc, pdiam / 2, 0, m2PI);
      ctx.fill();
    } // for kx
  } // for ky
}

//------------------------------------------------------------------------

function canvasCoordinates(event) {
  /* changes clientX and clientY of event to coordinates relative to canvas */
  if (typeof event.clientX != "undefined") {
    const rect = canv.getBoundingClientRect();
    event.canvX = event.clientX - rect.x;
    event.canvY = event.clientY - rect.y;
    lastKnownPosition = { canvX: event.canvX, canvY: event.canvY };
  }
  return event;
}

//------------------------------------------------------------------------

let animate;
{
  // scope for animate

  let animState = 0;

  animate = function (tStamp) {
    let message;

    if (messages.length) {
      message = messages.shift();
      if (message.message == "reset") animState = 0;
      if (message.message == "loaded") animState = 0;
      if (message.message == "errorloading") animState = 0;
    }
    switch (animState) {
      case 0:
        if (!goodImage) break;
        //            drawImg();
        ++animState;

        break;
    } // switch

    window.requestAnimationFrame(animate);
  }; // animate
} // scope for animate
//------------------------------------------------------------------------
//------------------------------------------------------------------------
// beginning of execution

{
  canv = document.createElement("canvas");
  canv.style.position = "relative";

  document.body.appendChild(canv);
  ctx = canv.getContext("2d");
} // creation of CANVAS

prepareUI();

img = new Image();
img.crossOrigin = "anonymous";
img.addEventListener("load", loaded);
img.addEventListener("error", function () {
  displayError("unable to load picture");
  messages.push({ message: "errorloading" });
  goodImage = false;
});

loadDefaultImage();
//    canv.addEventListener('click', mouseClick);

messages.push({ message: "reset" });
window.requestAnimationFrame(animate);