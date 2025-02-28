class TestFullyConnectedLayer extends TestCase {
    Run() {
        for (let inputs of [1, 2, 3, 4, 5, 6, 7, 8, 10, 13, 39, 131])
            for (let outputs of [1, 2, 3, 4, 5, 6, 7, 8, 10,  13, 39, 131])
                for (let activation of ["abs", "relu"])
                    for (let batchSize of [1, 2, 3, 4, 8, 16, 32])
                        this.RunTest(inputs, outputs, activation, batchSize)
    }

    RunTest(inputs, outputs, activation, batchSize = 32, loops = 100, eps = 1e-14) {
        console.log(`%cTest FullyConnectedLayer unrolled (inputs: ${inputs}, outputs: ${outputs}, activation: ${activation}, batch size: ${batchSize})`, "font-weight: bold")

        let layer = new FullyConnectedLayer(inputs, outputs, activation, MAX_BATCH_SIZE)

        for (let i = 0; i < layer.outputs; i++)
            if (Random.Uniform() < 0.5)
                layer.ToggleNeuron(i)

        let x = Random.UniformArrays(inputs * batchSize, loops)
        let douts = Random.UniformArrays(layer.outputs * batchSize, loops, 0, 0.001)

        let output = new Float64Array(layer.outputs * batchSize)
        let outputUnroll = new Float64Array(layer.outputs * batchSize)

        let db = new Float64Array(layer.outputs)
        let dbUnroll = new Float64Array(layer.outputs)

        let dw = new Float64Array(layer.outputs * layer.inputs)
        let dwUnroll = new Float64Array(layer.outputs * layer.inputs)

        let dx = new Float64Array(layer.inputs * batchSize)
        let dxUnroll = new Float64Array(layer.inputs * batchSize)

        for (let i = 0; i < loops; i++) {
            layer.ForwardUnrolled(x[i], batchSize)
            layer.ZeroGradients()
            layer.BackwardUnrolled(douts[i], x[i], batchSize, true)

            for (let j = 0; j < layer.outputs * batchSize; j++)
                outputUnroll[j] = layer.output[j]

            for (let j = 0; j < layer.outputs; j++)
                dbUnroll[j] = layer.db[j]

            for (let j = 0; j < layer.outputs * layer.inputs; j++)
                dwUnroll[j] = layer.dw[j]

            for (let j = 0; j < layer.inputs * batchSize; j++)
                dxUnroll[j] = layer.dx[j]

            layer.Forward(x[i], batchSize)
            layer.ZeroGradients()
            layer.Backward(douts[i], x[i], batchSize, true)

            for (let j = 0; j < layer.outputs * batchSize; j++)
                output[j] = layer.output[j]

            for (let j = 0; j < layer.outputs; j++)
                db[j] = layer.db[j]

            for (let j = 0; j < layer.outputs * layer.inputs; j++)
                dw[j] = layer.dw[j]

            for (let j = 0; j < layer.inputs * batchSize; j++)
                dx[j] = layer.dx[j]

            let deltaOutput = this.GetMaxDelta(output, outputUnroll)
            let deltaDw = this.GetMaxDelta(dw, dwUnroll)
            let deltaDb = this.GetMaxDelta(db, dbUnroll)
            let deltaDx = this.GetMaxDelta(dx, dxUnroll)

            if (deltaOutput > eps) {
                console.log(`%c  - test output: FAILED (max delta: ${deltaOutput})`, "color:red")
                return
            }

            if (deltaDw > eps) {
                console.log(`%c  - test weight grads: FAILED (max delta: ${deltaDw})`, "color:red")
                return
            }

            if (deltaDb > eps) {
                console.log(`%c  - test bias grads: FAILED (max delta: ${deltaDb})`, "color:red")
                return
            }

            if (deltaDx > eps) {
                console.log(`%c  - test input grads: FAILED (max delta: ${deltaDx})`, "color:red")
                return
            }
        }

        console.log("%c - test unrolled: SUCCESS", "color:green")
    }
}
