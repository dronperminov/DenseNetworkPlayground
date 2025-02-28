class Compact extends EventEmitter {
    constructor() {
        super()

        this.dimension = null
        this.min = null
        this.max = null
        this.minOffset = null
        this.maxOffset = null
        this.offset = 0
    }

    Initialize(dimension, stats, offset = 0) {
        this.dimension = dimension
        this.min = new Float64Array(dimension)
        this.max = new Float64Array(dimension)
        this.minOffset = new Float64Array(dimension)
        this.maxOffset = new Float64Array(dimension)

        for (let i = 0; i < this.dimension; i++) {
            this.min[i] = stats.min[i]
            this.max[i] = stats.max[i]
        }

        this.SetOffset(offset)
    }

    IsInitialized() {
        return this.dimension !== null
    }

    Reset() {
        this.dimension = null
        this.min = null
        this.max = null
        this.minOffset = null
        this.maxOffset = null
        this.emit("change")
    }

    SetOffset(offset) {
        this.offset = offset

        for (let i = 0; i < this.dimension; i++) {
            let delta = (this.max[i] - this.min[i]) * this.offset / 2

            this.minOffset[i] = this.min[i] - delta
            this.maxOffset[i] = this.max[i] + delta
        }

        this.emit("change")
    }

    GetLimits(axis) {
        return {min: this.minOffset[axis], max: this.maxOffset[axis]}
    }

    GetData(count) {
        let inputs = new Float64Array(count * this.dimension)
        let outputs = new Float64Array(count)

        for (let i = 0; i < count; i++) {
            let p = Random.MultivariateUniform(this.minOffset, this.maxOffset)

            for (let j = 0; j < this.dimension; j++)
                inputs[i * this.dimension + j] = p[j]

            outputs[i] = 0
        }

        return new Data(inputs, outputs, this.dimension)
    }
}
