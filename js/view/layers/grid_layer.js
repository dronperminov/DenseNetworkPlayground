class GridLayer {
    constructor(viewBox) {
        this.viewBox = viewBox

        this.g = MakeElement(viewBox.svg, {}, "g")
        this.grid = MakeElement(this.g, {class: "data-plot-grid", "stroke-width": 0.5}, "path")
        this.axes = MakeElement(this.g, {class: "data-plot-axes", "stroke-width": 1}, "path")
        this.pointX = MakeElement(this.g, {class: "data-plot-grid-label-x", textContent: "", "font-size": 10}, "text")
        this.pointY = MakeElement(this.g, {class: "data-plot-grid-label-y", textContent: "", "font-size": 10}, "text")
        this.visible = true
    }

    Plot(limits) {
        let zeroX = this.viewBox.XtoScreen(0)
        let zeroY = this.viewBox.YtoScreen(0)

        let x1 = this.viewBox.XtoScreen(limits.xmin)
        let x2 = this.viewBox.XtoScreen(limits.xmax)

        let y1 = this.viewBox.YtoScreen(limits.ymin)
        let y2 = this.viewBox.YtoScreen(limits.ymax)

        let step = this.GetGridStep(limits)
        let grid = []

        for (let i = Math.round(limits.xmin / step); i <= limits.xmax / step; i++)
            if (i != 0)
                grid.push(`M${this.viewBox.XtoScreen(i * step)} ${y1} V${y2}`)

        for (let i = Math.round(limits.ymin / step); i <= limits.ymax / step; i++)
            if (i != 0)
                grid.push(`M${x1} ${this.viewBox.YtoScreen(i * step)} H${x2}`)

        this.axes.setAttribute("d", `M${zeroX} ${y1} V${y2} M${x1} ${zeroY} H${x2}`)
        this.grid.setAttribute("d", grid.join(" "))

        SetAttributes(this.pointX, {x: this.viewBox.XtoScreen(step), y: this.viewBox.YtoScreen(-step / 20), textContent: step})
        SetAttributes(this.pointY, {x: this.viewBox.XtoScreen(step / 20), y: this.viewBox.YtoScreen(step), textContent: step})
    }

    SetVisibility(visible) {
        this.visible = visible
        this.g.setAttribute("visibility", visible ? "" : "hidden")
    }

    UpdateSizes(scale) {
        this.axes.setAttribute("stroke-width", scale)
        this.grid.setAttribute("stroke-width", scale / 2)
        this.pointX.setAttribute("font-size", scale * 10)
        this.pointY.setAttribute("font-size", scale * 10)
    }

    GetGridStep(limits, ticks = 8) {
        let delta = Math.max(limits.xmax - limits.xmin, limits.ymax - limits.ymin)
        let min = delta / ticks
        let step = Math.pow(10, Math.floor(Math.log10(min)))
        let residual = min / step
    
        if (residual > 5)
            return step * 10

        if (residual > 2)
            return step * 5

        if (residual > 1)
            return step * 2

        return step
    }
}
