// Skal konstanter
const NUM_RINGS = 6;
const INNER_RING_RADIUS = 50;
const RING_SPACING = 0.3;

// Proton/elektron/foton konstanter
const PROTON_RADIUS = 35;

const ELECTRON_RADIUS = 15;
const ELECTRON_SPEED = 0.02;

const PHOTON_RADIUS = 8;
const PHOTON_SPEED = 15;

// Farve/bølgelængde konstanter
let LIGHT_SPECTRUM = [];
const UV_WAVELENGTH = 280;
let UV_COLOR;
const IR_WAVELENGTH = 740;
let IR_COLOR;

// Mindste/største skærm bredde/højde
const MIN_SCREEN_SIZE = Math.min(window.innerWidth, window.innerHeight);
const MAX_SCREEN_SIZE = Math.max(window.innerWidth, window.innerHeight);

// Fysik konstanter
const PHYSICS = {
    h: 6.63 * Math.pow(10, -34), // Plancks konstant
    c: 3.0 * Math.pow(10, 8), // Lysets hastighed i vakuum
    R: 1.097 * Math.pow(10, 7), // R?
};

let atom;
let photons = [];

let ui;
let simSpeed = 0.5;

function setup() {
    createCanvas(windowWidth, windowHeight);
    atom = new Atom(width / 2 + 50, height / 2);

    textSize(20);
    textAlign(LEFT, TOP);
    ui = new UI();

    LIGHT_SPECTRUM = [
        [280, color(124, 19, 110)],
        [400, color(214, 25, 189)],
        [430, color(13, 0, 144)],
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
    // Opdater atom,fotoner,ui
    atom.update();
    for (let i = 0; i < photons.length; i++) if (photons[i] !== null) photons[i].update();
    ui.update();

    // Vis atom,fotoner,ui
    atom.display();
    for (let i = 0; i < photons.length; i++) if (photons[i] !== null) photons[i].display();
    ui.display();
}

function mousePressed() {
    atom.startDrag();
}
function mouseReleased() {
    atom.endDrag();
}

function spawnPhoton(sx, sy, ex, ey, energy, callback) {
    let index = photons.indexOf(null);
    if (index < 0) {
        index = photons.push(null) - 1;
    }
    photons[index] = new Photon(sx, sy, ex, ey, energy, index, callback);
}
function removePhoton(index) {
    photons[index] = null;
}

function splitNumber(num) {
    let mantissa = float((num + "").split("e")[0]);
    let exponent = float((num + "").split("e")[1]);
    return [mantissa, exponent];
}

class Photon {
    constructor(startX, startY, endX, endY, energy, index, callback) {
        this.xPos = startX;
        this.yPos = startY;
        this.endX = endX;
        this.endY = endY;

        this.energy = energy;
        // f = E/h
        let frequency = energy / PHYSICS.h;
        // λ = c/f
        this.wavelength = (PHYSICS.c / frequency) * Math.pow(10, 9);
        this.color = this.wavelengthToColor(this.wavelength);
        this.index = index;

        this.callback = callback;
    }

    update() {
        let dx = this.endX - this.xPos;
        let dy = this.endY - this.yPos;
        let distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        if (distance < PHOTON_RADIUS * 2) {
            if (this.callback !== null) this.callback.call(atom);
            removePhoton(this.index);
        }

        this.xPos += (dx / distance) * PHOTON_SPEED * simSpeed;
        this.yPos += (dy / distance) * PHOTON_SPEED * simSpeed;
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
        return color(0);
    }

    display() {
        noStroke();
        fill(this.color);
        circle(this.xPos, this.yPos, PHOTON_RADIUS * 2);
        text("λ = " + this.wavelength.toFixed(4) + " [nm]", this.xPos, this.yPos + 10);
        let [m, e] = splitNumber(this.energy);
        text("E = " + m.toFixed(4) + " · 10^" + e + " [J]", this.xPos, this.yPos + 40);
    }
}

class Atom {
    constructor(xPos, yPos) {
        this.xPos = xPos;
        this.yPos = yPos;

        this.electronAngle = 0;
        this.electronOrbit = 0;

        this.ghostAngle = 0;
        this.ghostOrbit = 0;

        this.isDragging = false;
        this.isWaiting = false;
    }

    onPhotonHit() {
        this.electronAngle = this.ghostAngle;
        this.electronOrbit = this.ghostOrbit;
        this.isWaiting = false;
    }

    startDrag() {
        if (this.isWaiting) return;
        let [elecX, elecY] = this.electronPosition(this.electronAngle, this.electronOrbit);
        if (dist(mouseX, mouseY, elecX, elecY) < ELECTRON_RADIUS) {
            this.isDragging = true;
        }
    }

    endDrag() {
        if (this.isDragging && !this.isWaiting) {
            this.isWaiting = true;

            let orbit = this.radiusToOrbit(dist(mouseX, mouseY, this.xPos, this.yPos));
            // let distance = this.orbitToRadius(orbit);

            let angle = Math.atan2(mouseY - this.yPos, mouseX - this.xPos);

            this.ghostAngle = angle;
            this.ghostOrbit = orbit;

            this.jumpOrbit(this.electronOrbit, orbit);
        }
        this.isDragging = false;
    }

    orbitToRadius(orbit) {
        return (MIN_SCREEN_SIZE / NUM_RINGS) * (orbit + 1) * RING_SPACING + INNER_RING_RADIUS;
    }

    radiusToOrbit(radius) {
        let o = round(-(INNER_RING_RADIUS * NUM_RINGS + MIN_SCREEN_SIZE * RING_SPACING - radius * NUM_RINGS) / (MIN_SCREEN_SIZE * RING_SPACING));
        return min(max(o, 0), NUM_RINGS - 1);
    }

    electronPosition(angle, orbit) {
        let radius = this.orbitToRadius(orbit);
        return [this.xPos + cos(angle) * radius, this.yPos + sin(angle) * radius];
    }

    orbitToEnergy(orbit) {
        // E_n = -h * c * R * 1/n^2
        return (-PHYSICS.h * PHYSICS.c * PHYSICS.R) / Math.pow(orbit + 1, 2);
    }

    jumpOrbit(oldOrbit, newOrbit) {
        if (oldOrbit === newOrbit) {
            this.onPhotonHit();
            return;
        }
        let energy = this.orbitToEnergy(newOrbit) - this.orbitToEnergy(oldOrbit);

        let [elecX, elecY] = this.electronPosition(this.electronAngle, this.electronOrbit);
        // let [ofX, ofY] = this.electronPosition(this.electronAngle, NUM_RINGS * 2);

        let ofX = this.xPos + cos(this.electronAngle) * (MAX_SCREEN_SIZE / 2);
        let ofY = this.yPos + sin(this.electronAngle) * (MAX_SCREEN_SIZE / 2);

        if (energy < 0) {
            // emitter foton
            spawnPhoton(elecX, elecY, ofX, ofY, abs(energy), null);
            this.onPhotonHit();
        } else {
            // absorberer foton
            spawnPhoton(ofX, ofY, elecX, elecY, energy, this.onPhotonHit);
        }
    }

    update() {
        if (!this.isDragging && !this.isWaiting) {
            this.electronAngle += ELECTRON_SPEED * simSpeed;
            this.electronAngle %= TWO_PI;
        } else if (!this.isWaiting) {
            this.ghostOrbit = this.radiusToOrbit(dist(mouseX, mouseY, this.xPos, this.yPos));
            this.ghostAngle = Math.atan2(mouseY - this.yPos, mouseX - this.xPos);
        }
    }

    display() {
        stroke(0);

        // Tegn skallerne
        fill(0, 0);
        for (let i = 0; i < NUM_RINGS; i++) {
            circle(this.xPos, this.yPos, this.orbitToRadius(i) * 2);
        }
        // Tegn protonen
        fill(211, 31, 34);
        circle(this.xPos, this.yPos, PROTON_RADIUS * 2);
        // Tegn elektronen
        fill(27, 91, 181);
        let [elecX, elecY] = this.electronPosition(this.electronAngle, this.electronOrbit);
        circle(elecX, elecY, ELECTRON_RADIUS * 2);
        // Tegn gennemsigtig elektron
        if (this.isDragging || this.isWaiting) {
            fill(27, 91, 181, 150);
            noStroke();
            let [ghostX, ghostY] = this.electronPosition(this.ghostAngle, this.ghostOrbit);
            circle(ghostX, ghostY, ELECTRON_RADIUS * 2);
        }
    }
}

class UI {
    constructor() {
        this.xPos = 20;
        this.yPos = 20;
        this.speedSlider = createSlider(0, 100, simSpeed * 100);
        this.speedSlider.position(this.xPos + 20, this.yPos + 35);
    }

    update() {
        let newSpeed = this.speedSlider.value();
        if (simSpeed !== newSpeed) {
            simSpeed = newSpeed / 100;
        }
    }

    display() {
        fill(50);
        noStroke();
        rect(this.xPos, this.yPos, 210, 180);
        fill(255);
        text("Simulations hastighed:", this.xPos + 5, this.yPos + 5);
        text("Elektronens energi:", this.xPos + 5, this.yPos + 65);
        let energy = atom.orbitToEnergy(atom.electronOrbit);
        let [m, e] = splitNumber(energy);
        text("   " + m.toFixed(4) + " · 10^" + e + " J", this.xPos + 5, this.yPos + 95);
        text("Elektron skal:", this.xPos + 5, this.yPos + 125);
        text("   " + (atom.electronOrbit + 1), this.xPos + 5, this.yPos + 155);
    }
}
