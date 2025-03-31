class Dataset extends EventEmitter {
    constructor() {
        super()

        this.dimension = null
        this.splits = {}
    }

    SetDimension(dimension) {
        if (this.dimension === dimension)
            return

        this.dimension = dimension
        this.Clear()
        this.emit("change-dimension", dimension)
    }

    SetData(name, data, config = null) {
        if (this.dimension === null)
            throw new Error("The dataset dimension is not set")

        if (data.dimension !== this.dimension)
            throw new Error(`The data dimension (${data.dimension}) does not match the dataset dimension (${this.dimension})`)

        if (config === null)
            config = {withStatistics: true}

        this.splits[name] = {
            data: data,
            stats: config.withStatistics ? data.GetStatistic() : null
        }

        this.emit("change", name, this.splits[name])
    }

    AddData(name, data, config = null) {
        if (name in this.splits)
            data = this.splits[name].data.Append(data)

        this.SetData(name, data, config)
    }

    NormalizeData(target, mode, eps = 1e-8) {
        if (!this.splits[target] || this.splits[target].data.length == 0)
            throw new Error(`There are no data in the ${target} split`)

        let stats = this.splits[target].stats

        if (stats === null)
            stats = this.splits[target].data.GetStatistic()

        let sub = new Float64Array(this.dimension).fill(0)
        let mul = new Float64Array(this.dimension).fill(1)

        for (let i = 0; i < this.dimension; i++) {
            let div = 1

            if (mode == "min-max") {
                sub[i] = stats.min[i]
                div = stats.max[i] - stats.min[i]
            }
            else if (mode == "mean-std") {
                sub[i] = stats.mean[i]
                div = stats.std[i]
            }
            else if (mode == "mean-offset") {
                div = (stats.max[i] - stats.min[i]) * 2
                sub[i] = stats.mean[i] - 0.5 * div
            }

            if (Math.abs(div) < eps)
                div = 1

            mul[i] = 1 / div
        }

        for (let [name, split] of Object.entries(this.splits)) {
            if (!split)
                continue

            split.data.Normalize(sub, mul)
            split.stats = split.data.GetStatistic()
            this.emit("change", name, split)
        }
    }

    Clear() {
        if (Object.keys(this.splits).length === 0)
            return

        this.splits = {}
        this.emit("clear")
    }

    Download() {
        let link = document.createElement("a")
        let header = this.GetHeader()

        for (let [name, split] of Object.entries(this.splits)) {
            if (split.data.length == 0)
                continue

            let rows = split.data.ToCSV(header, ";")
            let csv = new Blob([rows.join("\n")], {type: "text/csv"})
            link.href = URL.createObjectURL(csv)
            link.download = `${name}.csv`
            link.click()
        }
    }

    GetHeader() {
        let header = []

        for (let i = 0; i < this.dimension; i++)
            header.push(`x${i + 1}`)

        header.push("label")
        return header.join(";")
    }
}
