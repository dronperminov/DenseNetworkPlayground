class TestLoss extends TestCase {
    Run() {
        let input = new Float64Array([1.8886, 0.8443, -0.4153, -1.1099, 3.0217, -0.2078, 0.4149, -0.6675, -0.129, -0.5452, 0.0383, 0.2458, 0.7014, 0.4982, -1.0301])
        let target = new Float64Array([1.217, 2.1569, -0.1898, 0.2762, 0.7444, 0.6646, 0.6972, 0.183, 0.2508, 1.7344, 0.1816, 0.8196, -0.1508, -0.5587, 0.3551])

        let criterions = {
            "MSE": new MSELoss(),
            "MAE": new MAELoss(),
            "Huber": new HuberLoss(),
            "LogCosh": new LogCoshLoss(),
        }

        let runs = [
            {name: "MSE", eval: 20.348976389999997, loss: 1.356598426, grads: new Float64Array([0.08954666666666666, -0.1750133333333333, -0.03006666666666667, -0.18481333333333336, 0.30364, -0.11631999999999999, -0.03764000000000001, -0.1134, -0.050640000000000004, -0.30394666666666664, -0.019106666666666668, -0.07650666666666667, 0.11362666666666667, 0.14092, -0.18469333333333332])},
            {name: "MAE", eval: 14.549099999999997, loss: 0.9699399999999998, grads: new Float64Array([0.06666666666666667, -0.06666666666666667, -0.06666666666666667, -0.06666666666666667, 0.06666666666666667, -0.06666666666666667, -0.06666666666666667, -0.06666666666666667, -0.06666666666666667, -0.06666666666666667, -0.06666666666666667, -0.06666666666666667, 0.06666666666666667, 0.06666666666666667, -0.06666666666666667])},
            {name: "Huber", eval: 8.34084816, loss: 0.556056544, grads: new Float64Array([0.04477333333333333, -0.06666666666666667, -0.015033333333333334, -0.06666666666666667, 0.06666666666666667, -0.058159999999999996, -0.018820000000000003, -0.0567, -0.025320000000000002, -0.06666666666666667, -0.009553333333333334, -0.038253333333333334, 0.056813333333333334, 0.06666666666666667, -0.06666666666666667])},
            {name: "LogCosh", eval: 7.368340576859872, loss: 0.49122270512399147, grads: new Float64Array([0.0390687583652552, -0.05766212061307284, -0.014783595544902021, -0.058820659459024455, 0.0652787712815962, -0.0468394305243633, -0.0183354962655955, -0.0460887060719095, -0.024168917754748397, -0.0652850749369297, -0.00948847381811189, -0.0345429698879834, 0.04614780358814856, 0.05229829972948115, -0.058807357144247674])}
        ]

        for (let run of runs) {
            console.log(`%cTest ${run.name}`, "font-weight: bold")

            this.TestEvaluate(criterions[run.name], input, target, run.eval)
            this.TestBackward(criterions[run.name], input, target, run.loss, run.grads)

            console.log()
        }
    }

    TestEvaluate(criterion, input, target, targetLoss) {
        let loss = criterion.EvaluateUnrolled(input, target, input.length)

        console.log(`- Evaluate test (different input and target)`)
        this.CheckEqualFloat("  - check loss", loss, targetLoss)

        console.log(`- Evaluate test (equal input and target)`)
        loss = criterion.EvaluateUnrolled(target, target, input.length)
        this.CheckEqualFloat("  - check loss", loss, 0)
    }

    TestBackward(criterion, input, target, targetLoss, targetGrads) {
        let loss = criterion.Backward(input, target, input.length)

        console.log(`- Backward test (different input and target)`)
        this.CheckEqualFloat("  - check loss", loss, targetLoss)
        this.CheckEqualValues("  - check grads", criterion.grads, targetGrads)

        loss = criterion.Backward(target, target, input.length)

        console.log(`- Backward test (equal input and target)`)
        this.CheckEqualFloat("  - check loss", loss, 0)
        this.CheckEqualValues("  - check grads", criterion.grads, new Float64Array(input.length).fill(0))
    }
}
