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
        this.polygonsG = []

        this.layer = 0
        this.layers = 0

        this.selectedIndices = new Set()

        this.viewBox.on("scale", scale => this.ChangeViewScale(scale))
        this.viewBox.on("change-view", () => this.ChangeView())
    }

    ChangeCells(leafs, cells, layers) {
        this.leafs = leafs
        this.cells = cells
        this.layers = layers
        this.layer = layers - 1

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

    SetLayer(layer) {
        this.layer = layer
        this.UpdateVisibility()
    }

    BuildPolygons() {
        this.g.innerHTML = ""
        this.polygonsG = []
        this.polygons = []

        for (let i = 0; i < this.layers; i++)
            this.polygonsG.push(MakeElement(this.g, null, "g"))

        for (let cell of this.cells) {
            let polygons = []

            for (let i = 0; i < this.layers; i++)
                polygons[i] = MakeElement(this.polygonsG[i], {stroke: "#000000", "stroke-width": 0.2, fill: "transparent"}, "polygon")

            this.polygons.push(polygons)
        }
    }

    Plot() {
        this.ChangeViewScale(this.viewBox.GetScale())
        this.UpdateVisibility()

        for (let i = 0; i < this.polygons.length; i++) {
            for (let j = 0; j < this.layers; j++) {
                let points = this.cells[i][j].map(([x, y]) => `${this.viewBox.XtoScreen(x)},${this.viewBox.YtoScreen(y)}`).join(" ")
                this.polygons[i][j].setAttribute("points", points)
            }
        }

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

            this.polygons[i][this.layers - 1].setAttribute("fill", color)
        }
    }

    UpdateVisibility() {
        if (this.layers < 1)
            return

        for (let i = 0; i < this.layers; i++)
            if (this.layer == -1 || i == this.layer)
                this.polygonsG[i].removeAttribute("visibility")
            else
                this.polygonsG[i].setAttribute("visibility", "hidden")

        for (let i = 0; i < this.polygons.length; i++) {
            let visible = this.selectedIndices.size == 0 || this.selectedIndices.has(i)

            for (let j = 0; j < this.layers; j++) {
                if (visible)
                    this.polygons[i][j].removeAttribute("visibility")
                else
                    this.polygons[i][j].setAttribute("visibility", "hidden")
            }
        }
    }

    ChangeViewScale(scale) {
        for (let polygons of this.polygons)
            for (let polygon of polygons)
                polygon.setAttribute("stroke-width", scale / 5)
    }

    ChangeView() {
        this.Plot()
    }
}
