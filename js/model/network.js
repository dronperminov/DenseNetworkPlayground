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

    Reset(disabled) {
        for (let layer of this.layers)
            layer.Reset(disabled)
    }

    Predict(x, size, result = null) {
        if (result === null)
            result = new Float64Array(this.outputs * size)

        for (let i = 0; i < size; i += this.maxBatchSize) {
            let j = Math.min(i + this.maxBatchSize, size)
            let batchSize = j - i

            let data = x.subarray(i * this.inputs, j * this.inputs)
            let output = this.Forward(data, batchSize)

            result.set(output.subarray(0, batchSize * this.outputs), i * this.outputs)
        }

        return result
    }

    PredictAt(layer, neuron, x, size, result = null) {
        if (result === null)
            result = new Float64Array(size)

        for (let i = 0; i < size; i += this.maxBatchSize) {
            let end = Math.min(i + this.maxBatchSize, size)
            let batchSize = end - i

            let data = x.subarray(i * this.inputs, end * this.inputs)
            this.Forward(data, batchSize)

            for (let j = 0; j < batchSize; j++)
                result[i + j] = this.layers[layer].value[j * this.layers[layer].outputs + neuron]
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

    GetNeuronsCount() {
        let neurons = 0

        for (let layer of this.layers)
            neurons += layer.outputs

        return neurons
    }

    SetInputs(inputs) {
        if (inputs == this.inputs)
            return

        this.inputs = inputs

        if (this.layers.length > 0)
            this.layers[0].Resize(inputs, this.layers[0].outputs)
    }

    SetLayersSize(size) {
        let inputs = this.inputs

        for (let i = 0; i < this.layers.length - 1; i++) {
            this.layers[i].Resize(inputs, size)
            inputs = size
        }

        this.layers[this.layers.length - 1].Resize(inputs, 1)
    }

    ResizeLayer(layer, size) {
        this.layers[layer].Resize(this.layers[layer].inputs, size)

        if (layer < this.layers.length - 1)
            this.layers[layer + 1].Resize(size, this.layers[layer + 1].outputs)
        else
            this.outputs = size
    }

    InsertLayerAfter(layer, size, activation) {
        let inputs = layer > -1 ? this.layers[layer].outputs : this.inputs
        let newLayer = new FullyConnectedLayer(inputs, size, activation, this.maxBatchSize)

        if (layer < this.layers.length - 1)
            this.layers[layer + 1].Resize(size, this.layers[layer + 1].outputs)

        if (this.layers.length == 1) {
            newLayer.SetActivation("")
            this.layers[0].SetActivation(activation)
        }

        this.layers.splice(layer + 1, 0, newLayer)
    }

    RemoveLayer(layer) {
        if (this.layers.length < 2)
            throw new Error("Unable to remove layer. There is only one layer in the network")

        if (layer == 0) {
            this.layers[layer + 1].Resize(this.layers[layer].inputs, this.layers[layer + 1].outputs)
        }
        else if (layer == this.layers.length - 1) {
            this.outputs = this.layers[layer - 1].outputs
        }
        else {
            this.layers[layer + 1].Resize(this.layers[layer - 1].outputs, this.layers[layer + 1].outputs)
        }

        this.layers.splice(layer, 1)
    }

    RemoveDisabledNeurons() {
        let inputMask = new Array(this.inputs).fill(false)

        for (let layer of this.layers) {
            let outputMask = layer.disabled.slice()
            layer.ShiftNeurons(inputMask, outputMask)
            inputMask = outputMask
        }
    }

    ToggleNeuron(layer, neuron) {
        this.layers[layer].ToggleNeuron(neuron)
    }

    Clone(config) {
        let network = new NeuralNetwork(this.inputs)
        network.FromJSON(this.ToJSON())

        if (config.reset)
            network.Reset()

        return network
    }

    ToJSON() {
        return {
            inputs: this.inputs,
            layers: this.layers.map(layer => layer.ToJSON())
        }
    }

    FromJSON(json) {
        this.ValidateJSON(json)

        this.inputs = json.inputs
        this.outputs = json.inputs
        this.layers = []

        for (let i = 0; i < json.layers.length; i++) {
            this.AddLayer({size: json.layers[i].outputs, activation: json.layers[i].activation})
            this.layers[i].FromJSON(json.layers[i])
        }
    }

    ValidateJSON(json) {
        if (!json.inputs)
            throw new Error("Некорректный формат файла модели. Не указано количество входов")

        if (isNaN(json.inputs) || json.inputs < 1)
            throw new Error("Некорректный формат файла модели. Указано некорректное количество входов")

        if (!json.layers || json.layers.length == 0)
            throw new Error("Некорректный формат файла модели. Отсутствует описание слоёв")

        let outputs = json.inputs

        for (let i = 0; i < json.layers.length; i++) {
            let layer = json.layers[i]

            if (layer.inputs != outputs)
                throw new Error(`Некорректный формат записи слоя ${i + 1}. Ожидаемое количество входов - ${outputs}, а указано ${layer.inputs}`)

            if (!layer.outputs)
                throw new Error(`Некорректный формат записи слоя ${i + 1}. Не указано количество выходов`)

            if (layer.w.length != layer.inputs * layer.outputs)
                throw new Error(`Некорректное описание слоя ${i + 1}. Одидаемое количество весовых коэффициентов w - ${layer.inputs * layer.outputs}, а указано ${layer.w.length}`)

            if (layer.b.length != layer.outputs)
                throw new Error(`Некорректное описание слоя ${i + 1}. Одидаемое количество весовых коэффициентов b - ${layer.outputs}, а указано ${layer.b.length}`)

            if (layer.disabled.length != layer.outputs)
                throw new Error(`Некорректное описание слоя ${i + 1}. Одидаемое количество флагов отключенности - ${layer.outputs}, а указано ${layer.disabled.length}`)

            outputs = layer.outputs
        }
    }

    GetName() {
        let sizes = [this.inputs, ...this.layers.map(layer => layer.outputs)]
        return sizes.join("-")
    }

    /* UNROLLED VERSIONS */
    PredictUnrolled(x, size, result = null) {
        if (result === null)
            result = new Float64Array(this.outputs * size)

        for (let i = 0; i < size; i += this.maxBatchSize) {
            let j = Math.min(i + this.maxBatchSize, size)
            let batchSize = j - i

            let data = x.subarray(i * this.inputs, j * this.inputs)
            let output = this.ForwardUnrolled(data, batchSize)

            result.set(output.subarray(0, batchSize * this.outputs), i * this.outputs)
        }

        return result
    }

    PredictAtUnrolled(layer, neuron, x, size, result = null) {
        if (result === null)
            result = new Float64Array(size)

        for (let i = 0; i < size; i += this.maxBatchSize) {
            let end = Math.min(i + this.maxBatchSize, size)
            let batchSize = end - i

            let data = x.subarray(i * this.inputs, end * this.inputs)
            this.ForwardUnrolled(data, batchSize)

            for (let j = 0; j < batchSize; j++)
                result[i + j] = this.layers[layer].value[j * this.layers[layer].outputs + neuron]
        }

        return result
    }

    PredictWithSignsUnrolled(x, size) {
        let result = new Float64Array(this.outputs * size)
        let signs = new Array(size)
        let neurons = this.GetNeuronsCount()

        for (let i = 0; i < size; i++)
            signs[i] = new Array(neurons)

        for (let i = 0; i < size; i += this.maxBatchSize) {
            let j = Math.min(i + this.maxBatchSize, size)
            let batchSize = j - i

            let data = x.subarray(i * this.inputs, j * this.inputs)
            let output = this.ForwardUnrolled(data, batchSize)

            result.set(output.subarray(0, batchSize * this.outputs), i * this.outputs)

            for (let batch = 0; batch < batchSize; batch++) {
                let neuron = 0

                for (let layer of this.layers)
                    for (let index = 0; index < layer.outputs; index++)
                        signs[i + batch][neuron++] = layer.value[batch * layer.outputs + index] < 0 ? -1 : 1
            }
        }

        return {result, signs}
    }

    ForwardUnrolled(x, batchSize) {
        this.layers[0].ForwardUnrolled(x, batchSize)

        for (let i = 1; i < this.layers.length; i++)
            this.layers[i].ForwardUnrolled(this.layers[i - 1].output, batchSize)

        return this.layers[this.layers.length - 1].output
    }

    BackwardUnrolled(x, dout, batchSize) {
        let last = this.layers.length - 1

        if (last == 0) {
            this.layers[last].BackwardUnrolled(dout, x, batchSize, false)
        }
        else {
            this.layers[last].BackwardUnrolled(dout, this.layers[last - 1].output, batchSize, true)

            for (let i = last - 1; i > 0; i--)
                this.layers[i].BackwardUnrolled(this.layers[i + 1].dx, this.layers[i - 1].output, batchSize, true)

            this.layers[0].BackwardUnrolled(this.layers[1].dx, x, batchSize, false)
        }
    }

    TrainOnBatchUnrolled(x, y, batchSize, optimizer, criterion) {
        let output = this.ForwardUnrolled(x, batchSize)
        let loss = criterion.Backward(output, y, batchSize * this.outputs)

        this.ZeroGradients()
        this.BackwardUnrolled(x, criterion.grads, batchSize)
        this.UpdateWeights(optimizer)
        optimizer.UpdateEpoch()

        return loss
    }
}
