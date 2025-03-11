class DataTable {
    INDEX_ORDER = "no-sort"
    ASCENDING_ORDER = "ascending"
    DESCENDING_ORDER = "descending"
    ORDERS = [this.INDEX_ORDER, this.ASCENDING_ORDER, this.DESCENDING_ORDER]

    constructor(div, initialRows = 25) {
        this.div = div

        this.labels = MakeElement(div, {class: "data-table-labels"})
        this.tabs = MakeElement(div, {class: "data-table-tabs"})
        this.covs = MakeElement(div, {class: "data-table-covs"})
        this.tabs.addEventListener("scroll", () => this.Scroll())

        this.tables = {}
        this.stats2title = {"min": "min", "max": "max", "mean": "μ", "std": "σ", "variance": "σ²"}
        this.initialRows = initialRows
    }

    Add(name, config) {
        let label = MakeElement(this.labels, {class: "data-table-label", innerText: `${config.title}`})
        let tab = MakeElement(this.tabs, {class: "data-table-tab"})
        let cov = MakeElement(this.covs, {class: "data-table-cov"})

        label.addEventListener("click", () => this.SelectTable(name))

        if (Object.keys(this.tables).length > 0) {
            tab.classList.add("data-table-tab-hidden")
            cov.classList.add("data-table-tab-hidden")
        }
        else
            label.classList.add("data-table-label-selected")

        this.tables[name] = {
            title: config.title,
            colors: config.colors,
            tab: tab,
            cov: cov,
            label: label,
            data: null
        }
    }

    SelectTable(name) {
        if (this.tables[name].label.classList.contains("data-table-label-selected"))
            return

        for (let table of Object.values(this.tables)) {
            table.tab.classList.add("data-table-tab-hidden")
            table.cov.classList.add("data-table-tab-hidden")
            table.label.classList.remove("data-table-label-selected")
        }

        this.tables[name].tab.classList.remove("data-table-tab-hidden")
        this.tables[name].cov.classList.remove("data-table-tab-hidden")
        this.tables[name].label.classList.add("data-table-label-selected")
        this.tabs.scroll({top: 0})
    }

    ChangeData(name, split) {
        let table = this.tables[name]

        if (!table)
            return

        table.label.innerText = `${table.title} (${split.data.length})`
        table.data = split.data
        table.stats = split.stats
        table.indices = []
        table.sort = {order: 0, column: -1}
        table.lastRenderedIndex = -1

        for (let i = 0; i < split.data.length; i++)
            table.indices[i] = i

        this.RenderTable(table)
        this.RenderCovariance(table)
    }

    ClearData() {
        for (let table of Object.values(this.tables)) {
            table.label.innerText = table.title
            table.tab.innerHTML = ""
            table.cov.innerHTML = ""
            table.data = null
            table.stats = null
            table.indices = null
            table.lastRenderedIndex = -1
        }
    }

    Scroll() {
        for (let table of Object.values(this.tables)) {
            if (!table.label.classList.contains("data-table-label-selected"))
                continue

            if (this.tabs.clientHeight + this.tabs.scrollTop < table.tab.clientHeight - 5)
                return

            for (let count = 0; count < this.initialRows && table.lastRenderedIndex < table.data.length - 1; count++)
                this.RenderTableRow(table, table.lastRenderedIndex + 1)
        }
    }

    SortByColumn(table, column) {
        table.sort.order = (table.sort.column == column ? table.sort.order + 1 : 1) % this.ORDERS.length
        table.sort.column = column

        for (let k = table.data.length >> 1; k > 0; k >>= 1) {
            for (let i = k; i < table.data.length; i++) {
                let index = table.indices[i]
                let j = i

                while (j >= k && this.CompareRows(table, index, table.indices[j - k], column, this.ORDERS[table.sort.order])) {
                    table.indices[j] = table.indices[j - k]
                    j -= k
                }

                table.indices[j] = index
            }
        }

        this.RenderTable(table)
    }

    CompareRows(table, row1, row2, column, order) {
        if (order === this.INDEX_ORDER)
            return row1 < row2

        let value1 = this.GetColumnValue(table, row1, column)
        let value2 = this.GetColumnValue(table, row2, column)

        if (order === this.ASCENDING_ORDER)
            return value1 < value2

        if (order === this.DESCENDING_ORDER)
            return value1 > value2

        return false
    }

    GetColumnValue(table, row, column) {
        if (column < table.data.dimension)
            return table.data.inputs[row * table.data.dimension + column]

        return table.data.outputs[row]
    }

    RenderTable(table) {
        table.tab.innerHTML = ""

        if (!table.data)
            return

        this.RenderTableHeader(table)
        this.RenderTableStatistics(table)

        for (let i = 0; i < table.data.length && i < Math.max(this.initialRows, table.lastRenderedIndex + 1); i++)
            this.RenderTableRow(table, i)
    }

    RenderCovariance(table) {
        table.cov.innerHTML = ""
        MakeElement(table.cov, {innerText: "Ковариация:"}, "label")

        let matrix = MakeElement(table.cov, {class: "covariance-matrix"}, "table")

        let header = MakeElement(matrix, {class: "covariance-matrix-row"}, "tr")
        MakeElement(header, {class: "covariance-matrix-cell", innerHTML: "cov(x<sub>i</sub>, x<sub>j</sub>)"}, "td")
        for (let j = 0; j < table.data.dimension; j++)
            MakeElement(header, {class: "covariance-matrix-cell", innerHTML: `x<sub>${j + 1}</sub>`}, "td")

        let covariance = table.stats !== null ? table.stats.covariance : table.data.GetCovariance()
        for (let i = 0; i < table.data.dimension; i++) {
            let row = MakeElement(matrix, {class: "covariance-matrix-row"}, "tr")
            MakeElement(row, {class: "covariance-matrix-cell", innerHTML: `x<sub>${i + 1}</sub>`}, "td")

            for (let j = 0; j < table.data.dimension; j++)
                MakeElement(row, {class: "covariance-matrix-cell", innerText: Round(covariance[i * table.data.dimension + j], "auto")}, "td")
        }
    }

    RenderTableHeader(table) {
        let header = MakeElement(table.tab, {class: "data-table-tab-header"})

        for (let i = 0; i <= table.data.dimension; i++) {
            let name = i < table.data.dimension ? `x<sub>${i + 1}</sub>` : "label"
            let cell = MakeElement(header, {class: "data-table-tab-cell", innerHTML: name})

            if (i == table.sort.column)
                MakeElement(cell, {class: "data-table-tab-sort-icon", innerHTML: this.GetSortIcon(table.sort.order)})

            cell.addEventListener("click", () => this.SortByColumn(table, i))
        }
    }

    RenderTableStatistics(table) {
        if (!table.stats)
            return

        let statistics = MakeElement(table.tab, {class: "data-table-tab-statistics"})

        for (let i = 0; i <= table.data.dimension; i++) {
            let stats = []

            if (i < table.data.dimension) {
                for (let key of ["min", "max", "mean", "variance"])
                    if (key in table.stats)
                        stats.push(`<b>${this.stats2title[key]}</b>: ${Round(table.stats[key][i], 10000)}`)
            }
            else {
                for (let [key, value] of Object.entries(table.stats.labels))
                    stats.push(`<b style="color: ${table.colors[key]};">${key}</b>: ${value} (${Round(value / table.data.length * 100, 100)}%)`)
            }

            MakeElement(statistics, {class: "data-table-tab-cell", innerHTML: stats.join("<br>")})
        }
    }

    RenderTableRow(table, index) {
        let row = MakeElement(table.tab, {class: "data-table-tab-row"})

        for (let i = 0; i < table.data.dimension; i++)
            MakeElement(row, {class: "data-table-tab-cell", innerHTML: Round(table.data.inputs[table.indices[index] * table.data.dimension + i], 10000)})

        MakeElement(row, {class: "data-table-tab-cell", innerHTML: table.data.outputs[table.indices[index]]})
        table.lastRenderedIndex = index
    }

    GetSortIcon(order) {
        let d = ""

        if (this.ORDERS[order] == this.ASCENDING_ORDER)
            d = "M0 10 L10 10 M0 7 L7 7 M0 4 L4 4 M0 1 L2 1"
        else if (this.ORDERS[order] == this.DESCENDING_ORDER)
            d = "M0 1 L10 1 M0 4 L7 4 M0 7 L4 7 M0 10 L2 10"

        return `<svg viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg"><path d="${d}" stroke="#222222" stroke-width="1.5" /></svg>`
    }
}
