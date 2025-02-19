class ModelOutputLayer {
    constructor(viewBox, canvas, model, thresholds) {
        this.viewBox = viewBox
        this.canvas = canvas
        this.model = model
        this.thresholds = thresholds

        this.ctx = canvas.getContext("2d")
        this.axes = [0, 1]
        this.mode = ""
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
    }

    UpdateCanvasSize() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight
        let aspectRatio = width / height
        let dpr = window.devicePixelRatio || 1

        if (this.size === "max") {
            width *= dpr
            height *= dpr
        }
        else if (this.size === "half") {
            width *= dpr / 2
            height *= dpr / 2
        }
        else if (width > height) {
            width = this.size
            height = this.size / aspectRatio
        }
        else {
            width = this.size * aspectRatio
            height = this.size
        }

        this.canvas.width = width
        this.canvas.height = height

        this.inputs = new Float64Array(width * height * this.model.inputs)
        this.outputs = new Float64Array(width * height)
        this.pixels = this.ctx.createImageData(width, height)
    }

    UpdateInputs() {
        if (this.inputs.length != this.canvas.width * this.canvas.height * this.model.inputs)
            this.inputs = new Float64Array(this.canvas.width * this.canvas.height * this.model.inputs)

        let limits = this.viewBox.GetLimits()
        let dj = (limits.xmax - limits.xmin) / (this.canvas.width - 1)
        let di = (limits.ymax - limits.ymin) / (this.canvas.height - 1)
        let index = 0

        for (let i = 0; i < this.canvas.height; i++) {
            for (let j = 0; j < this.canvas.width; j++) {
                for (let d = 0; d < this.model.inputs; d++)
                    this.inputs[index + d] = 0

                this.inputs[index + this.axes[0]] = limits.xmin + dj * j
                this.inputs[index + this.axes[1]] = limits.ymax - di * i
                index += this.model.inputs
            }
        }
    }

    UpdateOutputs() {
        this.model.PredictAt(this.show.layer, this.show.neuron, this.inputs, this.outputs.length, this.outputs)
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

    Resize() {
        this.UpdateCanvasSize()
        this.Plot()
    }

    Clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    IsVisible() {
        return this.mode != "no"
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
