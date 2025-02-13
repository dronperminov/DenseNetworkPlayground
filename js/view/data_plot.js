class DataPlot {
    constructor(div, compact) {
        let svg = div.querySelector("svg")

        this.viewBox = new ViewBox(svg)
        this.labelsLayer = new LabelsLayer(div)
        this.compactLayer = new CompactLayer(svg, this.viewBox, compact)
        this.dataLayer = new DataLayer(svg, this.viewBox)

        this.viewBox.on("scale", scale => this.ChangeViewScale(scale))
        this.viewBox.on("change-limits", limits => this.ChangeViewLimits(limits))
        this.viewBox.on("change-view", () => this.ChangeView())

        svg.addEventListener("dblclick", e => this.ResetLimits())
        new ResizeObserver(() => this.ResetLimits()).observe(svg)
    }

    AddPlot(name, config) {
        this.dataLayer.AddPlot(name, config)
    }

    SetAxes(xAxis, yAxis) {
        this.dataLayer.SetAxes(xAxis, yAxis)
        this.compactLayer.SetAxes(xAxis, yAxis)
        this.ResetLimits()
    }

    SetVisibility(name, visible) {
        this.dataLayer.SetVisibility(name, visible)
    }

    SetMask(name, mask) {
        this.dataLayer.SetMask(name, mask)
    }

    ResetLimits() {
        let xmin = Infinity
        let ymin = Infinity
        let xmax = -Infinity
        let ymax = -Infinity

        for (let limits of [this.dataLayer.GetLimits(), this.compactLayer.GetLimits()]) {
            if (!limits)
                continue

            xmin = Math.min(xmin, limits.xmin)
            ymin = Math.min(ymin, limits.ymin)
            xmax = Math.max(xmax, limits.xmax)
            ymax = Math.max(ymax, limits.ymax)
        }

        if (xmin !== Infinity)
            this.viewBox.SetLimits(xmin, ymin, xmax - xmin, ymax - ymin, 5)
        else
            this.viewBox.SetLimits(0, 0, 1, 1)
    }

    ChangeData(name, split) {
        this.dataLayer.ChangeData(name, split)
    }

    ClearData() {
        this.dataLayer.ClearPlots()
    }

    ChangeCompact() {
        this.compactLayer.ChangeCompact()
    }

    ChangeViewScale(scale) {
        this.dataLayer.UpdateSizes(scale)
        this.compactLayer.UpdateSizes(scale)
    }

    ChangeViewLimits(limits) {
        this.labelsLayer.UpdateLabels(limits)
    }

    ChangeView() {
        this.dataLayer.Plot()
        this.ChangeCompact()
    }
}
