class MetricsPlot {
    constructor(div, metrics) {
        this.div = div
        this.metrics = metrics
        this.plots = {}
        this.padding = 5
        this.topPadding = 20

        new ResizeObserver(() => this.Plot()).observe(div)
    }

    Add(metric, names, config) {
        let svg = MakeElement(this.div, null, "svg")
        svg.addEventListener("mousedown", e => this.MetricClick(metric, e.offsetX))
        svg.addEventListener("wheel", e => this.MetricWheel(metric, e))

        let axes = MakeElement(svg, {class: "metric-axes"}, "path")
        let title = MakeElement(svg, {class: "metric-title", x: this.padding, y: 2, textContent: config.title}, "text")
        let paths = {}

        for (let name of names)
            paths[name.label] = this.InitPaths(name, svg)

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
            rect: rect,
            startEpoch: startEpoch,
            epoch: epoch,
            maxValue: maxValue,
            paths: paths,
            labels: names.map(name => name.label),
            percent: config.percent,
            start: 0
        }
    }

    Plot() {
        for (let metric of Object.keys(this.plots))
            this.PlotMetric(metric)
    }

    PlotMetric(metric) {
        let plot = this.plots[metric]
        let metrics = this.metrics.metrics[metric]
        let params = this.GetMetricParams(metrics, plot.start)

        let width = plot.svg.clientWidth
        let height = plot.svg.clientHeight

        let left = this.padding
        let right = width - this.padding
        let top = this.topPadding
        let bottom = height - this.padding

        SetAttributes(plot.axes, {d: `M${left} ${top} L${left} ${bottom} L${right} ${bottom}`})
        SetAttributes(plot.startEpoch, {x: left + 2, y: bottom, textContent: plot.start > 0 ? plot.start : ""})
        SetAttributes(plot.epoch, {x: right, y: bottom, textContent: params.epoch > 0 ? params.epoch : ""})
        SetAttributes(plot.maxValue, {x: left + 5, y: top, textContent: params.value > -Infinity ? this.Value2Text(params.value, plot.percent) : ""})

        this.PlotLabels(plot, metrics, params.epoch, left + 5, bottom - 30)
        this.PlotPaths(plot, metrics, params, left, right, top, bottom)
    }

    GetMetricParams(metrics, start = 0) {
        let maxValue = -Infinity
        let maxEpoch = 0

        for (let values of Object.values(metrics)) {
            for (let [epoch, value] of Object.entries(values)) {
                if (epoch >= start) {
                    maxEpoch = Math.max(maxEpoch, epoch)
                    maxValue = Math.max(maxValue, value)
                }
            }
        }

        return {value: maxValue, epoch: maxEpoch}
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

    PlotPaths(plot, metrics, params, left, right, top, bottom) {
        for (let label of plot.labels) {
            let maxValue = params.value == 0 ? 1 : params.value
            let epochs = Math.max(params.epoch, 1) - plot.start
            let values = []

            for (let [epoch, value] of Object.entries(metrics[label])) {
                if (epoch < plot.start)
                    continue

                let x = left + (epoch - plot.start) / epochs * (right - left)
                let y = bottom - value / maxValue * (bottom - top)

                values.push({epoch, value, x, y})
            }

            if (values.length == 0) {
                plot.paths[label].stroke.removeAttribute("d")
                plot.paths[label].fill.removeAttribute("d")
                continue
            }

            let {stroke, fill} = this.GetPathPoints(values, bottom)

            SetAttributes(plot.paths[label].stroke, {d: `${stroke.join(" ")}`})
            SetAttributes(plot.paths[label].fill, {d: `${fill.join(" ")} L${values[values.length - 1].x} ${bottom} z`})
        }
    }

    InitPaths(name, svg) {
        let fill = MakeElement(svg, {fill: name.background, "stroke-width": 1}, "path")
        let stroke = MakeElement(svg, {stroke: name.color, fill: "none", "stroke-width": 1.5}, "path")
        return {title: name.title, fill: fill, stroke: stroke}
    }

    GetPathPoints(values, bottom) {
        let stroke = []
        let fill = []
        let prev = null

        values.sort((a, b) => a.epoch - b.epoch)

        for (let value of values) {
            if (!prev || value.epoch - prev.epoch != 1) {
                stroke.push(`M${value.x} ${value.y} m -1, 0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0`)

                if (prev)
                    fill.push(`L${prev.x} ${bottom}`)

                fill.push(`M${value.x} ${bottom} L${value.x} ${value.y}`)
            }
            else {
                stroke.push(`L${value.x} ${value.y} m -1, 0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0`)
                fill.push(`L${value.x} ${value.y}`)
            }

            prev = value
        }

        return {stroke, fill}
    }

    Value2Text(value, percent) {
        return percent ? `${Round(value * 100, 100)}%` : `${Round(value, 10000)}`
    }

    MetricClick(metric, x) {
        let maxEpoch = this.GetMetricParams(this.metrics.metrics[metric]).epoch
        let plot = this.plots[metric]

        let left = this.padding
        let right = plot.svg.clientWidth - this.padding

        if (plot.start > 0 || maxEpoch < 5) {
            plot.start = 0
        }
        else {
            x = Math.min(Math.max(x, left), right)
            plot.start = Math.round((x - left) / (right - left) * maxEpoch)
        }

        this.PlotMetric(metric)
    }

    MetricWheel(metric, e) {
        e.preventDefault()

        let maxEpoch = this.GetMetricParams(this.metrics.metrics[metric]).epoch
        let plot = this.plots[metric]
        let step = Math.sign(e.deltaY) * (e.shiftKey ? 10 : 1)

        plot.start = Math.max(0, Math.min(maxEpoch - 5, plot.start + step))
        this.PlotMetric(metric)
    }
}
