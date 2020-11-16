
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            [g]
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
            canvas_context.strokeStyle = "black"
            canvas_context.strokeRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            // example usage: if(object.isPointInside(TIP_engine)){ take action }


            food.x = TIP_engine.x
            food.y = TIP_engine.y
            // if (box1.isPointInside(TIP_engine)) {
            //     for (let t = 0; t < cepts.length; t++) {
            //         if (!(cepts[t].totalRed >= cepts[t].totalGreen && cepts[t].totalRed >= cepts[t].totalBlue)) {
            //             cepts[t].marked = 1
            //         }
            //     }

            //     dots = []

            //     for (let t = 0; dots.length < popbar.value; t++) {
            //         let dot = new Circle(Math.random() * 700, Math.random() * 199, 3, "black")
            //         let colorpick = generation % 3// Math.floor(Math.random() * 3.00)


            //         if (colorpick == 1) {
            //             dot.color = "#00ff00"
            //         }
            //         if (colorpick == 2) {
            //             dot.color = "blue"
            //         }
            //         if (colorpick == 0) {
            //             dot.color = "red"
            //         }
            //         if (1 == 1) {
            //             dots.push(dot)
            //         }
            //     }
            // }

            // if (box2.isPointInside(TIP_engine)) {
            //     for (let t = 0; t < cepts.length; t++) {
            //         if (!(cepts[t].totalGreen >= cepts[t].totalRed && cepts[t].totalGreen >= cepts[t].totalBlue)) {
            //             cepts[t].marked = 1
            //         }
            //     }

            //     dots = []

            //     for (let t = 0; dots.length < popbar.value; t++) {
            //         let dot = new Circle(Math.random() * 700, Math.random() * 199, 3, "black")
            //         let colorpick = generation % 3// Math.floor(Math.random() * 3.00)


            //         if (colorpick == 1) {
            //             dot.color = "#00ff00"
            //         }
            //         if (colorpick == 2) {
            //             dot.color = "blue"
            //         }
            //         if (colorpick == 0) {
            //             dot.color = "red"
            //         }
            //         if (1 == 1) {
            //             dots.push(dot)
            //         }
            //     }
            // }
            // if (box3.isPointInside(TIP_engine)) {
            //     for (let t = 0; t < cepts.length; t++) {
            //         if (!(cepts[t].totalBlue >= cepts[t].totalRed && cepts[t].totalBlue >= cepts[t].totalGreen)) {
            //             cepts[t].marked = 1
            //         }
            //     }

            //     dots = []

            //     for (let t = 0; dots.length < popbar.value; t++) {
            //         let dot = new Circle(Math.random() * 700, Math.random() * 199, 3, "black")
            //         let colorpick = generation % 3// Math.floor(Math.random() * 3.00)


            //         if (colorpick == 1) {
            //             dot.color = "#00ff00"
            //         }
            //         if (colorpick == 2) {
            //             dot.color = "blue"
            //         }
            //         if (colorpick == 0) {
            //             dot.color = "red"
            //         }
            //         if (1 == 1) {
            //             dots.push(dot)
            //         }
            //     }
            // }
            // if (cepts.length < 10) {
            //     for(let t = 0;cepts.length<10;t++){
            //         cepts[Math.floor(Math.random()*cepts.length)].clone()

            //     }
            //     console.log(cepts)
            // }


            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointerup', e => {
            window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.x += (gamepadAPI.axesStatus[2] * speed)
                    object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.x += (gamepadAPI.axesStatus[0] * speed)
                    object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
            shape_array.push(circ)
        }
        return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document
    let popbar = document.getElementById('pop') //getting canvas from document
    let upflip = document.getElementById('up') //getting canvas from document
    let nodflip = document.getElementById('nods') //getting canvas from document



    nodflip.addEventListener('input', function () {
        cepts = []
        for (let t = 0; t < 200; t++) {
            let perspy = new Perceptron()
            cepts.push(perspy)
        }
    }, false);



    upflip.onclick = upflipper

    function upflipper() {
        up *= -1
    }

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 
    let boingo = 0
    let up = 1
    let generation = 0

    let box1 = new Rectangle(0, 0, 233, 200, "white")

    let box2 = new Rectangle(233, 0, 233, 200, "white")

    let box3 = new Rectangle(466, 0, 233, 200, "white")

    let split = new Line(350, 0, 350, 200, "black", 1)

    let dots = []

    for (let t = 0; t < popbar.value; t++) {
        let dot = new Circle(Math.random() * 700, Math.random() * 199, 3, "black")
        let colorpick = generation % 3// Math.floor(Math.random() * 3.00)


        // if (colorpick == 1) {
        //     dot.color = "#00ff00"
        // }
        // if (colorpick == 2) {
        //     dot.color = "blue"
        // }
        // if (colorpick == 0) {
        //     dot.color = "red"
        // }
        if (1 == 1) {
            dots.push(dot)
        }
    }

    class Perceptron {
        constructor() {
            this.inputNode1 = new Circle(100, 300, 10, "white")
            this.inputNode2 = new Circle(270, 300, 10, "white")
            this.inputNode3 = new Circle(440, 300, 10, "white")
            this.inputNode4 = new Circle(610, 300, 10, "white")
            this.marked = 0
            this.brainNodes = []
            this.brainsize = nodflip.value / 1


            this.xpos = 100
            this.xmom = 0
            this.ypos = 100
            this.ymom = 0
            this.bodycolor = getRandomLightColor()
            this.body = new Circle(this.xpos, this.ypos, 3, this.bodycolor, this.xmom, this.ymom)

            this.outputs = []

            for (let t = 0; t < this.brainsize; t++) {
                let node = new Circle(700 / (this.brainsize + 1) + (t * (700 / (this.brainsize + 1))), 450, 12, "white")
                let weight1 = this.weights()
                let weight2 = this.weights()
                let weight3 = this.weights()
                let weight4 = this.weights()
                this.brainNodes.push([node, weight1, weight2, weight3, weight4])
            }

            // let node1 = new Circle(700 / (this.brainsize + 1) + (0 * (700 / (this.brainsize + 1))), 450, 12, "white")
            // let weight1 = .1
            // let weight2 = 1
            // let weight3 = 1
            // this.brainNodes.push([node1, weight1, weight2, weight3])
            // let node2 = new Circle(700 / (this.brainsize + 1) + (1 * (700 / (this.brainsize + 1))), 450, 12, "white")
            //  weight1 = 1
            //  weight2 = .1
            //  weight3 = 1
            // this.brainNodes.push([node2, weight1, weight2, weight3])
            // let node3 = new Circle(700 / (this.brainsize + 1) + (2 * (700 / (this.brainsize + 1))), 450, 12, "white")
            //  weight1 = 1
            //  weight2 = 1
            //  weight3 = .1
            // this.brainNodes.push([node3, weight1, weight2, weight3])


            for (let t = 0; t < 4; t++) {
                let node = new Circle(100+(170*t), 620, 12, "white")
                let arr = [node]

                // if(t == 0){
                //     arr.push(-1)
                //     arr.push(.005)
                //     arr.push(.005)
                // }
                // if(t == 1){
                //     arr.push(.005)
                //     arr.push(-1)
                //     arr.push(.005)
                // }
                // if(t == 2){
                //     arr.push(.005)
                //     arr.push(.005)
                //     arr.push(-1)
                // }
                for (let k = 0; k < this.brainNodes.length; k++) {
                    arr.push(this.weights())
                    // arr.push(1)
                }
                this.outputs.push(arr)
            }


        }
        weights() {
            return (Math.random() - .5) * 2
            // if(Math.random()<.5){
            //     return 0
            // }else{
            //     return 1
            // }

        }
        draw() {

            // for (let t = 0; t < dots.length; t++) {
            //     if (dots[t].color == "red") {
            //         this.redcount++
            //     }
            //     if (dots[t].color == "green") {
            //         this.greencount++
            //     }
            //     if (dots[t].color == "blue") {
            //         this.bluecount++
            //     }
            // }


            // if(generation%3 ==0){
            //     this.redcount = 132
            //     this.greencount = 133
            //     this.bluecount = 134
            // }
            // if(generation%3 ==1){
            //     this.redcount = 133
            //     this.greencount = 134
            //     this.bluecount = 132
            // }
            // if(generation%3 ==2){
            //     this.redcount = 134
            //     this.greencount = 133
            //     this.bluecount = 132
            // }
            canvas_context.font = "30px arial"

            // canvas_context.fillStyle = "red"
            // canvas_context.fillText(`${this.redcount}`, 50, 250)
            // canvas_context.fillStyle = "green"
            // canvas_context.fillText(`${this.greencount}`, 280, 250)
            // canvas_context.fillStyle = "blue"
            // canvas_context.fillText(`${this.bluecount}`, 550, 250)



            this.inputNode1.color = `rgba(255,255,255,${Math.max((this.xpos / 200) / cepts.length, (1 / 255))})`
            this.inputNode2.color = `rgba(255,255,255,${Math.max((this.xpos / 200) / cepts.length, (1 / 255))})`
            this.inputNode3.color = `rgba(255,255,255, ${Math.max((this.ypos / 200) / cepts.length, (1 / 255))})`
            this.inputNode4.color = `rgba(255,255,255, ${Math.max((this.ypos / 200) / cepts.length, (1 / 255))})`
            this.inputNode1.draw()
            this.inputNode2.draw()
            this.inputNode3.draw()
            this.inputNode4.draw()

            for (let t = 0; t < this.brainNodes.length; t++) {
                this.brainNodes[t][0].draw()

                if (this.brainNodes[t][1] > 0) {
                    let link1 = new LineOP(this.brainNodes[t][0], this.inputNode1, "green", this.brainNodes[t][1] / (cepts.length / 2))
                    if (link1.width != 0) {
                        link1.draw()
                    }
                } else {
                    let link1 = new LineOP(this.brainNodes[t][0], this.inputNode1, "red", Math.abs(this.brainNodes[t][1]) / (cepts.length / 2))
                    if (link1.width != 0) {
                        link1.draw()
                    }
                }
                if (this.brainNodes[t][2] > 0) {
                    let link2 = new LineOP(this.brainNodes[t][0], this.inputNode2, "green", this.brainNodes[t][2] / (cepts.length / 2))
                    if (link2.width != 0) {
                        link2.draw()
                    }
                } else {
                    let link2 = new LineOP(this.brainNodes[t][0], this.inputNode2, "red", Math.abs(this.brainNodes[t][2]) / (cepts.length / 2))
                    if (link2.width != 0) {
                        link2.draw()
                    }
                }
                if (this.brainNodes[t][3] > 0) {
                    let link3 = new LineOP(this.brainNodes[t][0], this.inputNode3, "green", this.brainNodes[t][3] / (cepts.length / 2))
                    if (link3.width != 0) {
                        link3.draw()
                    }
                } else {
                    let link3 = new LineOP(this.brainNodes[t][0], this.inputNode3, "red", Math.abs(this.brainNodes[t][3]) / (cepts.length / 2))
                    if (link3.width != 0) {
                        link3.draw()
                    }
                }
                if (this.brainNodes[t][4] > 0) {
                    let link4 = new LineOP(this.brainNodes[t][0], this.inputNode4, "green", this.brainNodes[t][4] / (cepts.length / 2))
                    if (link4.width != 0) {
                        link4.draw()
                    }
                } else {
                    let link4 = new LineOP(this.brainNodes[t][0], this.inputNode4, "red", Math.abs(this.brainNodes[t][4]) / (cepts.length / 2))
                    if (link4.width != 0) {
                        link4.draw()
                    }
                }
            }
            this.compute()
            for (let t = 0; t < this.outputs.length; t++) {
                this.outputs[t][0].draw()

                // for (let k = 0; k < this.brainNodes.length; k++) {

                for (let g = 0; g < this.brainNodes.length; g++) {
                    for (let k = 1; k < this.brainNodes[g].length; k++) {
                        if (this.outputs[t][g + 1] > 0) {
                            let link1 = new LineOP(this.outputs[t][0], this.brainNodes[g][0], "green", this.outputs[t][g + 1] / (cepts.length / 2))
                            if (link1.width != 0) {
                                link1.draw()
                            }
                        } else {
                            let link1 = new LineOP(this.outputs[t][0], this.brainNodes[g][0], "red", Math.abs(this.outputs[t][g + 1]) / (cepts.length / 2))
                            if (link1.width != 0) {
                                link1.draw()
                            }
                        }
                    }
                }
                // }
            }

        }
        boingo() {
            this.marked = 0
            for (let t = 0; cepts.length < 200; t++) {
                cepts[Math.floor(Math.random() * cepts.length)].clone()
                cepts.push(new Perceptron())
            }
            // console.log(generation)
            console.log(generation, this.redcount, this.greencount, this.bluecount)
        }
        clean() {
            if (cepts.length < 2) {
                this.marked = 0
                // boingo = 1
            } else {
                if (this.marked == 1) {
                    cepts.splice(cepts.indexOf(this), 1)
                }
            }




        }
        clone() {
            let clone = new Perceptron()

            for (let t = 0; t < this.brainNodes.length; t++) {
                clone.brainNodes[t][1] = this.brainNodes[t][1]
                clone.brainNodes[t][2] = this.brainNodes[t][2]
                clone.brainNodes[t][3] = this.brainNodes[t][3]
                clone.brainNodes[t][4] = this.brainNodes[t][4]
            }
            for (let t = 0; t < this.outputs.length; t++) {
                for (let k = 1; k < this.outputs[t].length; k++) {
                    clone.outputs[t][k] = this.outputs[t][k]
                    // console.log(clone.outputs[t][k] == this.outputs[t][k])
                }
                // clone.outputs[t][2] = this.outputs[t][2]
                // clone.outputs[t][3] = this.outputs[t][3]
                // clone.outputs[t][4] = this.outputs[t][4]
            }
            clone.compute()
            clone.mutate()
            cepts.splice(1, 0, clone)
            // cepts.unshift(clone)
        }
        mutate() {


            for (let t = 0; t < this.brainNodes.length; t++) {
                if (Math.random() < .005) {
                    this.brainNodes[t][1] *= -1
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][2] *= -1
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][3] *= -1
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][4] *= -1
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][1] = this.weights()
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][2] = this.weights()
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][3] = this.weights()
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][4] = this.weights()
                }
            }

            for (let t = 0; t < this.outputs.length; t++) {
                for (let k = 1; k < this.outputs[t].length; k++) {
                    if (Math.random() < .005) {
                        this.outputs[t][k] *= -1
                    }
                    if (Math.random() < .005) {
                        this.outputs[t][k] = this.weights()
                    }
                }
            }

            for (let t = 0; t < this.brainNodes.length; t++) {
                if (Math.random() < .005) {
                    this.brainNodes[t][1] = this.brainNodes[t][1] * (((Math.random() - .5) * .5) + 1)
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][2] = this.brainNodes[t][2] * (((Math.random() - .5) * .5) + 1)
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][3] = this.brainNodes[t][3] * (((Math.random() - .5) * .5) + 1)
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][4] = this.brainNodes[t][4] * (((Math.random() - .5) * .5) + 1)
                }
            }

            for (let t = 0; t < this.outputs.length; t++) {
                for (let k = 1; k < this.outputs[t].length; k++) {
                    if (Math.random() < .005) {
                        this.outputs[t][k] = this.outputs[t][k] * (((Math.random() - .5) * .5) + 1)
                    }
                }
            }

            for (let t = 0; t < this.brainNodes.length; t++) {
                if (Math.random() < .005) {
                    this.brainNodes[t][1] += .41 * (Math.random() - .5)
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][2] += .41 * (Math.random() - .5)
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][3] += .41 * (Math.random() - .5)
                }
                if (Math.random() < .005) {
                    this.brainNodes[t][4] += .41 * (Math.random() - .5)
                }
            }

            for (let t = 0; t < this.outputs.length; t++) {
                for (let k = 1; k < this.outputs[t].length; k++) {
                    if (Math.random() < .005) {
                        this.outputs[t][k] += .41 * (Math.random() - .5)
                    }
                }
            }



        }
        normalize(val, min, max) {
            // Shift to positive to avoid issues when crossing the 0 line
            if (min < 0) {
                max += 0 - min;
                val += 0 - min;
                min = 0;
            }
            // Shift values from 0 - max
            val = val - min;
            max = max - min;
            return Math.max(0, Math.min(1, val / max));
        }
        compute() {

            // this.body = new Circle(this.xpos, this.ypos, 3, this.bodycolor, this.xmom, this.ymom)
            this.body.x = this.xpos
            this.body.y = this.ypos
            this.body.xmom = this.xmom
            this.body.ymom = this.ymom
            this.body.move()
            this.xpos = this.body.x
            if (this.xpos > 210) {
                this.xpos = 210
            }
            if (this.xpos < 11) {
                this.xpos = 11
            }
            this.ypos = this.body.y
            if (this.ypos > 210) {
                this.ypos = 210
            }
            if (this.ypos < 11) {
                this.ypos = 11
            }
            this.body.x = this.xpos
            this.body.y = this.ypos
            this.body.xmom = this.xmom
            this.body.ymom = this.ymom
            this.body.draw()
            // for (let t = 0; t < dots.length; t++) {
            //     if (dots[t].color == "red") {
            //         this.redcount++
            //     }
            //     if (dots[t].color == "green") {
            //         this.greencount++
            //     }
            //     if (dots[t].color == "blue") {
            //         this.bluecount++
            //     }
            // }

            // if(generation%3 ==0){
            //     this.redcount = 132
            //     this.greencount = 133
            //     this.bluecount = 134+ Math.floor(Math.random()*30)
            // }
            // if(generation%3 ==1){
            //     this.redcount = 133
            //     this.greencount = 134+ Math.floor(Math.random()*30)
            //     this.bluecount = 132
            // }
            // if(generation%3 ==2){
            //     this.redcount = 134 + Math.floor(Math.random()*30)
            //     this.greencount = 133
            //     this.bluecount = 132
            // }
            // this.redcount = 132
            // this.greencount = 133
            // this.bluecount = 134
            // let weightCalcred = 0
            // let weightCalcgreen = 0
            // let weightCalcblue = 0
            this.totalUp = 0
            this.totalDown = 0
            this.totalLeft = 0
            this.totalRight = 0

            for (let t = 0; t < this.outputs.length; t++) {

                let weightCalcLeft = 0
                let weightCalcRight = 0
                let weightCalcUp = 0
                let weightCalcDown = 0
                for (let k = 0; k < this.brainNodes.length; k++) {
                    weightCalcLeft += (this.brainNodes[k][1] * ((this.xpos - 10) / 210)) * this.outputs[t][k + 1]
                    weightCalcRight += (this.brainNodes[k][2] * ((this.xpos - 10) / 210)) * this.outputs[t][k + 1]
                    weightCalcUp += (this.brainNodes[k][3] * ((this.ypos - 10) / 210)) * this.outputs[t][k + 1]
                    weightCalcDown += (this.brainNodes[k][4] * ((this.ypos - 10) / 210)) * this.outputs[t][k + 1]

                }



                this.totalUp += weightCalcUp
                this.totalRight += weightCalcRight
                this.totalLeft += weightCalcLeft
                this.totalDown += weightCalcDown
            }


            let upNorm = this.totalUp

            let rightNorm = this.totalRight

            let leftNorm = this.totalLeft

            let downNorm = this.totalDown

            let outputarr = [this.totalUp, this.totalDown, this.totalLeft, this.totalRight]

            // Math.min(Math.min(this.totalBlue, this.totalGreen),this.totalRed)
            // Math.max(Math.max(this.totalBlue, this.totalGreen),this.totalRed)

            upNorm = this.normalize(upNorm, Math.min(...outputarr), Math.max(...outputarr))
            downNorm = this.normalize(downNorm, Math.min(...outputarr), Math.max(...outputarr))
            leftNorm = this.normalize(leftNorm, Math.min(...outputarr), Math.max(...outputarr))
            rightNorm = this.normalize(rightNorm, Math.min(...outputarr), Math.max(...outputarr))


            // this.totalRed = redNorm
            // this.totalBlue = blueNorm
            // this.totalGreen = greenNorm


            this.totalUp = upNorm
            this.totalDown = downNorm
            this.totalLeft = leftNorm
            this.totalRight = rightNorm

            // this.totalRed = Math.max(this.totalRed, 0)
            // this.totalGreen = Math.max(this.totalGreen, 0)
            // this.totalBlue = Math.max(this.totalBlue, 0)

            // if (this.totalBlue < this.totalRed && this.totalBlue < this.totalGreen) {
            //     if (this.totalBlue < 0) {
            //         this.totalRed += Math.abs(this.totalBlue) * 2
            //         this.totalGreen += Math.abs(this.totalBlue) * 2
            //         this.totalBlue = Math.abs(this.totalBlue)
            //     }
            // } else if (this.totalGreen < this.totalRed && this.totalGreen < this.totalGreen) {
            //     if (this.totalGreen < 0) {
            //         this.totalRed += Math.abs(this.totalGreen) * 2
            //         this.totalGreen += Math.abs(this.totalGreen) * 2
            //         this.totalGreen = Math.abs(this.totalGreen)
            //     }
            // } else if (this.totalRed < this.totalGreen && this.totalRed < this.totalGreen) {
            //     if (this.totalRed < 0) {
            //         this.totalRed += Math.abs(this.totalRed) * 2
            //         this.totalBlue += Math.abs(this.totalRed) * 2
            //         this.totalRed = Math.abs(this.totalRed)
            //     }
            // }

            let bumpUp = (this.totalUp / (this.totalUp + this.totalDown + this.totalLeft + this.totalRight))
            let bumpDown = (this.totalDown / (this.totalUp + this.totalDown + this.totalLeft + this.totalRight))
            let bumpLeft = (this.totalLeft / (this.totalUp + this.totalDown + this.totalLeft + this.totalRight))
            let bumpRight = (this.totalRight / (this.totalUp + this.totalDown + this.totalLeft + this.totalRight))


            this.totalUp = bumpUp
            this.totalDown = bumpDown
            this.totalLeft = bumpLeft
            this.totalRight = bumpRight




            // if(this.totalLeft > this.totalRight){
            //     this.totalLeft = 1
            //     this.totalRight = 0
            // }
            // if(this.totalLeft < this.totalRight){
            //     this.totalLeft = 0
            //     this.totalRight = 1
            // }
            this.outputs[0][0].color = `rgba(255,0,0,${Math.max(this.totalLeft / cepts.length, (1 / 255))})`
            this.outputs[1][0].color = `rgba(0,255,0,${Math.max(this.totalRight / cepts.length, (1 / 255))})`
            this.outputs[2][0].color = `rgba(0,0,255,${Math.max(this.totalUp / cepts.length, (1 / 255))})`
            this.outputs[3][0].color = `rgba(255,255,0,${Math.max(this.totalDown / cepts.length, (1 / 255))})`

            outputarr = [this.totalUp, this.totalDown, this.totalLeft, this.totalRight]


            // this.ymom += (this.totalDown-this.totalUp)/10

            // this.xmom += (this.totalRight-this.totalLeft)/10

            // if (Math.max(...outputarr) == this.totalUp) {
            this.ymom -= this.totalUp / 50
            // }

            // if (Math.max(...outputarr) == this.totalDown) {
            this.ymom += this.totalDown / 50
            // }

            // if (Math.max(...outputarr) == this.totalLeft) {
            this.xmom -= this.totalLeft / 50
            // }

            // if (Math.max(...outputarr) == this.totalRight) {
            this.xmom += this.totalRight / 50
            // }

        }



    }

    let cepts = []
    for (let t = 0; t < 25; t++) {
        let perspy = new Perceptron()
        cepts.push(perspy)
    }
    let food = new Circle(11 + (Math.random() * 200), 11 + (Math.random() * 200), 5, "red")

    let timer = 0
    let timerlock = 50
    function main() {
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        timer++
        canvas_context.strokeRect(11, 11, 200, 200)
        food.draw()
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // box1.draw()
        // box2.draw()
        // box3.draw()
        // split.draw()
        for (let t = 0; t < dots.length; t++) {
            // dots[t].draw()
        }
        for (let t = 0; t < cepts.length; t++) {
            cepts[t].draw()
        }
        for (let f = 0; f < cepts.length; f++) {
            for (let d = 0; d < cepts.length; d++) {
                if (cepts[d].marked == 1) {
                    cepts[d].clean()
                }
            }
        }
        for (let f = 0; f < cepts.length; f++) {
            for (let d = 0; d < cepts.length; d++) {
                if (cepts[d].marked == 1) {
                    cepts[d].clean()
                }
            }
        }
        if (boingo == 1) {
            boingo = 0
            cepts[0].boingo()
        }
        if (keysPressed[' ']) {
            console.log(cepts)
        }
        if (keysPressed['e']) {
            cepts.splice(1)
        }
        if (keysPressed['w']) {
            cepts.splice(2)
        }
        if (keysPressed['q']) {
            cepts[Math.floor(Math.random() * cepts.length)].clone()
        }
        if (keysPressed['f']) {
            timerlock++
        }
        if (keysPressed['g']) {
            timerlock--
        }
        if (keysPressed['s']) {
            cepts[Math.floor(Math.random() * cepts.length)].mutate()
            cepts[Math.floor(Math.random() * cepts.length)].compute()
        }

        if (timer % timerlock == 0) {
            let min = 500
            let index = 0
            for (let t = 0; t < cepts.length; t++) {
                let link = new LineOP(cepts[t].body, food, "red", 1)
                if (link.hypotenuse() < min) {
                    min = link.hypotenuse()
                    link.draw()
                    index = t
                } else {
                    cepts[t].marked = 1
                }
            }



            for (let t = 0; t < cepts.length; t++) {

                if (t != index) {
                    cepts[t].marked = 1
                } else {
                    cepts[t].xpos = 100
                    cepts[t].ypos = 100
                    cepts[t].body.x = 100
                    cepts[t].body.y = 100
                    cepts[t].xmom = 0
                    cepts[t].ymom = 0
                }
            }

            for (let f = 0; f < cepts.length; f++) {
                for (let d = 0; d < cepts.length; d++) {
                    if (cepts[d].marked == 1) {
                        cepts[d].clean()
                    }
                }
            }
            for (let f = 0; f < cepts.length; f++) {
                for (let d = 0; d < cepts.length; d++) {
                    if (cepts[d].marked == 1) {
                        cepts[d].clean()
                    }
                }
            }
            console.log(cepts)
            for (let t = 0; cepts.length < 50; t++) {
                cepts[0].clone()
            }

        }

        canvas_context.fillStyle = "white"
        canvas_context.fillText(`${timer % timerlock}`, 50, 250)

    }

})
