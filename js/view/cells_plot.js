class CellsPlot {
    constructor(viewBox, thresholds) {
        this.viewBox = viewBox
        this.thresholds = thresholds

        this.mode = "transparent"
        this.opacity = 1

        this.g = MakeElement(viewBox.svg, null, "g")

        this.leafs = []
        this.cells = []
        this.polygons = []
        this.selectedIndices = new Set()

        this.viewBox.on("scale", scale => this.ChangeViewScale(scale))
        this.viewBox.on("change-view", () => this.ChangeView())
    }

    ChangeCells(leafs, cells) {
        this.leafs = leafs
        this.cells = cells
        this.BuildPolygons()
        this.Plot()
    }

    SetColorMode(mode) {
        this.mode = mode
        this.UpdateColors()
    }

    SetLeaf(leaf, selected) {
        let index = this.leafs.indexOf(leaf)

        if (selected)
            this.selectedIndices.add(index)
        else
            this.selectedIndices.delete(index)

        this.UpdateVisibility()
    }

    BuildPolygons() {
        this.g.innerHTML = ""
        this.polygons = []

        for (let cell of this.cells) {
            let polygon = MakeElement(this.g, {stroke: "#000000", "stroke-width": 0.5, fill: "transparent"}, "polygon")
            this.polygons.push(polygon)
        }
    }

    Plot() {
        this.ChangeViewScale(this.viewBox.GetScale())
        this.UpdateVisibility()

        for (let i = 0; i < this.polygons.length; i++)
            this.polygons[i].setAttribute("points", this.cells[i].map(([x, y]) => `${this.viewBox.XtoScreen(x)},${this.viewBox.YtoScreen(y)}`).join(" "))

        this.UpdateColors()
    }

    UpdateColors() {
        if (this.mode == "no") {
            this.g.setAttribute("visibility", "hidden")
            return
        }

        this.g.removeAttribute("visibility")

        for (let i = 0; i < this.polygons.length; i++) {
            let color = "transparent"

            if (this.mode == "colors") {
                let hn = this.leafs[i].stats.train.h
                let [r, g, b] = this.thresholds.GetOutputColor(hn)
                color = `rgba(${r}, ${g}, ${b}, ${this.opacity})`
            }

            this.polygons[i].setAttribute("fill", color)
        }
    }

    UpdateVisibility() {
        for (let i = 0; i < this.polygons.length; i++) {
            if (this.selectedIndices.size == 0 || this.selectedIndices.has(i))
                this.polygons[i].removeAttribute("visibility")
            else
                this.polygons[i].setAttribute("visibility", "hidden")
        }
    }

    ChangeViewScale(scale) {
        for (let polygon of this.polygons)
            polygon.setAttribute("stroke-width", scale / 5)
    }

    ChangeView() {
        this.Plot()
    }
}
