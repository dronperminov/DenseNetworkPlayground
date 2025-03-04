class MetricsPlot {
    constructor(div, metrics) {
        this.div = div
        this.metrics = metrics
        this.plots = {}
        this.padding = 2
        this.topPadding = 20

        new ResizeObserver(() => this.Plot()).observe(div)
    }

    Add(metric, names, config) {
        let svg = MakeElement(this.div, null, "svg")
        svg.addEventListener("mousedown", e => this.MetricClick(metric, e.offsetX))
        svg.addEventListener("wheel", e => this.MetricWheel(metric, e))

        let axes = MakeElement(svg, {class: "metric-axes"}, "path")
        let title = MakeElement(svg, {class: "metric-title", x: 0, y: 0, textContent: config.title}, "text")
        let g = MakeElement(svg, null, "g")
        let paths = {}

        for (let name of names)
            paths[name.label] = this.InitPaths(name, g)

        let rect = MakeElement(svg, {class: "metric-rect", rx: 5, ry: 5}, "rect")

        for (let name of names)
            paths[name.label].label = MakeElement(svg, {class: "metric-label", fill: name.color, textContent: name.title}, "text")

        let startEpoch = MakeElement(svg, {class: "metric-start-epoch"}, "text")
        let epoch = MakeElement(svg, {class: "metric-epoch"}, "text")
        let maxValue = MakeElement(svg, {class: "metric-max-value"}, "text")

        this.plots[metric] = {
            svg: svg,
            axes: axes,
            title: title,
            g: g,
            rect: rect,
            startEpoch: startEpoch,
            epoch: epoch,
            maxValue: maxValue,
            paths: paths,
            labels: names.map(name => name.label),
            percent: config.percent,
            start: 0,
            maxSteps: 100
        }
    }

    Set(metric, name, step, value) {
        this.plots[metric].start = Math.max(this.plots[metric].start, step - this.plots[metric].maxSteps)
    }

    Reset() {
        for (let plot of Object.values(this.plots)) {
            plot.start = 0
            plot.maxSteps = 100
        }

        this.Plot()
    }

    Plot() {
        for (let metric of Object.keys(this.plots))
            this.PlotMetric(metric)
    }

    PlotMetric(metric) {
        let plot = this.plots[metric]
        let metrics = this.metrics.metrics[metric]
        let maxEpoch = this.GetMaxEpoch(metrics)
        let maxValue = this.GetMaxValue(metrics, plot.start)

        let width = plot.svg.clientWidth
        let height = plot.svg.clientHeight

        let left = this.padding
        let right = width - this.padding
        let top = this.topPadding
        let bottom = height - this.padding

        SetAttributes(plot.axes, {d: `M${left} ${top} L${left} ${bottom} L${right} ${bottom}`})
        SetAttributes(plot.startEpoch, {x: left + 2, y: bottom, textContent: plot.start > 0 ? plot.start : ""})
        SetAttributes(plot.epoch, {x: right, y: bottom, textContent: maxEpoch > 0 ? maxEpoch : ""})
        SetAttributes(plot.maxValue, {x: left + 5, y: top, textContent: maxValue > -Infinity ? this.Value2Text(maxValue, plot.percent) : ""})

        this.PlotLabels(plot, metrics, maxEpoch, left + 5, bottom - 30)
        this.PlotPaths(plot, metrics, Math.max(maxEpoch, 1) - plot.start, maxValue == 0 ? 1 : maxValue, left, right, top, bottom)
    }

    GetMaxEpoch(metrics) {
        let maxEpoch = 0

        for (let values of Object.values(metrics))
            maxEpoch = Math.max(maxEpoch, values.length - 1)

        return maxEpoch
    }

    GetMaxValue(metrics, start = 0) {
        let maxValue = -Infinity

        for (let values of Object.values(metrics))
            for (let [epoch, value] of Object.entries(values))
                if (epoch >= start)
                    maxValue = Math.max(maxValue, value)

        return maxValue
    }

    PlotLabels(plot, metrics, epoch, x, y) {
        let width = 0
        let height = 0

        for (let label of plot.labels) {
            if (epoch in metrics[label]) {
                let text = `${plot.paths[label].title}: ${this.Value2Text(metrics[label][epoch], plot.percent)}`
                SetAttributes(plot.paths[label].label, {x: x + 3, y: y - 3, textContent: text, visibility: ""})

                y -= 15
                width = Math.max(width, plot.paths[label].label.getBBox().width)
                height += 15
            }
            else {
                SetAttributes(plot.paths[label].label, {visibility: "hidden"})
            }
        }

        SetAttributes(plot.rect, {x: x, y: y + 9, width: width + 6, height: height + 6})
    }

    PlotPaths(plot, metrics, maxEpoch, maxValue, left, right, top, bottom) {
        let dx = (right - left) / maxEpoch
        let dy = (top - bottom) / maxValue

        plot.g.setAttribute("transform", `translate(${left}, ${bottom})`)

        for (let label of plot.labels) {
            if (metrics[label].length <= plot.start) {
                plot.paths[label].stroke.removeAttribute("d")
                plot.paths[label].fill.removeAttribute("d")
                continue
            }

            let {stroke, fill} = this.GetPathPoints(metrics[label], plot.start, dx, dy)

            SetAttributes(plot.paths[label].stroke, {d: stroke})
            SetAttributes(plot.paths[label].fill, {d: fill})
        }
    }

    InitPaths(name, svg) {
        let fill = MakeElement(svg, {fill: name.background, stroke: "none"}, "path")
        let stroke = MakeElement(svg, {stroke: name.color, fill: "none", "stroke-width": 1.5}, "path")
        return {title: name.title, fill: fill, stroke: stroke}
    }

    GetPathPoints(values, start, dx, dy) {
        let stroke = []
        let fill = []
        let prev = 0

        for (let [epoch, value] of Object.entries(values)) {
            if (epoch < start)
                continue

            let x = (epoch - start) * dx
            let y = value * dy

            if (!prev || epoch - prev != 1) {
                stroke.push(`M${x} ${y}`)

                if (prev)
                    fill.push("V 0")

                fill.push(`M${x} 0 V ${y}`)
            }
            else {
                stroke.push(`L${x} ${y}`)
                fill.push(`L${x} ${y}`)
            }

            prev = epoch
        }

        stroke.push("m 1, 0 a 1,1 0 1,0 -2,0 a 1,1 0 1,0 2,0")
        fill.push("V 0 z")

        return {stroke: stroke.join(""), fill: fill.join("")}
    }

    Value2Text(value, percent) {
        return percent ? `${Round(value * 100, 100)}%` : `${Round(value, 10000)}`
    }

    MetricClick(metric, x) {
        let maxEpoch = this.GetMaxEpoch(this.metrics.metrics[metric])
        let plot = this.plots[metric]

        let left = this.padding
        let right = plot.svg.clientWidth - this.padding

        if (plot.start > 0 || maxEpoch < 5) {
            plot.start = 0
        }
        else {
            x = Math.min(Math.max(x, left), right)
            plot.start = Math.max(0, Math.min(maxEpoch - 1, Math.round((x - left) / (right - left) * maxEpoch)))
        }

        this.PlotMetric(metric)
    }

    MetricWheel(metric, e) {
        e.preventDefault()

        let maxEpoch = this.GetMaxEpoch(this.metrics.metrics[metric])
        let plot = this.plots[metric]
        let step = Math.sign(e.deltaY) * (e.shiftKey ? 10 : 1)

        if (e.ctrlKey) {
            plot.maxSteps = Math.max(2, plot.maxSteps + step)
            plot.start = Math.max(plot.start, maxEpoch - plot.maxSteps)
        }
        else
            plot.start = Math.max(0, Math.min(maxEpoch - 1, plot.start + step))

        this.PlotMetric(metric)
    }
}
