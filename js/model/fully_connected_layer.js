class FullyConnectedLayer {
    constructor(inputs, outputs, activation, maxBatchSize) {
        this.maxBatchSize = maxBatchSize

        this.Init(inputs, outputs)
        this.SetActivation(activation)
    }

    Reset(resetDisabled = true) {
        this.InitWeights()
        this.ZeroGradients()
        this.ZeroGradientParams()

        if (resetDisabled)
            this.disabled.fill(false)
    }

    InitWeights() {
        let std = Math.sqrt(1 / this.inputs)

        for (let i = 0; i < this.w.length; i++)
            this.w[i] = Random.Normal(0, std)

        for (let i = 0; i < this.b.length; i++)
            this.b[i] = 0
    }

    ZeroGradients() {
        this.dw.fill(0)
        this.db.fill(0)
    }

    ZeroGradientParams() {
        this.dw1.fill(0)
        this.dw2.fill(0)
        this.db1.fill(0)
        this.db2.fill(0)
    }

    SetActivation(activation) {
        this.activation = activation

        if (activation == "")
            this.activate = this.ActivateLinear
        else if (activation == "relu")
            this.activate = this.ActivateReLU
        else if (activation == "leaky-relu")
            this.activate = this.ActivateLeakyReLU
        else if (activation == "abs")
            this.activate = this.ActivateAbs
        else
            throw new Error(`Unknown activation function "${activation}"`)
    }

    Forward(x, batchSize) {
        for (let batch = 0; batch < batchSize; batch++) {
            for (let i = 0; i < this.outputs; i++) {
                let index = batch * this.outputs + i

                if (this.disabled[i]) {
                    this.output[index] = 0
                    this.value[index] = 0
                    this.df[index] = 0
                    continue
                }

                let value = this.b[i]

                for (let j = 0; j < this.inputs; j++)
                    value += this.w[i * this.inputs + j] * x[batch * this.inputs + j]

                this.activate(index, value)
            }
        }
    }

    Backward(dout, x, batchSize, needDx) {
        for (let i = 0; i < batchSize * this.outputs; i++)
            this.df[i] *= dout[i]

        for (let batch = 0; batch < batchSize; batch++) {
            for (let i = 0; i < this.outputs; i++) {
                let delta = this.df[batch * this.outputs + i]

                for (let j = 0; j < this.inputs; j++)
                    this.dw[i * this.inputs + j] += delta * x[batch * this.inputs + j]

                this.db[i] += delta
            }
        }

        if (!needDx)
            return

        for (let i = 0; i < batchSize * this.inputs; i++)
            this.dx[i] = 0

        for (let batch = 0; batch < batchSize; batch++)
            for (let i = 0; i < this.outputs; i++)
                for (let j = 0; j < this.inputs; j++)
                    this.dx[batch * this.inputs + j] += this.w[i * this.inputs + j] * this.df[batch * this.outputs + i]
    }

    UpdateWeights(optimizer) {
        for (let i = 0; i < this.outputs * this.inputs; i++)
            optimizer.Step(this.w, this.dw, this.dw1, this.dw2, i)

        for (let i = 0; i < this.outputs; i++)
            optimizer.Step(this.b, this.db, this.db1, this.db2, i)
    }

    Resize(inputs, outputs) {
        let data = {
            inputs: this.inputs,
            outputs: this.outputs,
            disabled: this.disabled,

            w: this.w, dw: this.dw, dw1: this.dw1, dw2: this.dw2,
            b: this.b, db: this.db, db1: this.db1, db2: this.db2,

            output: this.output,
            value: this.value,
            df: this.df,
            dx: this.dx
        }

        this.Init(inputs, outputs)

        for (let i = 0; i < Math.min(data.outputs, this.outputs); i++) {
            for (let j = 0; j < Math.min(data.inputs, this.inputs); j++) {
                this.w[i * this.inputs + j] = data.w[i * data.inputs + j]
                this.dw[i * this.inputs + j] = data.dw[i * data.inputs + j]
                this.dw1[i * this.inputs + j] = data.dw1[i * data.inputs + j]
                this.dw2[i * this.inputs + j] = data.dw2[i * data.inputs + j]
            }

            this.b[i] = data.b[i]
            this.db[i] = data.db[i]
            this.db1[i] = data.db1[i]
            this.db2[i] = data.db2[i]
            this.disabled[i] = data.disabled[i]
        }

        for (let batch = 0; batch < this.maxBatchSize; batch++) {
            for (let i = 0; i < Math.min(data.outputs, this.outputs); i++) {
                this.value[batch * this.outputs + i] = data.value[batch * data.outputs + i]
                this.output[batch * this.outputs + i] = data.output[batch * data.outputs + i]
                this.df[batch * this.outputs + i] = data.df[batch * data.outputs + i]
            }

            for (let i = 0; i < Math.min(data.inputs, this.inputs); i++)
                this.dx[batch * this.inputs + i] = data.dx[batch * data.inputs + i]
        }
    }

    ToggleNeuron(neuron) {
        this.disabled[neuron] = !this.disabled[neuron]
    }

    LoadWeights(config) {
        for (let i = 0; i < this.inputs * this.outputs; i++)
            this.w[i] = config.w[i]

        for (let i = 0; i < this.outputs; i++)
            this.b[i] = config.b[i]
    }

    ToJSON() {
        return {
            inputs: this.inputs,
            outputs: this.outputs,
            disabled: this.disabled.slice(),
            activation: this.activation,
            w: Array.from(this.w),
            b: Array.from(this.b)
        }
    }

    FromJSON(config) {
        this.LoadWeights(config)

        for (let i = 0; i < this.outputs; i++)
            this.disabled[i] = config.disabled[i]
    }

    Init(inputs, outputs) {
        this.inputs = inputs
        this.outputs = outputs

        this.InitArrays(inputs, outputs)
        this.Reset()
    }

    InitArrays(inputs, outputs) {
        this.disabled = new Array(outputs).fill(false)

        this.w = new Float64Array(outputs * inputs)
        this.dw = new Float64Array(outputs * inputs)
        this.dw1 = new Float64Array(outputs * inputs)
        this.dw2 = new Float64Array(outputs * inputs)

        this.b = new Float64Array(outputs)
        this.db = new Float64Array(outputs)
        this.db1 = new Float64Array(outputs)
        this.db2 = new Float64Array(outputs)

        this.value = new Float64Array(outputs * this.maxBatchSize)
        this.output = new Float64Array(outputs * this.maxBatchSize)
        this.df = new Float64Array(outputs * this.maxBatchSize)
        this.dx = new Float64Array(inputs * this.maxBatchSize)
    }

    ActivateLinear(index, value) {
        this.value[index] = value
        this.output[index] = value
        this.df[index] = 1
    }

    ActivateReLU(index, value) {
        this.value[index] = value

        if (value > 0) {
            this.output[index] = value
            this.df[index] = 1
        }
        else {
            this.output[index] = 0
            this.df[index] = 0
        }
    }

    ActivateLeakyReLU(index, value) {
        this.value[index] = value

        if (value > 0) {
            this.output[index] = value
            this.df[index] = 1
        }
        else {
            this.output[index] = 0.01 * value
            this.df[index] = 0.01
        }
    }

    ActivateAbs(index, value) {
        this.value[index] = value
        this.output[index] = Math.abs(value)
        this.df[index] = Math.sign(value)
    }
}
