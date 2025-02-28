class TestLoss extends TestPerformance {
    constructor(div) {
        super()
        this.div = div
    }

    Run() {
        let configs = [
            {size: 16, loops: 10000},
            {size: 128, loops: 1000},
            {size: 1000, loops: 1000},
            {size: 10000, loops: 100}
        ]

        let html = `
            <h2>Loss test</h2>
            <table>
                <tr>
                    <th rowspan="2">Размер</th>
                    <th rowspan="2">Функция потерь</th>
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
            html += this.RunTest(config.size, config.loops, config.loops * 9)

        html += "</table>"
        this.div.innerHTML += html
    }

    RunTest(size, loopsWarmUp = 100, loopsTest = 1000) {
        let lossNames = ["mse", "mae", "logcosh", "huber"]

        let html = `<tr class="main-row"><td rowspan="${lossNames.length}">${size}</td>`

        for (let i = 0; i < lossNames.length; i++) {
            if (i > 0)
                html += "<tr>"

            html += this.TestEvaluate(lossNames[i], size, loopsWarmUp, loopsTest)
        }

        return html
    }

    TestEvaluate(name, size, loopsWarmUp, loopsTest) {
        let loss = GetLoss(name)

        let yWarmUp = Random.UniformArrays(size, loopsWarmUp)
        let targetWarmUp = Random.UniformArrays(size, loopsWarmUp)

        let yTest = Random.UniformArrays(size, loopsTest)
        let targetTest = Random.UniformArrays(size, loopsTest)

        let t0 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
            loss.Evaluate(yWarmUp[loop], targetWarmUp[loop], size)

        let t1 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            loss.Evaluate(yTest[loop], targetTest[loop], size)

        let t2 = performance.now()

        for (let loop = 0; loop < loopsWarmUp; loop++)
             loss.EvaluateUnrolled(yWarmUp[loop], targetWarmUp[loop], size)

        let t3 = performance.now()

        for (let loop = 0; loop < loopsTest; loop++) 
            loss.EvaluateUnrolled(yTest[loop], targetTest[loop], size)

        let t4 = performance.now()

        return this.GetRow(name, t0, t1, t2, t3, t4, loopsWarmUp, loopsTest)

    }
}
