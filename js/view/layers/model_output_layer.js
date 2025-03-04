class ModelOutputLayer {
    constructor(viewBox, canvas, surfaceDiv, model, thresholds) {
        this.viewBox = viewBox
        this.canvas = canvas
        this.surfaceDiv = surfaceDiv
        this.model = model
        this.thresholds = thresholds
        this.point = new Float64Array(model.inputs).fill(0)

        this.ctx = canvas.getContext("2d")
        this.axes = [0, 1]
        this.mode = ""
        this.showSurface = false
        this.size = 100
        this.show = {layer: model.layers.length - 1, neuron: 0}

        this.UpdateCanvasSize()

        this.viewBox.on("change-limits", limits => this.Plot())
        new ResizeObserver(() => this.Resize()).observe(canvas)
    }

    SetAxes(xAxis, yAxis) {
        this.axes[0] = xAxis
        this.axes[1] = yAxis
        this.Plot()
    }

    SetSize(size) {
        this.size = size
        this.UpdateCanvasSize()
        this.Plot()
    }

    SetShow(layer, neuron) {
        this.show.layer = layer
        this.show.neuron = neuron
        this.Plot({inputs: false, outputs: true, pixels: true})
    }

    SetMode(mode) {
        let config = {inputs: false, outputs: false, pixels: true}

        if (!this.IsVisible()) {
            config.inputs = true
            config.outputs = true
        }

        this.mode = mode
        this.Plot(config)
    }

    SetSurfaceVisibility(visible) {
        this.showSurface = visible

        if (visible)
            this.surfaceDiv.classList.remove("hidden")
        else
            this.surfaceDiv.classList.add("hidden")

        this.Plot({inputs: false, outputs: false, pixels: false})
    }

    SetPoint(point) {
        for (let i = 0; i < this.model.inputs; i++)
            this.point[i] = point[i]

        this.Plot()
    }

    Plot(config = null) {
        if (!this.IsVisible()) {
            this.Clear()
            return
        }

        if (config === null)
            config = {inputs: true, outputs: true, pixels: true}

        if (config.inputs)
            this.UpdateInputs()

        if (config.outputs)
            this.UpdateOutputs()

        if (config.pixels)
            this.UpdatePixels()

        if (this.showSurface)
            this.UpdateSurface()
    }

    GetPoint(x, y) {
        let point = new Float64Array(this.model.inputs)

        for (let i = 0; i < this.model.inputs; i++)
            point[i] = this.point[i]

        point[this.axes[0]] = x
        point[this.axes[1]] = y
        return point
    }

    UpdateCanvasSize() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight
        let aspectRatio = width / height
        let dpr = window.devicePixelRatio || 1

        if (this.size === "max") {
            width = Math.round(width * dpr)
            height = Math.round(height * dpr)
        }
        else if (this.size === "half") {
            width = Math.round(width * dpr / 2)
            height = Math.round(height * dpr / 2)
        }
        else if (width > height) {
            width = this.size
            height = Math.round(this.size / aspectRatio)
        }
        else {
            width = Math.round(this.size * aspectRatio)
            height = this.size
        }

        this.canvas.width = width
        this.canvas.height = height

        this.inputs = new Float64Array(width * height * this.model.inputs)
        this.outputs = new Float64Array(width * height)
        this.pixels = this.ctx.createImageData(width, height)

        this.surfaceX = new Float64Array(width)
        this.surfaceY = new Float64Array(height)
        this.surfaceZ = []
        this.surface = false
        this.surfaceDiv.innerHTML = ""

        for (let i = 0; i < height; i++)
            this.surfaceZ[i] = new Float64Array(width)
    }

    UpdateInputs() {
        if (this.inputs.length != this.canvas.width * this.canvas.height * this.model.inputs)
            this.inputs = new Float64Array(this.canvas.width * this.canvas.height * this.model.inputs)

        let limits = this.viewBox.GetLimits()
        let dj = (limits.xmax - limits.xmin) / (this.canvas.width - 1)
        let di = (limits.ymax - limits.ymin) / (this.canvas.height - 1)
        let index = 0

        for (let i = 0; i < this.canvas.width; i++)
            this.surfaceX[i] = limits.xmin + dj * i

        for (let i = 0; i < this.canvas.height; i++)
            this.surfaceY[i] = limits.ymax - di * i

        for (let i = 0; i < this.canvas.height; i++) {
            for (let j = 0; j < this.canvas.width; j++) {
                for (let d = 0; d < this.model.inputs; d++)
                    this.inputs[index + d] = this.point[d]

                this.inputs[index + this.axes[0]] = this.surfaceX[j]
                this.inputs[index + this.axes[1]] = this.surfaceY[i]
                index += this.model.inputs
            }
        }
    }

    UpdateOutputs() {
        this.model.PredictAtUnrolled(this.show.layer, this.show.neuron, this.inputs, this.outputs.length, this.outputs)
    }

    UpdatePixels() {
        let index = 0

        for (let i = 0; i < this.outputs.length; i++) {
            let [r, g, b] = this.GetOutputColor(this.outputs[i])
            this.pixels.data[index++] = r
            this.pixels.data[index++] = g
            this.pixels.data[index++] = b
            this.pixels.data[index++] = 255
        }

        this.ctx.putImageData(this.pixels, 0, 0)
    }

    UpdateSurface() {
        let surface = this.GetSurface()

        this.surfaceDiv.classList.remove("hidden")

        if (!this.surface) {
            this.surface = true

            Plotly.newPlot(this.surfaceDiv, [surface], this.GetSurfaceLayout(), {displayModeBar: false})
        }
        else {
            Plotly.restyle(this.surfaceDiv, {
                x: [surface.x],
                y: [surface.y],
                z: [surface.z],
                colorscale: [surface.colorscale],
                cmin: surface.cmin,
                cmax: surface.cmax
            }, [0])

            Plotly.relayout(this.surfaceDiv, { scene: {camera: {eye: this.surfaceDiv.layout.scene.camera.eye }}}, [0])
        }
    }

    UpdatePoint() {
        if (this.point.length == this.model.inputs)
            return

        this.point = new Float64Array(this.model.inputs).fill(0)
    }

    Resize() {
        this.UpdateCanvasSize()
        this.Plot()
    }

    Clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.surfaceDiv.classList.add("hidden")
    }

    IsVisible() {
        return this.mode != "no"
    }

    GetSurface() {
        let cmin = Infinity
        let cmax = -Infinity
        let index = 0

        for (let i = 0; i < this.canvas.height; i++) {
            for (let j = 0; j < this.canvas.width; j++) {
                let output = this.outputs[index]
                this.surfaceZ[i][j] = output

                cmin = Math.min(cmin, output)
                cmax = Math.max(cmax, output)
                index++
            }
        }

        if (cmin == cmax) {
            cmin -= 0.001
            cmax += 0.001
        }

        return {
            x: this.surfaceX,
            y: this.surfaceY,
            z: this.surfaceZ,
            cmin: cmin,
            cmax: cmax,
            type: "surface",
            colorbar: {
                tickfont: {size: 10},
                thickness: 10
            },
            colorscale: this.GetSurfaceColorscale(cmin, cmax)
        }
    }

    GetSurfaceLayout() {
        return {
            margin: {l: 0, r: 0, b: 0, t: 0},
            autosize: true,
            width: this.surfaceDiv.clientWidth,
            height: this.surfaceDiv.clientHeight,
            scene: {
                xaxis: {title: `x${NumberToIndex(this.axes[0] + 1)}`},
                yaxis: {title: `x${NumberToIndex(this.axes[1] + 1)}`},
                zaxis: {title: `output` },
                camera: {
                    eye: {x: 1.25, y: 1.25, z: 1.25}
                }
            }
        }
    }

    GetOutputColor(output) {
        if (this.thresholds.IsInside(output))
            return [255, 255, 255]

        let color = output < 0 ? [118, 153, 212] : [221, 115, 115]
        let value = Math.abs(output)

        if (this.mode == "discrete") {
            value = this.DiscreteValue(value, 1)
        }
        else if (this.mode == "discrete-2") {
            value = this.DiscreteValue(value, 2)
        }
        else if (this.mode == "discrete-4") {
            value = this.DiscreteValue(value, 4)
        }
        else if (this.mode == "discrete-10") {
            value = this.DiscreteValue(value, 10)
        }

        return this.MixColor(color, [255, 255, 255], value)
    }

    GetSurfaceColorscale(zmin, zmax) {
        let values = [zmin, zmax]

        for (let i = -10; i <= 10; i++)
            values.push(i / 10)

        let colorscale = []

        for (let value of values) {
            let scale = (value - zmin) / (zmax - zmin)

            if (scale < 0 || scale > 1)
                continue

            let [r, g, b] = this.GetOutputColor(value)
            colorscale.push([`${scale}`, `rgb(${r}, ${g}, ${b})`])
        }

        colorscale.sort((a, b) => +a[0] - b[0])
        return colorscale
    }

    DiscreteValue(value, levels) {
        return (Math.round(value * levels) + 1) / levels 
    }

    MixColor(color1, color2, t) {
        t = Math.max(0, Math.min(1, t))

        return [
            Math.floor(color1[0] * t + color2[0] * (1 - t)),
            Math.floor(color1[1] * t + color2[1] * (1 - t)),
            Math.floor(color1[2] * t + color2[2] * (1 - t))
        ]
    }
}
