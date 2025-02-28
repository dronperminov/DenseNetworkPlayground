class TestNetwork extends TestPerformance {
    constructor(div) {
        super()
        this.div = div
    }

    Run() {
        let configs = [
            {
                inputs: 2,
                layers: [
                    {size: 10, activation: ""}
                ]
            },
            {
                inputs: 2,
                layers: [
                    {size: 100, activation: ""}
                ]
            },
            {
                inputs: 2,
                layers: [
                    {size: 10, activation: "abs"},
                    {size: 10, activation: "abs"},
                    {size: 1, activation: ""}
                ]
            },
            {
                inputs: 2,
                layers: [
                    {size: 25, activation: "abs"},
                    {size: 25, activation: "abs"},
                    {size: 25, activation: "abs"},
                    {size: 25, activation: "abs"},
                    {size: 1, activation: ""}
                ]
            },
            {
                inputs: 2,
                layers: [
                    {size: 10, activation: "abs"},
                    {size: 20, activation: "abs"},
                    {size: 40, activation: "abs"},
                    {size: 80, activation: "abs"},
                    {size: 40, activation: "abs"},
                    {size: 20, activation: "abs"},
                    {size: 10, activation: "abs"},
                    {size: 1, activation: ""}
                ]
            }
        ]

        for (let batchSize of [4, 16, 32]) {
            let html = `
                <h2>NeuralNetwork test (batch size: ${batchSize})</h2>
                <table>
                    <tr>
                        <th rowspan="2">Параметры сети</th>
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
                html += this.RunTest(config.inputs, config.layers, batchSize, 100, 1000)

            html += "</table>"
            this.div.innerHTML += html
            this.div.clientWidth
        }
    }

    RunTest(inputs, config, batchSize, loopsWarmUp = 100, loopsTest = 1000) {
        let network = new NeuralNetwork(inputs, MAX_BATCH_SIZE)

        for (let layer of config)
            network.AddLayer(layer)

        let html = `<tr class="main-row"><td rowspan="5"><b>inputs</b>: ${inputs}<br><b>layers</b>: ${config.map(layer => layer.size).join("-")}</td>`

        html += this.TestPredict(network, batchSize, loopsWarmUp, loopsTest)
        html += "<tr>"
        html += this.TestPredict(network, batchSize * 4, loopsWarmUp, loopsTest)
        html += "<tr>"
        html += this.TestForward(network, batchSize, loopsWarmUp, loopsTest)
        html += "<tr>"
        html += this.TestBackward(network, batchSize, loopsWarmUp, loopsTest)
        html += "<tr>"
        html += this.TestTrainOnBatch(network, batchSize, loopsWarmUp, loopsTest)

        return html
    }

    TestPredict(network, size, loopsWarmUp, loopsTest) {
        let inputsWarmUp = Random.UniformArrays(network.inputs * size, loopsWarmUp)
        let inputsTest = Random.UniformArrays(network.inputs * size, loopsTest)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.Predict(inputsWarmUp[loop], size)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.Predict(inputsTest[loop], size)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.PredictUnrolled(inputsWarmUp[loop], size)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.PredictUnrolled(inputsTest[loop], size)

        let t4 = performance.now()

        return this.GetRow(`Predict (size = ${size})`, t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)
    }

    TestForward(network, batchSize, loopsWarmUp, loopsTest) {
        let inputsWarmUp = Random.UniformArrays(network.inputs * batchSize, loopsWarmUp)
        let inputsTest = Random.UniformArrays(network.inputs * batchSize, loopsTest)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.Forward(inputsWarmUp[loop], batchSize)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.Forward(inputsTest[loop], batchSize)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.ForwardUnrolled(inputsWarmUp[loop], batchSize)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.ForwardUnrolled(inputsTest[loop], batchSize)

        let t4 = performance.now()

        return this.GetRow("Forward", t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)
    }

    TestBackward(network, batchSize, loopsWarmUp, loopsTest) {
        let inputsWarmUp = Random.UniformArrays(network.inputs * batchSize, loopsWarmUp)
        let inputsTest = Random.UniformArrays(network.inputs * batchSize, loopsTest)

        let doutsWarmUp = Random.UniformArrays(network.outputs * batchSize, loopsWarmUp)
        let doutsTest = Random.UniformArrays(network.outputs * batchSize, loopsTest)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.Backward(inputsWarmUp[loop], doutsWarmUp[loop], batchSize)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.Backward(inputsTest[loop], doutsTest[loop], batchSize)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.BackwardUnrolled(inputsWarmUp[loop], doutsWarmUp[loop], batchSize)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.BackwardUnrolled(inputsTest[loop], doutsTest[loop], batchSize)

        let t4 = performance.now()

        return this.GetRow("Backward", t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)
    }

    TestTrainOnBatch(network, batchSize, loopsWarmUp, loopsTest) {
        let xWarmUp = Random.UniformArrays(network.inputs * batchSize, loopsWarmUp)
        let xTest = Random.UniformArrays(network.inputs * batchSize, loopsTest)

        let yWarmUp = Random.UniformArrays(network.outputs * batchSize, loopsWarmUp)
        let yTest = Random.UniformArrays(network.outputs * batchSize, loopsTest)

        let criterion = new MSELoss()
        let optimizer = new SGD(0.01)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.TrainOnBatch(xWarmUp[loop], yWarmUp[loop], batchSize, optimizer, criterion)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.TrainOnBatch(xTest[loop], yTest[loop], batchSize, optimizer, criterion)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            network.TrainOnBatchUnrolled(xWarmUp[loop], yWarmUp[loop], batchSize, optimizer, criterion)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            network.TrainOnBatchUnrolled(xTest[loop], yTest[loop], batchSize, optimizer, criterion)

        let t4 = performance.now()

        return this.GetRow("TrainOnBatch", t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)
    }
}
