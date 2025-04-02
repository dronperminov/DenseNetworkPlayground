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

    Split(part = 0.5, shuffle = true) {
        let length1 = Math.round(Math.max(0, Math.min(1, part)) * this.length)
        let length2 = this.length - length1

        let inputs1 = new Float64Array(this.dimension * length1)
        let outputs1 = new Float64Array(length1)
        let data1 = new Data(inputs1, outputs1, this.dimension)

        let inputs2 = new Float64Array(this.dimension * length2)
        let outputs2 = new Float64Array(length2)
        let data2 = new Data(inputs2, outputs2, this.dimension)

        let indices = Array.from({length: this.length}, (_, i) => i)

        if (shuffle)
            Random.Shuffle(indices)

        for (let i = 0; i < length1; i++) {
            for (let j = 0; j < this.dimension; j++)
                data1.inputs[i * this.dimension + j] = this.inputs[indices[i] * this.dimension + j]

            data1.outputs[i] = this.outputs[indices[i]]
        }

        for (let i = 0; i < length2; i++) {
            for (let j = 0; j < this.dimension; j++)
                data2.inputs[i * this.dimension + j] = this.inputs[indices[i + length1] * this.dimension + j]

            data2.outputs[i] = this.outputs[indices[i + length1]]
        }

        return [data1, data2]
    }

    FillNans(maxColumns) {
        for (let i = 0; i < this.length; i++) {
            let indices = Random.SampleIndices(this.dimension, maxColumns)

            for (let index of indices)
                this.inputs[i * this.dimension + index] = NaN
        }
    }

    GetUniqueLabels(sorted = true) {
        let labels = Array.from(new Set(this.outputs))

        if (sorted)
            labels.sort()

        return labels
    }

    GetByLabel(label, targetLabel) {
        let indices = []

        for (let i = 0; i < this.length; i++)
            if (this.outputs[i] == label)
                indices.push(i)

        let inputs = new Float64Array(indices.length * this.dimension)
        let outputs = new Float64Array(indices.length).fill(targetLabel)

        for (let i = 0; i < indices.length; i++)
            for (let j = 0; j < this.dimension; j++)
                inputs[i * this.dimension + j] = this.inputs[indices[i] * this.dimension + j]

        return new Data(inputs, outputs, this.dimension)
    }

    Copy() {
        let inputs = new Float64Array(this.length * this.dimension)
        let outputs = new Float64Array(this.length)

        inputs.set(this.inputs)
        outputs.set(this.outputs)
        return new Data(inputs, outputs, this.dimension)
    }

    Normalize(sub, mul) {
        for (let i = 0; i < this.length; i++)
            for (let j = 0; j < this.dimension; j++)
                this.inputs[i * this.dimension + j] = (this.inputs[i * this.dimension + j] - sub[j]) * mul[j]
    }

    GetMinMaxStatistic() {
        let min = new Float64Array(this.dimension).fill(Infinity)
        let max = new Float64Array(this.dimension).fill(-Infinity)

        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.dimension; j++) {
                let value = this.inputs[i * this.dimension + j]

                if (isNaN(value))
                    continue

                min[j] = Math.min(min[j], value)
                max[j] = Math.max(max[j], value)
            }
        }

        return {min, max}
    }

    GetMeanStatistic() {
        let mean = new Float64Array(this.dimension).fill(0)
        let lengths = new Int32Array(this.dimension).fill(0)

        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.dimension; j++) {
                let value = this.inputs[i * this.dimension + j]

                if (isNaN(value))
                    continue

                mean[j] += value
                lengths[j]++
            }
        }

        for (let i = 0; i < this.dimension; i++)
            mean[i] /= Math.max(lengths[i], 1)

        return mean
    }

    GetMeanStdStatistic() {
        let mean = new Float64Array(this.dimension).fill(0)
        let std = new Float64Array(this.dimension).fill(0)
        let variance = new Float64Array(this.dimension).fill(0)
        let lengths = new Int32Array(this.dimension).fill(0)

        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.dimension; j++) {
                let value = this.inputs[i * this.dimension + j]

                if (isNaN(value))
                    continue

                mean[j] += value
                lengths[j]++
            }
        }

        for (let i = 0; i < this.dimension; i++)
            mean[i] /= Math.max(lengths[i], 1)

        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.dimension; j++) {
                let value = this.inputs[i * this.dimension + j]

                if (!isNaN(value))
                    variance[j] += Math.pow(value - mean[j], 2)
            }
        }

        for (let i = 0; i < this.dimension; i++) {
            variance[i] /= Math.max(lengths[i], 1)
            std[i] = Math.sqrt(variance[i])
        }

        return {mean, std, variance}
    }

    GetNanStatistic() {
        let nans = new Int32Array(this.dimension).fill(0)

        for (let i = 0; i < this.length; i++)
            for (let j = 0; j < this.dimension; j++)
                if (isNaN(this.inputs[i * this.dimension + j]))
                    nans[j]++

        return nans
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
        if (this.length == 0)
            return null

        let {min, max} = this.GetMinMaxStatistic()
        let {mean, std, variance} = this.GetMeanStdStatistic()
        let nans = this.GetNanStatistic()
        let covariance = this.GetCovariance(mean)
        let labels = this.GetLabelsStatistic()
        return {min, max, mean, std, variance, nans, covariance, labels}
    }

    GetCovariance(mean = null) {
        let covariance = new Float64Array(this.dimension * this.dimension)

        if (mean === null)
            mean = this.GetMeanStatistic()

        for (let i = 0; i < this.dimension; i++) {
            for (let j = 0; j < this.dimension; j++) {
                let cov = 0
                let total = 0

                for (let index = 0; index < this.length; index++) {
                    let value1 = this.inputs[index * this.dimension + i]
                    let value2 = this.inputs[index * this.dimension + j]

                    if (!isNaN(value1) && !isNaN(value2)) {
                        cov += value1 * value2
                        total++
                    }
                }

                covariance[i * this.dimension + j] = total > 0 ? cov / total - mean[i] * mean[j] : NaN
            }
        }

        return covariance
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

    static Empty(dimension) {
        return new Data(new Float64Array(0), new Float64Array(0), dimension)
    }
}
