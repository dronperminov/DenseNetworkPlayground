class CellsPlot {
    constructor(viewBox, thresholds, compact, model) {
        this.viewBox = viewBox
        this.thresholds = thresholds
        this.compact = compact
        this.cellsExtractor = new CellsExtractor(model)
        this.axes = [0, 1]

        this.mode = "transparent"
        this.visibility = true

        this.g = MakeElement(viewBox.svg, null, "g")

        this.leafs = []
        this.cells = []
        this.polygons = []
        this.polygonsG = []
        this.layer = null

        this.selectedCells = new Set()

        this.viewBox.on("scale", scale => this.ChangeViewScale(scale))
        this.viewBox.on("change-view", () => this.ChangeView())
        this.viewBox.on("change-limits", () => this.ChangeLimits())
    }

    SetAxes(axisX, axisY) {
        this.axes[0] = axisX
        this.axes[1] = axisY

        this.UpdateCells()
    }

    SetLayer(layer) {
        this.layer = layer
        this.UpdateLayerVisibility()
    }

    SetVisibility(visibility) {
        this.visibility = visibility
        this.UpdateVisibility()
    }

    IsVisible() {
        return this.visibility
    }

    UpdateCells() {
        if (!this.visibility)
            return

        this.cells = this.GetCells()

        this.BuildPolygonGraphics()
        this.BuildPolygons()
        this.Plot()
    }

    SetColorMode(mode) {
        this.mode = mode
        this.UpdateColors()
    }

    SetLeafs(leafs) {
        this.leafs = leafs
        this.UpdateColors()
    }

    SetCell(key, selected) {
        let size = 0
        for (let i = 0; i < this.cellsExtractor.model.layers.length; i++) {
            size += this.cellsExtractor.model.layers[i].outputs

            let cellKey = key.substr(0, size)

            if (selected)
                this.selectedCells.add(cellKey)
            else
                this.selectedCells.delete(cellKey)
        }

        this.UpdatePolygonsVisibility()
    }

    BuildPolygonGraphics() {
        while (this.polygonsG.length > this.cells.length) {
            this.polygons.pop()
            this.polygonsG.pop().remove()
        }

        while (this.polygonsG.length < this.cells.length) {
            this.polygonsG.push(MakeElement(this.g, null, "g"))
            this.polygons.push({})
        }
    }

    BuildPolygons() {
        for (let i = 0; i < this.cells.length; i++) {
            for (let [key, polygon] of Object.entries(this.polygons[i])) {
                if (!this.cells[i][key]) {
                    polygon.remove()
                    delete this.polygons[i][key]
                }
            }

            for (let key of Object.keys(this.cells[i]))
                if (!this.polygons[i][key])
                    this.polygons[i][key] = MakeElement(this.polygonsG[i], {stroke: "#000000", "stroke-width": 0.2, fill: "transparent"}, "polygon")
        }
    }

    Plot() {
        if (this.cells.length == 0)
            return

        this.ChangeViewScale(this.viewBox.GetScale())
        this.UpdateVisibility()
        this.UpdateLayerVisibility()
        this.UpdatePolygonsVisibility()
        this.UpdatePoints()
        this.UpdateColors()
    }

    UpdateColors() {
        let layer = this.cells.length - 1

        for (let key of Object.keys(this.cells[layer]))
            this.polygons[layer][key].setAttribute("fill", this.mode == "colors" ? "#000000" : "transparent")

        if (this.mode != "colors")
            return

        for (let leaf of this.leafs) {
            let [r, g, b] = this.thresholds.GetOutputColor(leaf.stats.train.h)

            if (this.polygons[layer][leaf.key])
                this.polygons[layer][leaf.key].setAttribute("fill", `rgb(${r}, ${g}, ${b})`)
        }
    }

    UpdateVisibility() {
        if (!this.visibility || this.cells.length < 1) {
            this.g.setAttribute("visibility", "hidden")
            return
        }

        this.g.removeAttribute("visibility")
    }

    UpdateLayerVisibility() {
        if (this.layer === null)
            this.layer = this.cells.length - 1

        for (let i = 0; i < this.cells.length; i++) {
            if (this.layer == -1 || i == this.layer)
                this.polygonsG[i].removeAttribute("visibility")
            else
                this.polygonsG[i].setAttribute("visibility", "hidden")
        }
    }

    UpdatePolygonsVisibility() {
        for (let i = 0; i < this.cells.length; i++) {
            for (let [key, polygon] of Object.entries(this.polygons[i])) {
                if (this.selectedCells.size == 0 || this.selectedCells.has(key))
                    polygon.removeAttribute("visibility")
                else
                    polygon.setAttribute("visibility", "hidden")
            }
        }
    }

    UpdatePoints() {
        for (let i = 0; i < this.cells.length; i++)
            for (let [key, polygon] of Object.entries(this.cells[i]))
                this.polygons[i][key].setAttribute("points", polygon.map(([x, y]) => `${this.viewBox.XtoScreen(x)},${this.viewBox.YtoScreen(y)}`).join(" "))
    }

    GetCellsLimits() {
        if (this.compact.IsInitialized()) {
            let x = this.compact.GetLimits(this.axes[0])
            let y = this.compact.GetLimits(this.axes[1])
            return {xmin: x.min, xmax: x.max, ymin: y.min, ymax: y.max}
        }

        return this.viewBox.GetLimits()
    }

    GetCells() {
        let limits = this.GetCellsLimits()
        return this.cellsExtractor.ExtractAll(limits, this.axes[0], this.axes[1])
    }

    ChangeViewScale(scale) {
        for (let polygons of this.polygons)
            for (let polygon of Object.values(polygons))
                polygon.setAttribute("stroke-width", scale / 4)
    }

    ChangeView() {
        this.Plot()
    }

    ChangeLimits() {
        if (!this.compact.IsInitialized())
            this.UpdateCells()
    }
}
