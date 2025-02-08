class CompactLayer {
    constructor(svg, viewBox, compact) {
        this.svg = svg
        this.viewBox = viewBox
        this.compact = compact

        this.path = MakeElement(svg, {fill: "none", "stroke": "#888888"}, "path")
        this.axes = [0, 1]
    }

    SetAxes(xAxis, yAxis) {
        this.axes[0] = xAxis
        this.axes[1] = yAxis
    }

    ChangeCompact() {
        if (!this.compact.IsInitialized()) {
            this.path.removeAttribute("d")
            return
        }

        let x = this.compact.GetLimits(this.axes[0])
        let x1 = this.viewBox.XtoScreen(x.min)
        let x2 = this.viewBox.XtoScreen(x.max)

        let y = this.compact.GetLimits(this.axes[1])
        let y1 = this.viewBox.YtoScreen(y.min)
        let y2 = this.viewBox.YtoScreen(y.max)

        this.path.setAttribute("d", `M${x1} ${y1} L${x2} ${y1} L${x2} ${y2} L${x1} ${y2} z`)
    }

    GetLimits() {
        if (!this.compact.IsInitialized())
            return null

        let x = this.compact.GetLimits(this.axes[0])
        let y = this.compact.GetLimits(this.axes[1])
        return {xmin: x.min, ymin: y.min, xmax: x.max, ymax: y.max}
    }

    UpdateSizes() {
        let scale = this.viewBox.GetScale()
        this.path.setAttribute("stroke-width", scale)
        this.path.setAttribute("stroke-dasharray", [scale * 5, scale * 5])
    }
}
