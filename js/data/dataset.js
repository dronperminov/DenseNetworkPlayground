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
