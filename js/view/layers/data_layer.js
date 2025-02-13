class DataLayer {
    constructor(svg, viewBox) {
        this.svg = svg
        this.viewBox = viewBox
        this.plots = {}
        this.axes = [0, 1]
    }

    AddPlot(name, config) {
        this.plots[name] = {
            g: MakeElement(this.svg, {visibility: config.visible ? "visible" : "hidden"}, "g"),
            colors: config.colors,
            border: config.border,
            visible: config.visible,
            points: [],
            data: null,
            stats: null,
            mask: null
        }
    }

    Plot() {
        for (let plot of Object.values(this.plots))
            this.PlotPoints(plot)
    }

    ChangeData(name, split) {
        let plot = this.plots[name]

        if (!plot)
            return

        plot.data = split.data
        plot.stats = split.stats !== null ? split.stats : split.data.GetMinMaxStatistic()
        plot.mask = null

        this.PlotPoints(plot)
    }

    ClearPlots() {
        for (let plot of Object.values(this.plots)) {
            plot.g.innerHTML = ""
            plot.points = []
            plot.data = null
            plot.stats = null
            plot.mask = null
        }
    }

    SetAxes(xAxis, yAxis) {
        this.axes[0] = xAxis
        this.axes[1] = yAxis
    }

    SetVisibility(name, visible) {
        if (!this.plots[name])
            throw new Error(`Plot "${name}" does not exists`)

        this.plots[name].visible = visible
        this.plots[name].g.setAttribute("visibility", visible ? "visible" : "hidden")
    }

    SetMask(name, mask) {
        this.plots[name].mask = mask
        this.PlotPoints(this.plots[name])
    }

    GetLimits() {
        let xmin = Infinity
        let ymin = Infinity
        let xmax = -Infinity
        let ymax = -Infinity

        for (let plot of Object.values(this.plots)) {
            if (!plot.visible || !plot.data)
                continue

            xmin = Math.min(xmin, plot.stats.min[this.axes[0]])
            ymin = Math.min(ymin, plot.stats.min[this.axes[1]])
            xmax = Math.max(xmax, plot.stats.max[this.axes[0]])
            ymax = Math.max(ymax, plot.stats.max[this.axes[1]])
        }

        return {xmin, ymin, xmax, ymax}
    }

    UpdateSizes(scale) {
        for (let plot of Object.values(this.plots))
            this.UpdatePlotSizes(plot, scale)
    }

    UpdatePlotSizes(plot, scale) {
        for (let circle of plot.points) {
            circle.setAttribute("r", scale * 3)
            circle.setAttribute("stroke-width", scale)
        }    
    }

    InitPoints(plot) {
        while (plot.points.length > plot.data.length) {
            plot.g.removeChild(plot.g.lastChild)
            plot.points.pop()
        }

        while (plot.points.length < plot.data.length)
            plot.points.push(MakeElement(plot.g, null, "circle"))

        this.UpdatePlotSizes(plot, this.viewBox.GetScale())
    }

    PlotPoints(plot) {
        if (!plot.data)
            return

        this.InitPoints(plot)

        for (let i = 0; i < plot.data.length; i++) {
            let attributes = {
                cx: this.viewBox.XtoScreen(plot.data.inputs[i * plot.data.dimension + this.axes[0]]),
                cy: this.viewBox.YtoScreen(plot.data.inputs[i * plot.data.dimension + this.axes[1]]),
                fill: typeof(plot.colors) === "string" ? plot.colors : plot.colors[plot.data.outputs[i] + 1],
                stroke: plot.border,
                visibility: plot.mask === null || plot.mask[i] ? "" : "hidden"
            }

            SetAttributes(plot.points[i], attributes)
        }
    }
}
