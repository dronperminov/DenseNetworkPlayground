class ExTreeTable extends EventEmitter {
    constructor(div, splits, leafs, initialRows = 20) {
        super()

        this.div = div
        this.splits = splits
        this.leafs = leafs
        this.indices = Array.from({length: leafs.length}, (_, i) => i)
        this.selectedIndices = new Set()

        this.initialRows = initialRows
        this.filters = []
        this.label2color = ["#2191fb", "#89dd73", "#dd7373"]

        this.div.addEventListener("scroll", () => this.Scroll())
    }

    Plot() {
        this.table = MakeElement(this.div, {class: "extree-table-table"}, "table")
        this.PlotHeader()
        this.PlotFilters()

        this.lastRenderedIndex = -1
        this.UpdateRenderedRows()
    }

    PlotHeader() {
        let header = MakeElement(this.table, {class: "extree-table-header"}, "tr")

        let number = MakeElement(header, {class: "extree-table-cell extree-table-sortable extree-table-ascending", innerHTML: "№", rowspan: 2}, "th")
        number.addEventListener("click", () => this.SortByColumn(number, index => index))

        let content = MakeElement(header, {class: "extree-table-cell extree-table-sortable", innerHTML: "Содержимое", colspan: Object.keys(this.splits).length}, "th")
        content.addEventListener("click", () => this.SortByColumn(content, index => this.leafs[index].total))

        for (let name of ["train", "test"]) {
            if (!this.splits[name])
                continue

            let cn = MakeElement(header, {class: "extree-table-cell extree-table-sortable", innerHTML: "c<sub>n</sub>(x)"}, "th")
            let hn = MakeElement(header, {class: "extree-table-cell extree-table-sortable", innerHTML: "h<sub>n</sub>(x)"}, "th")
            let diff = MakeElement(header, {class: "extree-table-cell extree-table-sortable", innerHTML: "|c<sub>n</sub>(x) - h<sub>n</sub>(x)|"}, "th")

            cn.addEventListener("click", () => this.SortByColumn(cn, index => this.leafs[index].stats[name].c.mean))
            hn.addEventListener("click", () => this.SortByColumn(hn, index => this.leafs[index].stats[name].h))
            diff.addEventListener("click", () => this.SortByColumn(diff, index => this.leafs[index].stats[name].diff))
        }

        let splitsHeader = MakeElement(this.table, {class: "extree-table-header"}, "tr")
        let name2text = {"train": "обучающие<br>данные", "test": "тестовые<br>данные", "background": "фон"}

        for (let name of ["train", "test", "background"]) {
            if (!this.splits[name])
                continue

            let content = MakeElement(splitsHeader, {class: "extree-table-cell extree-table-sortable", innerHTML: `${name2text[name]}`}, "th")
            content.addEventListener("click", () => this.SortByColumn(content, index => this.leafs[index].splits[name].total))
        }

        if (this.splits.train)
            MakeElement(splitsHeader, {class: "extree-table-cell", innerHTML: "обучающие данные", colspan: 3}, "th")

        if (this.splits.test)
            MakeElement(splitsHeader, {class: "extree-table-cell", innerHTML: "тестовые данные", colspan: 3}, "th")
    }

    PlotFilters() {
        let filters = MakeElement(this.table, {class: "extree-table-filters"}, "tr")
        let filter = MakeElement(filters, {class: "extree-table-cell", innerHTML: "сбросить"}, "td")
        filter.addEventListener("click", () => this.ResetFilters())

        for (let name of ["train", "test", "background"])
            if (this.splits[name])
                this.AddContentFilter(filters, name)

        for (let name of ["train", "test"]) {
            if (!this.splits[name])
                continue

            this.AddCnFilter(filters, name)
            this.AddHnFilter(filters, name)
            this.AddDiffFilter(filters, name)
        }
    }

    AddContentFilter(filters, name) {
        let max = 0
        let min = Infinity

        for (let leaf of this.leafs) {
            min = Math.min(min, leaf.splits[name].total)
            max = Math.max(max, leaf.splits[name].total)
        }

        this.AddFilter(filters, min, max, 1, leaf => leaf.splits[name].total)
    }

    AddCnFilter(filters, name) {
        let min = Infinity
        let max = -Infinity

        for (let leaf of this.leafs) {
            min = Math.min(min, leaf.stats[name].c.mean)
            max = Math.max(max, leaf.stats[name].c.mean)
        }

        this.AddFilter(filters, Round(min - 0.001, 10000), Round(max + 0.001, 10000), 0.001, leaf => leaf.stats[name].c.mean)
    }

    AddHnFilter(filters, name) {
        let min = Infinity
        let max = -Infinity

        for (let leaf of this.leafs) {
            min = Math.min(min, leaf.stats[name].h)
            max = Math.max(max, leaf.stats[name].h)
        }

        this.AddFilter(filters, Round(min - 0.001, 10000), Round(max + 0.001, 10000), 0.001, leaf => leaf.stats[name].h)
    }

    AddDiffFilter(filters, name) {
        let max = -Infinity

        for (let leaf of this.leafs)
            max = Math.max(max, leaf.stats[name].diff)

        this.AddFilter(filters, 0, Round(max + 0.0001, "auto"), 0.0001, leaf => leaf.stats[name].diff)
    }

    AddFilter(filters, min, max, step, condition) {
        let filter = MakeElement(filters, {class: "extree-table-cell extree-table-filter"}, "td")
        let low = MakeElement(filter, {class: "basic-input inline-input", type: "number", min: min, max: max, step: step, value: min}, "input")
        MakeElement(filter, {innerHTML: " ... "}, "span")
        let high = MakeElement(filter, {class: "basic-input inline-input", type: "number", min: min, max: max, step: step, value: max}, "input")

        let lowInput = new NumberInput(low)
        let highInput = new NumberInput(high)

        let check = leaf => {
            let value = condition(leaf)
            return lowInput.GetValue() <= value && value <= highInput.GetValue()
        }

        this.filters.push({
            check: check,
            low: lowInput,
            high: highInput
        })

        lowInput.on("change", () => this.ChangeFilters())
        highInput.on("change", () => this.ChangeFilters())
    }

    PlotRow(index) {
        let leaf = this.leafs[this.indices[index]]

        if (!this.CheckFilters(leaf))
            return false

        let row = MakeElement(this.table, {class: "extree-table-row"}, "tr")
        row.addEventListener("click", () => this.ClickRow(row, this.indices[index]))

        if (this.selectedIndices.has(this.indices[index]))
            row.classList.add("extree-table-row-selected")

        MakeElement(row, {class: "extree-table-cell", innerText: `${this.indices[index] + 1}`}, "td")

        for (let name of ["train", "test", "background"])
            if (this.splits[name])
                MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafContent(leaf, name)}, "td")

        for (let name of ["train", "test"]) {
            if (!this.splits[name])
                continue

            MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafCn(leaf, name)}, "td")
            MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafHn(leaf, name)}, "td")
            MakeElement(row, {class: "extree-table-cell", innerHTML: this.GetLeafDiff(leaf, name)}, "td")
        }

        return true
    }

    UpdateRenderedRows() {
        while (this.table.children.length > 3)
            this.table.lastChild.remove()

        let count = 0

        for (let i = 0; i < this.leafs.length && count < this.initialRows; i++) {
            if (this.PlotRow(i))
                count++

            this.lastRenderedIndex = i
        }
    }

    Scroll() {
        if (this.div.clientHeight + this.div.scrollTop < this.table.clientHeight - 5)
            return

        let count = 0

        for (let i = this.lastRenderedIndex + 1; i < this.leafs.length && count < this.initialRows; i++) {
            if (this.PlotRow(i))
                count++

            this.lastRenderedIndex = i
        }
    }

    SortByColumn(cell, index2value) {
        let descending = this.GetSortDirection(cell)

        this.SortIndices(index2value, descending)
        this.UpdateRenderedRows()
    }

    GetSortDirection(cell) {
        for (let th of this.table.querySelectorAll("th")) {
            if (th != cell) {
                th.classList.remove("extree-table-ascending")
                th.classList.remove("extree-table-descending")
            }
        }

        if (cell.classList.contains("extree-table-ascending") || cell.classList.contains("extree-table-descending")) {
            cell.classList.toggle("extree-table-ascending")
            cell.classList.toggle("extree-table-descending")
        }
        else {
            cell.classList.add("extree-table-ascending")
        }

        return cell.classList.contains("extree-table-descending")
    }

    SortIndices(index2value, descending) {
        for (let k = this.leafs.length >> 1; k > 0; k >>= 1) {
            for (let i = k; i < this.leafs.length; i++) {
                let index = this.indices[i]
                let j = i

                while (j >= k && (descending ^ (index2value(index) < index2value(this.indices[j - k])))) {
                    this.indices[j] = this.indices[j - k]
                    j -= k
                }

                this.indices[j] = index
            }
        }
    }

    CheckFilters(leaf) {
        for (let filter of this.filters)
            if (!filter.check(leaf))
                return false

        return true
    }

    ChangeFilters() {
        this.UpdateRenderedRows()
        this.emit("update-filters", this.leafs.filter(leaf => this.CheckFilters(leaf)))
    }

    ResetFilters() {
        for (let filter of this.filters) {
            filter.low.SetMin()
            filter.high.SetMax()
        }

        this.UpdateRenderedRows()
        this.emit("update-filters", this.leafs)
    }

    GetLeafContent(leaf, name) {
        if (leaf.splits[name].labels.length == 0)
            return "0"

        return `${leaf.splits[name].labels.length} (${this.GetLeafCounts(leaf, name)})`
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

    ClickRow(row, index) {
        row.classList.toggle("extree-table-row-selected")

        let value = row.classList.contains("extree-table-row-selected") ? true : false

        if (value)
            this.selectedIndices.add(index)
        else
            this.selectedIndices.delete(index)

        let noCells = this.selectedIndices.size == 0
        this.emit("click-leaf", this.leafs[index], value, noCells)
    }
}
