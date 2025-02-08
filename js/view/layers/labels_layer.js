class LabelsLayer {
    constructor(div, viewBox) {
        this.viewBox = viewBox
        this.bottomLeftLabel = MakeElement(div, {"class": "data-plot-label-lb"}, "span")
        this.topRightLabel = MakeElement(div, {"class": "data-plot-label-rt"}, "span")
    }

    UpdateLabels() {
        let {xmin, xmax, ymin, ymax} = this.viewBox.GetLimits()
        let xScale = this.GetRoundScale(xmin, xmax)
        let yScale = this.GetRoundScale(ymin, ymax)

        this.bottomLeftLabel.innerText =`${Round(xmin, xScale)}, ${Round(ymin, yScale)}`
        this.topRightLabel.innerText =`${Round(xmax, xScale)}, ${Round(ymax, yScale)}`
    }

    GetRoundScale(a, b) {
        let delta = Math.abs(a - b) / 100
        let scale = 100

        while (delta * scale < 1 && scale < 10000000)
            scale *= 10

        return scale
    }
}
