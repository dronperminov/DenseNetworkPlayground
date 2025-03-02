class ModelManager extends EventEmitter {
    constructor(model) {
        super()

        this.model = model
        this.predictions = {}
    }

    SetInputs(inputs) {
        if (this.model.inputs == inputs)
            return

        this.model.SetInputs(inputs)
        this.emit("change-architecture")
        this.emit("change")
    }

    SetLayersSize(size) {
        this.model.SetLayersSize(size)
        this.emit("change-architecture")
        this.emit("change")
    }

    SetLayersCount(count, size, activation) {
        while (this.model.layers.length < count)
            this.model.InsertLayerAfter(this.model.layers.length - 2, size, activation)

        while (this.model.layers.length > count)
            this.model.RemoveLayer(this.model.layers.length - 2)

        this.emit("change-architecture")
        this.emit("change")
    }

    Reset(disabled) {
        this.model.Reset(disabled)
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

            let loss = this.model.TrainOnBatchUnrolled(x, y, size, optimizer, criterion)
            totalLoss += loss * size
        }

        this.emit("change")
        return totalLoss / data.length
    }

    Predict(name, data) {
        this.predictions[name] = this.model.PredictUnrolled(data.inputs, data.length)
        this.emit("change-prediction", name)
    }

    ClearPredictions() {
        this.predictions = {}
        this.emit("clear-predictions")
    }

    ToggleNeuron(layer, neuron) {
        this.model.ToggleNeuron(layer, neuron)
        this.emit("change")
    }

    SetActivation(activation) {
        this.model.SetActivation(activation)
        this.emit("change")
    }
}
