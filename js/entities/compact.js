class Compact extends EventEmitter {
    constructor() {
        super()

        this.dimension = null
        this.min = null
        this.max = null
        this.offset = 0
    }

    Initialize(dimension, stats, offset = 0) {
        this.dimension = dimension
        this.min = new Float32Array(dimension)
        this.max = new Float32Array(dimension)
        this.offset = offset

        for (let i = 0; i < dimension; i++) {
            this.min[i] = stats.min[i]
            this.max[i] = stats.max[i]
        }

        this.emit("change")
    }

    IsInitialized() {
        return this.dimension !== null
    }

    Reset() {
        this.dimension = null
        this.min = null
        this.max = null
        this.offset = 0
        this.emit("change")
    }

    SetOffset(offset) {
        this.offset = offset
        this.emit("change")
    }

    GetLimits(axis) {
        let delta = (this.max[axis] - this.min[axis]) * this.offset / 2
        return {min: this.min[axis] - delta, max: this.max[axis] + delta}
    }

    GetData(count) {
        let inputs = new Float32Array(count * this.dimension)
        let outputs = new Float32Array(count)

        let min = new Float32Array(this.dimension)
        let max = new Float32Array(this.dimension)

        for (let i = 0; i < this.dimension; i++) {
            let limits = this.GetLimits(i)
            min[i] = limits.min
            max[i] = limits.max
        }

        for (let i = 0; i < count; i++) {
            let p = random.MultivariateUniform(min, max)

            for (let j = 0; j < this.dimension; j++)
                inputs[i * this.dimension + j] = p[j]

            outputs[i] = 0
        }

        return new Data(inputs, outputs, this.dimension)
    }
}
