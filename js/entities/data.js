class Data {
    constructor(inputs, outputs, dimension) {
        this.inputs = inputs
        this.outputs = outputs
        this.dimension = dimension
        this.length = outputs.length
    }

    Append(data) {
        if (this.dimension != data.dimension)
            throw new Error(`The added data dimension (${data.dimension}) does not match the existing dimension (${this.dimension})`)

        this.inputs = this.ConcatArrays(this.inputs, data.inputs)
        this.outputs = this.ConcatArrays(this.outputs, data.outputs)
        this.length += data.length
        return this
    }

    GetMinMaxStatistic() {
        let min = new Float64Array(this.dimension).fill(Infinity)
        let max = new Float64Array(this.dimension).fill(-Infinity)

        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.dimension; j++) {
                let value = this.inputs[i * this.dimension + j]

                min[j] = Math.min(min[j], value)
                max[j] = Math.max(max[j], value)
            }
        }

        return {min, max}
    }

    GetMeanStdStatistic() {
        let mean = new Float64Array(this.dimension).fill(0)
        let std = new Float64Array(this.dimension).fill(0)
        let variance = new Float64Array(this.dimension).fill(0)
        let length = Math.max(this.length, 1)

        for (let i = 0; i < this.length; i++)
            for (let j = 0; j < this.dimension; j++)
                mean[j] += this.inputs[i * this.dimension + j]

        for (let j = 0; j < this.dimension; j++)
            mean[j] /= length

        for (let i = 0; i < this.length; i++)
            for (let j = 0; j < this.dimension; j++)
                variance[j] += Math.pow(this.inputs[i * this.dimension + j] - mean[j], 2)

        for (let j = 0; j < this.dimension; j++) {
            variance[j] /= length
            std[j] = Math.sqrt(variance[j])
        }

        return {mean, std, variance}
    }

    GetLabelsStatistic() {
        let labels = {}

        for (let i = 0; i < this.length; i++) {
            let label = `${this.outputs[i]}`

            if (label in labels)
                labels[label] += 1
            else
                labels[label] = 1
        }

        return labels
    }

    GetStatistic() {
        let {min, max} = this.GetMinMaxStatistic()
        let {mean, std, variance} = this.GetMeanStdStatistic()
        let labels = this.GetLabelsStatistic()
        return {min, max, mean, std, variance, labels}
    }

    ConcatArrays(array1, array2) {
        let array = new Float64Array(array1.length + array2.length)
        array.set(array1)
        array.set(array2, array1.length)
        return array
    }

    ToCSV(header, delimeter = ";") {
        let rows = [header]

        for (let i = 0; i < this.length; i++) {
            let inputs = []

            for (let j = 0; j < this.dimension; j++)
                inputs.push(this.inputs[i * this.dimension + j])

            rows.push([...inputs, this.outputs[i]].join(delimeter))
        }

        return rows
    }

    static FromCSV(header, rows) {
        let dimension = header.length - 1
        let inputs = new Float64Array(rows.length * dimension)
        let outputs = new Float64Array(rows.length)

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < dimension; j++)
                inputs[i * dimension + j] = rows[i][j]

            outputs[i] = rows[i][dimension]
        }

        return new Data(inputs, outputs, dimension)
    }
}
