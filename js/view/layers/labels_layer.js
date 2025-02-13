class LabelsLayer {
    constructor(div) {
        this.bottomLeftLabel = MakeElement(div, {"class": "data-plot-label-lb"}, "span")
        this.topRightLabel = MakeElement(div, {"class": "data-plot-label-rt"}, "span")
    }

    UpdateLabels(limits) {
        let xScale = this.GetRoundScale(limits.xmin, limits.xmax)
        let yScale = this.GetRoundScale(limits.ymin, limits.ymax)

        this.bottomLeftLabel.innerText =`${Round(limits.xmin, xScale)}, ${Round(limits.ymin, yScale)}`
        this.topRightLabel.innerText =`${Round(limits.xmax, xScale)}, ${Round(limits.ymax, yScale)}`
    }

    GetRoundScale(a, b) {
        let delta = Math.abs(a - b) / 100
        let scale = 100

        while (delta * scale < 1 && scale < 10000000)
            scale *= 10

        return scale
    }
}
