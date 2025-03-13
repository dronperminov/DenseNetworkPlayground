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
            this.b[i] = Random.Normal(0, std)
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

    ShiftNeurons(inputMask, outputMask) {
        let inputMap = []
        let outputMap = []

        for (let i = 0; i < inputMask.length; i++)
            if (!inputMask[i])
                inputMap.push(i)

        for (let i = 0; i < outputMask.length; i++)
            if (!outputMask[i])
                outputMap.push(i)

        let inputs = inputMap.length
        let outputs = outputMap.length

        if (inputs == this.inputs && outputs == this.outputs)
            return

        for (let i = 0; i < outputs; i++) {
            let newI = outputMap[i]

            for (let j = 0; j < inputs; j++) {
                let newJ = inputMap[j]

                this.w[i * inputs + j] = this.w[newI * this.inputs + newJ]
                this.dw[i * inputs + j] = this.dw[newI * this.inputs + newJ]
                this.dw1[i * inputs + j] = this.dw1[newI * this.inputs + newJ]
                this.dw2[i * inputs + j] = this.dw2[newI * this.inputs + newJ]
            }

            this.b[i] = this.b[newI]
            this.db[i] = this.db[newI]
            this.db1[i] = this.db1[newI]
            this.db2[i] = this.db2[newI]
            this.disabled[i] = false
        }

        for (let batch = 0; batch < this.maxBatchSize; batch++) {
            for (let i = 0; i < outputs; i++) {
                this.value[batch * outputs + i] = this.value[batch * this.outputs + outputMap[i]]
                this.output[batch * outputs + i] = this.output[batch * this.outputs + outputMap[i]]
                this.df[batch * outputs + i] = this.df[batch * this.outputs + outputMap[i]]
            }

            for (let j = 0; j < inputs; j++)
                this.dx[batch * inputs + j] = this.dx[batch * this.inputs + inputMap[j]]
        }

        this.w = new Float64Array(this.w.buffer, 0, inputs * outputs)
        this.dw = new Float64Array(this.dw.buffer, 0, inputs * outputs)
        this.dw1 = new Float64Array(this.dw1.buffer, 0, inputs * outputs)
        this.dw2 = new Float64Array(this.dw2.buffer, 0, inputs * outputs)

        this.b = new Float64Array(this.b.buffer, 0, outputs)
        this.db = new Float64Array(this.db.buffer, 0, outputs)
        this.db1 = new Float64Array(this.db1.buffer, 0, outputs)
        this.db2 = new Float64Array(this.db2.buffer, 0, outputs)

        this.value = new Float64Array(this.value.buffer, 0, outputs * this.maxBatchSize)
        this.output = new Float64Array(this.output.buffer, 0, outputs * this.maxBatchSize)
        this.df = new Float64Array(this.df.buffer, 0, outputs * this.maxBatchSize)
        this.dx = new Float64Array(this.dx.buffer, 0, inputs * this.maxBatchSize)

        this.disabled.length = outputs
        this.inputs = inputs
        this.outputs = outputs
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

    /* UNROLLED VERSIONS */
    ForwardUnrolled(x, batchSize) {
        const end = (this.outputs >> 2) << 2

        for (let batch = 0; batch < batchSize; batch++) {
            const inputsOffset = batch * this.inputs
            const outputsOffset = batch * this.outputs

            for (let i = 0; i < end; i += 4) {
                const index1 = outputsOffset + i
                const index2 = outputsOffset + i + 1
                const index3 = outputsOffset + i + 2
                const index4 = outputsOffset + i + 3

                let value1 = this.b[i]
                let value2 = this.b[i + 1]
                let value3 = this.b[i + 2]
                let value4 = this.b[i + 3]

                let wOffset = i * this.inputs

                for (let j = 0; j < this.inputs; j++) {
                    const xj = x[inputsOffset + j]
                    const wIdx = wOffset + j

                    value1 += this.w[wIdx] * xj
                    value2 += this.w[wIdx + this.inputs] * xj
                    value3 += this.w[wIdx + this.inputs * 2] * xj
                    value4 += this.w[wIdx + this.inputs * 3] * xj
                }

                if (this.disabled[i])
                    this.output[index1] = this.value[index1] = this.df[index1] = 0
                else
                    this.activate(index1, value1)

                if (this.disabled[i + 1])
                    this.output[index2] = this.value[index2] = this.df[index2] = 0
                else
                    this.activate(index2, value2)

                if (this.disabled[i + 2])
                    this.output[index3] = this.value[index3] = this.df[index3] = 0
                else
                    this.activate(index3, value3)

                if (this.disabled[i + 3])
                    this.output[index4] = this.value[index4] = this.df[index4] = 0
                else
                    this.activate(index4, value4)
            }

            for (let i = end; i < this.outputs; i++) {
                let index = outputsOffset + i

                if (this.disabled[i]) {
                    this.output[index] = this.value[index] = this.df[index] = 0
                }
                else {
                    let value = this.b[i]
                    let wOffset = i * this.inputs

                    for (let j = 0; j < this.inputs; j++)
                        value += this.w[wOffset + j] * x[inputsOffset + j]

                    this.activate(index, value)
                }
            }
        }
    }

    BackwardUnrolled(dout, x, batchSize, needDx) {
        const total = ((batchSize * this.outputs) >> 2) << 2
        const end = (this.outputs >> 2) << 2

        for (let i = 0; i < total; i += 4) {
            this.df[i] *= dout[i]
            this.df[i + 1] *= dout[i + 1]
            this.df[i + 2] *= dout[i + 2]
            this.df[i + 3] *= dout[i + 3]
        }

        for (let i = total; i < batchSize * this.outputs; i++)
            this.df[i] *= dout[i]

        for (let batch = 0; batch < batchSize; batch++) {
            const inputsOffset = batch * this.inputs
            const outputsOffset = batch * this.outputs

            for (let i = 0; i < end; i += 4) {
                const delta1 = this.df[outputsOffset + i]
                const delta2 = this.df[outputsOffset + i + 1]
                const delta3 = this.df[outputsOffset + i + 2]
                const delta4 = this.df[outputsOffset + i + 3]

                const wOffset = i * this.inputs

                for (let j = 0; j < this.inputs; j++) {
                    const xj = x[inputsOffset + j]
                    const wIdx = wOffset + j

                    this.dw[wIdx] += delta1 * xj
                    this.dw[wIdx + this.inputs] += delta2 * xj
                    this.dw[wIdx + this.inputs * 2] += delta3 * xj
                    this.dw[wIdx + this.inputs * 3] += delta4 * xj
                }

                this.db[i] += delta1
                this.db[i + 1] += delta2
                this.db[i + 2] += delta3
                this.db[i + 3] += delta4
            }

            for (let i = end; i < this.outputs; i++) {
                const delta = this.df[outputsOffset + i]
                const wOffset = i * this.inputs

                for (let j = 0; j < this.inputs; j++)
                    this.dw[wOffset + j] += delta * x[inputsOffset + j]

                this.db[i] += delta
            }
        }

        if (!needDx)
            return

        this.dx.fill(0, 0, batchSize * this.inputs)

        for (let batch = 0; batch < batchSize; batch++) {
            const inputsOffset = batch * this.inputs
            const outputsOffset = batch * this.outputs

            for (let i = 0; i < end; i += 4) {
                const delta1 = this.df[outputsOffset + i]
                const delta2 = this.df[outputsOffset + i + 1]
                const delta3 = this.df[outputsOffset + i + 2]
                const delta4 = this.df[outputsOffset + i + 3]
                const wOffset = i * this.inputs

                for (let j = 0; j < this.inputs; j++) {
                    const wIdx = wOffset + j

                    const w1 = this.w[wIdx]
                    const w2 = this.w[wIdx + this.inputs]
                    const w3 = this.w[wIdx + this.inputs * 2]
                    const w4 = this.w[wIdx + this.inputs * 3]

                    this.dx[inputsOffset + j] += w1 * delta1 + w2 * delta2 + w3 * delta3 + w4 * delta4
                }
            }

            for (let i = end; i < this.outputs; i++) {
                const delta = this.df[outputsOffset + i]
                const wOffset = i * this.inputs

                for (let j = 0; j < this.inputs; j++)
                    this.dx[inputsOffset + j] += this.w[wOffset + j] * delta
            }
        }
    }
}
