class TestFullyConnectedLayer extends TestPerformance {
    constructor(div) {
        super()
        this.div = div
    }

    Run() {
        let configs = [
            {inputs: 2, outputs: 10, activation: "abs"},
            {inputs: 10, outputs: 10, activation: "abs"},
            {inputs: 10, outputs: 100, activation: "abs"},
            {inputs: 100, outputs: 10, activation: "abs"},
            {inputs: 100, outputs: 1, activation: "abs"}
        ]

        for (let batchSize of [4, 16, 32]) {
            let html = `
                <h2>FullyConnectedLayer test (batch size: ${batchSize})</h2>
                <table>
                    <tr>
                        <th rowspan="2">Параметры слоя</th>
                        <th rowspan="2">Операция</th>
                        <th colspan="3">Прогрев (us)</th>
                        <th colspan="3">Тест (us)</th>
                        <th colspan="3">Общее время (us)</th>
                    </tr>
                    <tr>
                        <th class="main-column">Linear</th><th>Unrolled</th><th>SpeedUp</th>
                        <th class="main-column">Linear</th><th>Unrolled</th><th>SpeedUp</th>
                        <th class="main-column">Linear</th><th>Unrolled</th><th>SpeedUp</th>
                    </tr>
            `

            for (let config of configs)
                html += this.RunTest(config.inputs, config.outputs, config.activation, batchSize, 100, 10000)

            html += "</table>"
            this.div.innerHTML += html
            this.div.clientWidth
        }
    }

    RunTest(inputs, outputs, activation, batchSize, loopsWarmUp = 100, loopsTest = 1000) {
        let layer = new FullyConnectedLayer(inputs, outputs, activation, MAX_BATCH_SIZE)

        let html = `<tr class="main-row"><td rowspan="3"><b>inputs</b>: ${inputs}<br><b>outputs</b>: ${outputs}<br><b>activation</b>: ${activation}</td>`

        html += this.TestForward(layer, batchSize, loopsWarmUp, loopsTest)
        html += "<tr>"
        html += this.TestBackward(layer, batchSize, false, loopsWarmUp, loopsTest)
        html += "<tr>"
        html += this.TestBackward(layer, batchSize, true, loopsWarmUp, loopsTest)

        return html
    }

    TestForward(layer, batchSize, loopsWarmUp, loopsTest) {
        let inputsWarmUp = Random.UniformArrays(layer.inputs * batchSize, loopsWarmUp)
        let inputsTest = Random.UniformArrays(layer.inputs * batchSize, loopsTest)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            layer.Forward(inputsWarmUp[loop], batchSize)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            layer.Forward(inputsTest[loop], batchSize)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            layer.ForwardUnrolled(inputsWarmUp[loop], batchSize)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            layer.ForwardUnrolled(inputsTest[loop], batchSize)

        let t4 = performance.now()

        return this.GetRow("Forward", t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)
    }

    TestBackward(layer, batchSize, withDx, loopsWarmUp, loopsTest) {
        let inputsWarmUp = Random.UniformArrays(layer.inputs * batchSize, loopsWarmUp)
        let inputsTest = Random.UniformArrays(layer.inputs * batchSize, loopsTest)

        let doutsWarmUp = Random.UniformArrays(layer.outputs * batchSize, loopsWarmUp)
        let doutsTest = Random.UniformArrays(layer.outputs * batchSize, loopsTest)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            layer.Backward(doutsWarmUp[loop], inputsWarmUp[loop], batchSize, withDx)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            layer.Backward(doutsTest[loop], inputsTest[loop], batchSize, withDx)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            layer.BackwardUnrolled(doutsWarmUp[loop], inputsWarmUp[loop], batchSize, withDx)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            layer.BackwardUnrolled(doutsTest[loop], inputsTest[loop], batchSize, withDx)

        let t4 = performance.now()

        return this.GetRow(`Backward${withDx ? " (dx)" : ""}`, t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)
    }
}
