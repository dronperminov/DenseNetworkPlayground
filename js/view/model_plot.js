class ModelPlot {
    constructor(viewBox, canvas, model, thresholds) {
        this.viewBox = viewBox
        this.canvas = canvas
        this.model = model
        this.thresholds = thresholds

        this.ctx = canvas.getContext("2d")
        this.axes = [0, 1]

        this.mode = ""
        this.SetSize(100)

        this.viewBox.on("change-limits", limits => this.Plot())
        new ResizeObserver(() => this.UpdateCanvasSize()).observe(canvas)
    }

    SetAxes(xAxis, yAxis) {
        this.axes[0] = xAxis
        this.axes[1] = yAxis
        this.Plot()
    }

    SetMode(mode) {
        if (mode == this.mode)
            return

        if (this.mode == "no" && this.model.inputs == 2) {
            this.UpdateInputs()
            this.UpdateOutput()
        }

        this.mode = mode

        if (!this.CanPlot()) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            return
        }

        this.UpdatePixels()
    }

    SetSize(size) {
        this.size = size
        this.UpdateCanvasSize()
    }

    CanPlot() {
        return this.model.inputs == 2 && this.mode != "no"
    }

    Plot() {
        if (!this.CanPlot())
            return

        this.UpdateInputs()
        this.UpdateOutput()
        this.UpdatePixels()
    }

    ChangeModel() {
        if (this.model.inputs != 2) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            return
        }

        if (!this.CanPlot())
            return

        this.UpdateOutput()
        this.UpdatePixels()
    }

    UpdateOutput() {
        this.model.Predict(this.inputs, this.canvas.width * this.canvas.height, this.outputs)
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

    UpdateInputs() {
        let limits = this.viewBox.GetLimits()
        let index = 0

        for (let i = 0; i < this.canvas.height; i++) {
            for (let j = 0; j < this.canvas.width; j++) {
                this.inputs[index * 2 + this.axes[0]] = limits.xmin + (limits.xmax - limits.xmin) * j / (this.canvas.width - 1)
                this.inputs[index * 2 + this.axes[1]] = limits.ymax - (limits.ymax - limits.ymin) * i / (this.canvas.height - 1)
                index++
            }
        }
    }

    UpdateCanvasSize() {
        let width = this.canvas.clientWidth
        let height = this.canvas.clientHeight
        let aspectRatio = width / height

        if (this.size === "max") {
            let dpr = window.devicePixelRatio || 1

            this.canvas.width = width * dpr
            this.canvas.height = height * dpr
        }
        else if (width > height) {
            this.canvas.width = this.size
            this.canvas.height = this.size / aspectRatio
        }
        else {
            this.canvas.width = this.size * aspectRatio
            this.canvas.height = this.size
        }

        this.inputs = new Float64Array(this.canvas.width * this.canvas.height * 2)
        this.outputs = new Float64Array(this.canvas.width * this.canvas.height)
        this.pixels = this.ctx.createImageData(this.canvas.width, this.canvas.height)

        this.Plot()
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
