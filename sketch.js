const NUM_RINGS = 6;

const PROTON_RADIUS = 35;

const ELECTRON_RADIUS = 15;
const ELECTRON_SPEED = 0.006;

const PHOTON_RADIUS = 8;
const PHOTON_SPEED = 8;

let LIGHT_SPECTRUM = [];
const UV_WAVELENGTH = 280;
let UV_COLOR;
const IR_WAVELENGTH = 740;
let IR_COLOR;

const PHYSICS = {
    h: 6.63 * Math.pow(10, -34),
    c: 3.0 * Math.pow(10, 8),
    R: 1.097 * Math.pow(10, 7),
};

let atom;
let photons = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    atom = new Atom();

    LIGHT_SPECTRUM = [
        [400, color(214, 25, 189)],
        [440, color(13, 0, 144)],
        [510, color(0, 233, 253)],
        [550, color(21, 184, 33)],
        [580, color(254, 246, 0)],
        [610, color(253, 103, 0)],
        [740, color(248, 0, 0)],
    ];
    UV_COLOR = color(0, 0, 255, 100);
    IR_COLOR = color(255, 0, 0, 100);
}

function draw() {
    background(220);
    atom.update();
    for (let i = 0; i < photons.length; i++) if (photons[i] !== null) photons[i].update();
    atom.display();
    for (let i = 0; i < photons.length; i++) if (photons[i] !== null) photons[i].display();
}

function mousePressed() {
    atom.startDrag();
}
function mouseReleased() {
    atom.endDrag();
}

function spawnPhoton(sx, sy, ex, ey, wavelength) {
    let index = photons.indexOf(null);
    if (index < 0) {
        index = photons.push(null) - 1;
    }
    photons[index] = new Photon(sx, sy, ex, ey, wavelength, index);
}
function removePhoton(index) {
    photons[index] = null;
}

class Photon {
    constructor(startX, startY, endX, endY, wavelength, index) {
        this.xPos = startX;
        this.yPos = startY;
        this.endX = endX;
        this.endY = endY;

        this.wavelength = wavelength;
        this.index = index;
    }

    update() {
        let dx = this.endX - this.xPos;
        let dy = this.endY - this.yPos;
        let distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        if (distance < PHOTON_RADIUS) {
            removePhoton(this.index);
        }

        this.xPos += (dx / distance) * PHOTON_SPEED;
        this.yPos += (dy / distance) * PHOTON_SPEED;
    }

    wavelengthToColor(wavelength) {
        if (wavelength < UV_WAVELENGTH) return UV_COLOR;
        if (wavelength > IR_WAVELENGTH) return IR_COLOR;
        for (let i = 0; i < LIGHT_SPECTRUM.length - 1; i++) {
            let [newWl, newCol] = LIGHT_SPECTRUM[i];
            let [nextWl, nextCol] = LIGHT_SPECTRUM[i + 1];
            if (wavelength >= newWl && wavelength <= nextWl) {
                let p = (wavelength - newWl) / (nextWl - newWl);
                return lerpColor(newCol, nextCol, p);
            } else continue;
        }
    }

    display() {
        noStroke();
        fill(this.wavelengthToColor(this.wavelength));
        circle(this.xPos, this.yPos, PHOTON_RADIUS * 2);
    }
}

class Atom {
    constructor() {
        this.xPos = width / 2;
        this.yPos = height / 2;

        this.electronIndex = 1;
        this.electronAngle = 0;

        this.isDragging = false;
    }

    startDrag() {
        let [elecX, elecY] = this.electronPosition();
        if (dist(mouseX, mouseY, elecX, elecY) < ELECTRON_RADIUS) {
            this.isDragging = true;
        }
    }

    endDrag() {
        if (this.isDragging) {
            this.isDragging = false;

            let radius = dist(mouseX, mouseY, this.xPos, this.yPos);
            let newIndex = min(max(this.radiusToIndex(radius), 0), NUM_RINGS - 1);
            let oldIndex = this.electronIndex;
            if (oldIndex === newIndex) return;

            this.electronIndex = newIndex;
            this.electronAngle = atan2(this.yPos - mouseY, this.xPos - mouseX) + PI;

            this.jumpOrbit(oldIndex, newIndex);
        }
    }

    indexToRadius(index) {
        return (height / NUM_RINGS) * (index + 1) * 0.3 + 50;
    }

    radiusToIndex(radius) {
        return round((0.333 * (10 * radius * NUM_RINGS - 500 * NUM_RINGS - 3 * height)) / height);
    }

    // electronPositionInFrames(frames) {
    //     let radius = this.indexToRadius(this.electronIndex);
    //     let newAngle = (this.electronAngle + ELECTRON_SPEED * frames) % TWO_PI;
    //     return [this.xPos + cos(newAngle) * radius, this.yPos + sin(newAngle) * radius];
    // }

    electronPosition() {
        if (this.isDragging) return [mouseX, mouseY];
        let r = this.indexToRadius(this.electronIndex);
        return [this.xPos + cos(this.electronAngle) * r, this.yPos + sin(this.electronAngle) * r];
    }

    indexToEnergy(index) {
        // E_n = -h * c * R * 1/n^2
        return (-PHYSICS.h * PHYSICS.c * PHYSICS.R) / Math.pow(index + 1, 2);
    }

    jumpOrbit(oldIndex, newIndex) {
        let energy = this.indexToEnergy(newIndex) - this.indexToEnergy(oldIndex);
        // f = E/h
        let frequency = energy / PHYSICS.h;
        // λ = c/f
        let wavelength = (PHYSICS.c / frequency) * Math.pow(10, 9);
        // print("Elektronhop fra " + (oldIndex + 1) + " til " + (newIndex + 1));
        print("Bølgelængde [nm]: " + wavelength);

        let angle = random(TWO_PI);
        let ofX = cos(angle);
        let ofY = sin(angle);

        let [elecX, elecY] = this.electronPosition();
        if (wavelength < 0) {
            // emitter foton
            spawnPhoton(elecX, elecY, ofX, ofY, abs(wavelength));
        } else {
            // absorberer foton
            spawnPhoton(ofX, ofY, elecX, elecY, wavelength);
        }
    }

    update() {
        if (!this.isDragging) {
            this.electronAngle += ELECTRON_SPEED;
            this.electronAngle %= TWO_PI;
        }
    }

    display() {
        stroke(0);

        // Tegn skallerne
        fill(0, 0);
        for (let i = 0; i < NUM_RINGS; i++) {
            circle(this.xPos, this.yPos, this.indexToRadius(i) * 2);
        }

        // Tegn protonen
        fill(211, 31, 34);
        circle(this.xPos, this.yPos, PROTON_RADIUS * 2);

        // Tegn elektronen
        fill(32, 106, 155);
        let [elecX, elecY] = this.electronPosition();
        circle(elecX, elecY, ELECTRON_RADIUS * 2);
    }
}
