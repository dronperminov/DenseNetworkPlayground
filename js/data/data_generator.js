class DataGenerator {
    constructor(dimension) {
        this.dimension = dimension
        this.datasets = {}
    }

    Generate(count, config) {
        let balance = "balance" in config ? config.balance : 0.5
        let error = "error" in config ? config.error : 0

        let errors = new Array(count).fill(false)
        let labels = new Array(count).fill(-1)

        for (let i = 0; i < Math.floor(count * error); i++)
            errors[i] = true

        for (let i = 0; i < Math.floor(count * balance); i++)
            labels[i] = 1

        Random.Shuffle(errors)
        Random.Shuffle(labels)

        let outputs = new Float64Array(count)
        let inputs = new Float64Array(count * this.dimension)

        for (let i = 0; i < count; i++) {
            let label = labels[i]
            let point = this.datasets[config.dataset](config.params, label)

            if (errors[i])
                label = -label

            for (let j = 0; j < this.dimension; j++)
                inputs[i * this.dimension + j] = point[j]

            outputs[i] = label
        }

        return new Data(inputs, outputs, this.dimension)
    }
}
