class NeuralNetwork {
    constructor(inputs, maxBatchSize = MAX_BATCH_SIZE) {
        this.inputs = inputs
        this.outputs = inputs
        this.maxBatchSize = maxBatchSize

        this.layers = []
    }

    AddLayer(config) {
        let layer = new FullyConnectedLayer(this.outputs, config.size, config.activation, this.maxBatchSize)

        this.layers.push(layer)
        this.outputs = layer.outputs
    }

    SetActivation(activation) {
        for (let i = 0; i < this.layers.length - 1; i++)
            this.layers[i].SetActivation(activation)
    }

    ZeroGradients() {
        for (let layer of this.layers)
            layer.ZeroGradients()
    }

    ZeroGradientParams() {
        for (let layer of this.layers)
            layer.ZeroGradientParams()
    }

    Predict(x, size) {
        let result = new Float64Array(this.outputs * size)

        for (let i = 0; i < size; i += this.maxBatchSize) {
            let j = Math.min(i + this.maxBatchSize, size)
            let batchSize = j - i

            let data = x.subarray(i * this.inputs, j * this.inputs)
            let output = this.Forward(data, batchSize)

            result.set(output.subarray(0, batchSize * this.outputs), i * this.outputs)
        }

        return result
    }

    Forward(x, batchSize) {
        this.layers[0].Forward(x, batchSize)

        for (let i = 1; i < this.layers.length; i++)
            this.layers[i].Forward(this.layers[i - 1].output, batchSize)

        return this.layers[this.layers.length - 1].output
    }

    Backward(x, dout, batchSize) {
        let last = this.layers.length - 1

        if (last == 0) {
            this.layers[last].Backward(dout, x, batchSize, false)
        }
        else {
            this.layers[last].Backward(dout, this.layers[last - 1].output, batchSize, true)

            for (let i = last - 1; i > 0; i--)
                this.layers[i].Backward(this.layers[i + 1].dx, this.layers[i - 1].output, batchSize, true)

            this.layers[0].Backward(this.layers[1].dx, x, batchSize, false)
        }
    }

    UpdateWeights(optimizer) {
        for (let layer of this.layers)
            layer.UpdateWeights(optimizer)
    }

    TrainOnBatch(x, y, batchSize, optimizer, criterion) {
        let output = this.Forward(x, batchSize)
        let loss = criterion.Backward(output, y, batchSize * this.outputs)

        this.ZeroGradients()
        this.Backward(x, criterion.grads, batchSize)
        this.UpdateWeights(optimizer)
        optimizer.UpdateEpoch()

        return loss
    }

    LoadWeights(weights) {
        for (let i = 0; i < this.layers.length; i++)
            this.layers[i].LoadWeights(weights[i])
    }

    SetInputs(inputs) {
        this.inputs = inputs

        if (this.layers.length > 0)
            this.layers[0].Resize(inputs, this.layers[0].outputs)
    }
}
