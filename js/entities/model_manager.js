class ModelManager extends EventEmitter {
    constructor(model) {
        super()

        this.model = model
    }

    SetInputs(inputs) {
        if (this.model.inputs == inputs)
            return

        this.model.SetInputs(inputs)
        this.emit("change-architecture")
        this.emit("change")
    }

    Reset() {
        this.model.Reset()
        this.emit("change")
    }

    Train(data, batchSize, optimizer, criterion) {
        let totalLoss = 0

        for (let i = 0; i < data.length; i += batchSize) {
            let start = i
            let end = Math.min((i + batchSize), data.length)
            let size = end - start

            let x = data.inputs.subarray(start * data.dimension, end * data.dimension)
            let y = data.outputs.subarray(start, end)

            let loss = this.model.TrainOnBatch(x, y, size, optimizer, criterion)
            totalLoss += loss * size
        }

        this.emit("change")
        return totalLoss / data.length
    }

    ToggleNeuron(layer, neuron) {
        this.model.ToggleNeuron(layer, neuron)
        this.emit("change")
    }
}
