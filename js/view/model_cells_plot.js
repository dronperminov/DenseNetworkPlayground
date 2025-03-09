class ModelCellsPlot {
    constructor(viewBox, canvas, model, thresholds, mode = "", size = 100) {
        this.viewBox = viewBox
        this.canvas = canvas
        this.model = model
        this.thresholds = thresholds
        this.point = new Float64Array(model.inputs).fill(0)

        this.ctx = canvas.getContext("2d")
        this.axes = [0, 1]
        this.mode = mode
        this.size = size
        this.selectedCells = []

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

    SetMode(mode) {
        let config = {inputs: false, outputs: false, pixels: true}

        if (!this.IsVisible()) {
            config.inputs = true
            config.outputs = true
        }

        this.mode = mode
        this.Plot(config)
    }

    SetPoint(point) {
        for (let i = 0; i < this.model.inputs; i++)
            this.point[i] = point[i]

        this.Plot()
    }

    SetCell(cell, selected) {
        if (selected)
            this.selectedCells.push(cell)
        else
            this.selectedCells.splice(this.selectedCells.indexOf(cell), 1)

        this.Plot({inputs: false, outputs: false, pixels: true})
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
        this.outputs = null
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
                    this.inputs[index + d] = this.point[d]

                this.inputs[index + this.axes[0]] = limits.xmin + dj * j
                this.inputs[index + this.axes[1]] = limits.ymax - di * i
                index += this.model.inputs
            }
        }
    }

    UpdateOutputs() {
        let predictions = this.model.PredictWithSignsUnrolled(this.inputs, this.canvas.width * this.canvas.height)
        this.outputs = predictions.result
        this.signs = predictions.signs
    }

    UpdatePixels() {
        let index = 0

        for (let i = 0; i < this.outputs.length; i++) {
            let [r, g, b] = [0, 0, 0]

            if (this.CheckSigns(i))
                [r, g, b] = this.thresholds.GetOutputColor(this.outputs[i], this.mode)

            this.pixels.data[index++] = r
            this.pixels.data[index++] = g
            this.pixels.data[index++] = b
            this.pixels.data[index++] = 255
        }

        this.ctx.putImageData(this.pixels, 0, 0)
    }

    CheckSigns(index) {
        for (let cell of this.selectedCells) {
            let canShow = true

            for (let i = 0; i < this.signs[index].length && canShow; i++)
                if (this.signs[index][i] != cell.signs[i])
                    canShow = false

            if (canShow)
                return true
        }

        return this.selectedCells.length == 0
    }

    Resize() {
        if (this.canvas.clientWidth == 0 || this.canvas.clientHeight == 0)
            return

        this.UpdateCanvasSize()
        this.Plot()
    }

    Clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    IsVisible() {
        return this.mode != "no"
    }
}