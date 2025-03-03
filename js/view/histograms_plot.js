class HistogramsPlot {
    constructor(svg, min = -1, max = 1, n = 20) {
        this.svg = svg
        this.plots = []
        this.labels = []

        this.min = min
        this.max = max
        this.n = n
        this.step = (max - min) / n
        this.bins = this.InitBins()

        this.padding = 0
        this.gap = 55

        this.delta = 10
        this.point = null

        this.svg.addEventListener("mousemove", e => this.MouseMove(e))
        this.svg.addEventListener("mousedown", e => this.MouseDown(e))
        this.svg.addEventListener("mouseup", e => this.MouseUp(e))
        this.svg.addEventListener("mouseleave", e => this.MouseUp(e))

        this.UpdateSizes()

        new ResizeObserver(() => this.Resize()).observe(this.svg)
    }

    Add(label, config) {
        let g = MakeElement(this.svg, null, "g")
        let rects = []
        let labels = []
        let bins = []

        for (let i = 0; i < this.n + 2; i++) {
            rects.push(MakeElement(g, {fill: config.color, stroke: "#fff"}, "rect"))
            labels.push(MakeElement(g, {textContent: "", class: "histogram-label"}, "text"))
        }

        for (let bin of this.bins)
            bins.push(MakeElement(g, {textContent: bin, class: "histogram-bin"}, "text"))

        this.labels.push(label)
        this.plots[label + 1] = {
            label: label,
            histogram: new Int32Array(this.n + 2),
            counts: new Int32Array(3),
            max: 0,
            g: g,
            rects: rects,
            labels: labels,
            bins: bins,
            countLabels: [
                MakeElement(g, {class: "histogram-threshold-label", fill: config.color}, "text"),
                MakeElement(g, {class: "histogram-threshold-label", fill: config.color}, "text"),
                MakeElement(g, {class: "histogram-threshold-label", fill: config.color}, "text")
            ]
        }
    }

    SetThresholds(thresholds) {
        this.thresholds = thresholds
        this.thresholds.on("change", (low, high) => this.ChangeThresholds())

        this.thresholdPaths = {
            low: MakeElement(this.svg, {class: "histogram-threshold", "stroke-width": 1}, "path"),
            high: MakeElement(this.svg, {class: "histogram-threshold", "stroke-width": 1}, "path")
        }

        this.ChangeThresholds()
    }

    Reset() {
        for (let plot of this.plots) {
            plot.histogram.fill(0)
            plot.counts.fill(0)
        }
    }

    Update(outputs, predictions) {
        for (let i = 0; i < outputs.length; i++) {
            let label = Math.sign(outputs[i])
            let index = this.Value2Index(predictions[i])
            let plot = this.plots[label + 1]

            plot.histogram[index]++

            if (predictions[i] < this.thresholds.low)
                plot.counts[0]++
            else if (predictions[i] < this.thresholds.high)
                plot.counts[1]++
            else
                plot.counts[2]++
        }
    }

    Plot() {
        let plots = this.GetVisiblePlots()

        let height = this.height / Math.max(plots.length, 1)
        let xLow = this.Threshold2Coordinate(this.thresholds.low)
        let xHigh = this.Threshold2Coordinate(this.thresholds.high)

        for (let i = 0; i < plots.length; i++)
            this.PlotHistogram(plots[i], this.padding + i * height, height - this.gap, xLow, xHigh)
    }

    Resize() {
        this.UpdateSizes()
        this.ChangeThresholds()
        this.Plot()
    }

    GetVisiblePlots() {
        let plots = []

        for (let label of this.labels) {
            let plot = this.plots[label + 1]
            plot.max = Math.max(...plot.histogram)

            if (plot.max == 0) {
                plot.g.setAttribute("visibility", "hidden")
            }
            else {
                plot.g.removeAttribute("visibility")
                plots.push(plot)
            }
        }

        return plots
    }

    UpdateSizes() {
        this.width = this.svg.clientWidth - 2 * this.padding
        this.height = this.svg.clientHeight - 2 * this.padding
        this.rectWidth = this.width / (this.n + 2)
    }

    ChangeThresholds() {
        let xLow = this.Threshold2Coordinate(this.thresholds.low)
        let xHigh = this.Threshold2Coordinate(this.thresholds.high)

        SetAttributes(this.thresholdPaths.low, {d: `M${xLow} ${this.padding} l0 ${this.height}`})
        SetAttributes(this.thresholdPaths.high, {d: `M${xHigh} ${this.padding} l0 ${this.height}`})
    }

    PlotHistogram(plot, y0, height, xLow, xHigh) {
        for (let i = 0; i < this.n + 2; i++) {
            let rectHeight = plot.histogram[i] / plot.max * height
            let x = this.padding + i * this.rectWidth
            let y = y0 + height - rectHeight
            let label = plot.histogram[i] > 0 ? `${plot.histogram[i]}` : ""
            let anchor = rectHeight > height / 2 ? "start" : "end"

            SetAttributes(plot.rects[i], {x: x, y: y, width: this.rectWidth, height: rectHeight})
            SetAttributes(plot.labels[i], {x: x + this.rectWidth / 2, y: y, textContent: label, "text-anchor": anchor})
        }

        for (let i = 0; i <= this.n; i++)
            SetAttributes(plot.bins[i], {x: this.padding + (i + 1) * this.rectWidth, y: y0 + height + 1})

        let total = plot.counts[0] + plot.counts[1] + plot.counts[2]
        let y = y0 + height + 40
        let x = [this.padding, xLow, xHigh, this.padding + this.width]

        for (let i = 0; i < 3; i++)
            SetAttributes(plot.countLabels[i], {x: (x[i] + x[i + 1]) / 2, y: y, textContent: this.Count2Text(plot.counts[i], total)})
    }

    InitBins() {
        let bins = []

        for (let i = 0; i <= this.n; i++)
            bins[i] = Round(this.min + i * this.step, 100000)

        return bins
    }

    Value2Index(value) {
        if (value < this.min)
            return 0

        if (value >= this.max)
            return this.n + 1

        for (let i = 0; i < this.n; i++)
            if (this.bins[i] <= value && value < this.bins[i + 1])
                return i + 1
    }

    Count2Text(count, total) {
        if (count == 0)
            return ""

        return `${count} (${Round(count / total * 100, 100)}%)`
    }

    Threshold2Coordinate(threshold) {
        let part = (threshold - this.min) / this.step
        return this.padding + (part + 1) * this.rectWidth
    }

    Coordinate2Threshold(x) {
        let part = (x - this.padding) / this.rectWidth - 1
        let threshold = this.min + part * this.step

        return Round(Math.max(this.min, Math.min(this.max, threshold)), 20)
    }

    Coordinate2ThresholdName(x) {
        let xLow = this.Threshold2Coordinate(this.thresholds.low)
        let xHigh = this.Threshold2Coordinate(this.thresholds.high)

        if (Math.abs(x - xLow) > this.delta && Math.abs(x - xHigh) > this.delta)
            return null

        if (x <= xLow)
            return "low"

        if (x >= xHigh)
            return "high"

        return x <= xLow + this.delta ? "low" : "high"
    }

    GetPoint(e) {
        return Math.max(this.padding, Math.min(this.svg.clientWidth - this.padding, e.offsetX))
    }

    HoverThresholds(x) {
        this.thresholdPaths.low.classList.remove("histogram-threshold-hover")
        this.thresholdPaths.high.classList.remove("histogram-threshold-hover")
        this.svg.classList.remove("histograms-plot-hover")

        let name = this.Coordinate2ThresholdName(x)
        if (name === null)
            return

        this.thresholdPaths[name].classList.add("histogram-threshold-hover")
        this.svg.classList.add("histograms-plot-hover")
    }

    MouseMove(e) {
        let x = this.GetPoint(e)

        if (this.point === null) {
            this.HoverThresholds(x)
            return
        }

        let threshold = this.Coordinate2Threshold(x)

        if (this.point == "low")
            this.thresholds.SetLow(Math.min(threshold, this.thresholds.high, 0))
        else
            this.thresholds.SetHigh(Math.max(threshold, this.thresholds.low, 0))
    }

    MouseDown(e) {
        this.point = this.Coordinate2ThresholdName(this.GetPoint(e))

        if (this.point !== null)
           this.thresholdPaths[this.point].classList.add("histogram-threshold-hover")
    }

    MouseUp(e) {
        this.point = null
    }
}
