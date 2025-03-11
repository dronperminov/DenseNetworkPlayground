class HistogramPlot {
    constructor(div, config) {
        this.svg = MakeElement(div, null, "svg")
        this.config = config
        this.bottom = 22

        this.Init()
    }

    Init() {
        this.bins = []
        this.binsLabels = []
        this.rects = []
        this.labels = []

        this.step = (this.config.max - this.config.min) / this.config.n
        this.histogram = new Int32Array(this.config.n + 2)
        this.histogramMax = 0

        for (let i = 0; i <= this.config.n; i++) {
            let bin = Round(this.config.min + i * this.step, 100000)

            this.bins.push(bin)
            this.binsLabels.push(MakeElement(this.svg, {textContent: bin, class: "histogram-bin"}, "text"))
        }

        for (let i = 0; i < this.config.n + 2; i++) {
            this.rects.push(MakeElement(this.svg, {fill: this.config.color, stroke: this.config.border, "stroke-width": 1, rx: 5, ry: 5}, "rect"))
            this.labels.push(MakeElement(this.svg, {textContent: "", class: "histogram-label"}, "text"))
        }

        new ResizeObserver(() => this.Resize()).observe(this.svg)
    }

    ChangeData(values) {
        this.histogram.fill(0)

        for (let value of values)
            this.histogram[this.Value2Index(value)]++

        this.histogramMax = Math.max(...this.histogram)

        this.Plot()
    }

    Plot() {
        let height = this.svg.clientHeight - this.bottom

        for (let i = 0; i < this.config.n + 2; i++) {
            let rectHeight = Math.max(this.histogram[i] / this.histogramMax * height, 0)

            this.rects[i].setAttribute("y", height - rectHeight)
            this.rects[i].setAttribute("height", rectHeight)

            this.labels[i].setAttribute("y", height - rectHeight + (rectHeight > height / 2 ? 4 : -2))
            this.labels[i].setAttribute("text-anchor", rectHeight > height / 2 ? "start" : "end")
            this.labels[i].textContent = this.histogram[i] > 0 ? `${this.histogram[i]}` : ""
        }
    }

    Resize() {
        if (this.svg.clientWidth == 0 || this.svg.clientHeight == 0)
            return

        let width = this.svg.clientWidth / (this.config.n + 2)

        for (let i = 0; i <= this.config.n; i++) {
            this.binsLabels[i].setAttribute("x", (i + 1) * width)
            this.binsLabels[i].setAttribute("y", this.svg.clientHeight - this.bottom)
        }

        for (let i = 0; i < this.config.n + 2; i++) {
            this.rects[i].setAttribute("x", i * width)
            this.rects[i].setAttribute("width", width)
            this.labels[i].setAttribute("x", (i + 0.5) * width)
        }

        this.Plot()
    }

    Value2Index(value) {
        if (value < this.config.min)
            return 0

        if (value >= this.config.max)
            return this.config.n + 1

        return 1 + Math.floor((value - this.config.min) / this.step)
    }
}
