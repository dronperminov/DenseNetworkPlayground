class ExTreeTable {
    constructor(div, splits, dataPlot, modelPlot, leafs, initialRows = 20) {
        this.div = div
        this.splits = splits
        this.dataPlot = dataPlot
        this.modelPlot = modelPlot
        this.leafs = leafs
        this.masks = {}

        for (let [name, data] of Object.entries(this.splits))
            this.masks[name] = new Array(data.length).fill(false)

        this.initialRows = initialRows
        this.lastRenderedIndex = -1
        this.label2color = ["#2191fb", "#89dd73", "#dd7373"]

        this.div.addEventListener("scroll", () => this.Scroll())
    }

    Plot() {
        this.table = MakeElement(this.div, {class: "extree-table-table"})
        this.PlotHeader()

        for (let i = 0; i < Math.min(this.leafs.length, this.initialRows); i++)
            this.PlotRow(i)
    }

    PlotHeader() {
        let names = ["№", "Содержимое"]

        if (this.splits.train)
            names.push("c<sub>n</sub>(x)<br>train", "h<sub>n</sub>(x)<br>train", "|c<sub>n</sub>(x) - h<sub>n</sub>(x)|<br>train")

        if (this.splits.test)
            names.push("c<sub>n</sub>(x)<br>test", "h<sub>n</sub>(x)<br>test", "|c<sub>n</sub>(x) - h<sub>n</sub>(x)|<br>test")

        let header = MakeElement(this.table, {class: "extree-table-header"})

        for (let name of names)
            MakeElement(header, {class: "extree-table-cell", innerHTML: name})
    }

    PlotRow(index) {
        let leaf = this.leafs[index]

        let row = MakeElement(this.table, {class: "extree-table-row"})
        row.addEventListener("click", () => this.ClickRow(row, leaf, index))

        MakeElement(row, {class: "extree-table-cell", innerText: `${index + 1}`})
        MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafContent(leaf)})

        for (let name of ["train", "test"]) {
            if (!this.splits[name])
                continue

            MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafCn(leaf, name)})
            MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafHn(leaf, name)})
            MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafDiff(leaf, name)})
        }

        this.lastRenderedIndex = index
    }

    Scroll() {
        if (this.div.clientHeight + this.div.scrollTop < this.table.clientHeight - 5)
            return

        for (let count = 0; count < this.initialRows && this.lastRenderedIndex < this.leafs.length - 1; count++)
            this.PlotRow(this.lastRenderedIndex + 1)
    }

    GetLeafContent(leaf) {
        let content  = []

        for (let name of ["train", "test", "background"])
            if (this.splits[name])
                content.push(`${name}: ${leaf.splits[name].labels.length} (${this.GetLeafCounts(leaf, name)})`)

        return content.join("<br>")
    }

    GetLeafCounts(leaf, name) {
        let counts = []
        let split = leaf.splits[name]

        for (let label of [-1, 0, 1]) {
            let count = split.label2count.get(label)

            if (count > 0)
                counts.push(`<span class="extree-circle" style="background: ${this.label2color[label + 1]}"></span>${count == split.total ? "" : " " + count}`)
        }

        return counts.join(" / ")
    }

    GetLeafCn(leaf, name) {
        return `${Round(leaf.stats[name].c.mean, 10000)} ± ${Round(leaf.stats[name].c.std, 10000)}`
    }

    GetLeafHn(leaf, name) {
        return `${Round(leaf.stats[name].h, 10000)}`
    }

    GetLeafDiff(leaf, name) {
        return `${Round(leaf.stats[name].diff, 10000)}`
    }

    ClickRow(row, leaf, leafIndex) {
        row.classList.toggle("extree-table-row-selected")

        let value = row.classList.contains("extree-table-row-selected") ? true : false
        let noMask = this.div.querySelector(".extree-table-row-selected") == null

        for (let [name, data] of Object.entries(this.splits)) {
            for (let index of leaf.splits[name].indices)
                this.masks[name][index] = value

            this.dataPlot.SetMask(name, noMask ? null : this.masks[name])
        }

        this.modelPlot.SetCell(leafIndex, value)
    }
}
