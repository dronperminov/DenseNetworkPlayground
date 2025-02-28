class TestCase {
    CheckEqualFloat(message, value, targetValue, eps = 1e-14) {
        let delta = Math.abs(value - targetValue)
        let success = delta < eps
        let status = success ? `OK (delta: ${delta})` : `FAILED (the values differ: ${value} vs ${targetValue}, delta: ${delta})`

        console.log(`%c${message}: ${status}`, success ? "color:green" : "color:red")
    }

    CheckEqualValues(message, grads, targetGrads, eps = 1e-14) {
        let maxDelta = 0

        for (let i = 0; i < targetGrads.length; i++)
            maxDelta = Math.max(maxDelta, Math.abs(grads[i] - targetGrads[i]))

        let success = maxDelta < eps
        let status = success ? `OK (delta: ${maxDelta})` : `FAILED (the values differ: ${grads} vs ${targetGrads}, delta: ${maxDelta})`
        console.log(`%c${message}: ${status}`, success ? "color:green" : "color:red")
    }
}
