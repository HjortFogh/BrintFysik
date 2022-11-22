const NUM_RINGS = 5;
const ELECTRON_RADIUS = 15;
const PROTON_RADIUS = 30;

const PHYSICS = {
    h: 6.63 * Math.pow(10, -34),
    c: 3.0 * Math.pow(10, 8),
    R: 1.097 * Math.pow(10, 7),
};

let a;

function setup() {
    createCanvas(windowWidth, windowHeight);
    a = new Atom();
}

function draw() {
    background(220);
    a.display();
}

function mousePressed() {
    a.startDrag();
}
function mouseReleased() {
    a.endDrag();
}

class Atom {
    constructor() {
        this.xPos = width / 2;
        this.yPos = height / 2;

        this.orbits = [];

        this.electronIndex = 1;
        this.electronAngle = 0;
        this.electronSpeed = 0.01;

        this.isDragging = false;

        // for (let i = 0; i < 5; i++) print("Orbit " + i + ": " + this.indexToEnergy(i));
        this.jumpOrbit(1, 3);
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
            let d = dist(mouseX, mouseY, this.xPos, this.yPos);
            let i = min(max(this.radiusToIndex(d), 0), NUM_RINGS - 1);
            if (this.electronIndex != i) this.jumpOrbit(this.electronIndex, i);
            this.electronIndex = i;
            this.electronAngle = atan2(this.xPos - mouseY, this.yPos - mouseX) + PI;
        }
    }

    indexToRadius(index) {
        return (height / NUM_RINGS) * (index + 1) * 0.3 + 50;
    }

    radiusToIndex(radius) {
        return round((0.33 * (10 * radius * NUM_RINGS - 500 * NUM_RINGS - 3 * height)) / height);
    }

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
        let wavelength = PHYSICS.c / frequency;
        print("Bølgelængde [nm]: " + wavelength * Math.pow(10, 9));
    }

    display() {
        if (!this.isDragging) {
            this.electronAngle += this.electronSpeed;
            this.electronAngle %= TWO_PI;
        }
        fill(0, 0);
        for (let i = 0; i < NUM_RINGS; i++) {
            circle(this.xPos, this.yPos, this.indexToRadius(i) * 2);
        }

        fill(211, 31, 34);
        circle(this.xPos, this.yPos, PROTON_RADIUS * 2);

        fill(32, 106, 155);
        let [elecX, elecY] = this.electronPosition();
        circle(elecX, elecY, ELECTRON_RADIUS * 2);
    }
}
