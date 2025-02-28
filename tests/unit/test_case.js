class TestCase {
    CheckEqualFloat(message, value, targetValue, eps = 1e-14) {
        let delta = Math.abs(value - targetValue)
        let success = delta < eps
        let status = success ? `OK (delta: ${delta})` : `FAILED (the values differ: ${value} vs ${targetValue}, delta: ${delta})`

        console.log(`%c${message}: ${status}`, success ? "color:green" : "color:red")
    }

    CheckEqualValues(message, values, targetValues, eps = 1e-14) {
        let maxDelta = this.GetMaxDelta(values, targetValues)
        let success = maxDelta < eps
        let status = success ? `OK (delta: ${maxDelta})` : `FAILED (the values differ: ${values} vs ${targetValues}, delta: ${maxDelta})`
        console.log(`%c${message}: ${status}`, success ? "color:green" : "color:red")
    }

    GetMaxDelta(values, targetValues) {
        let maxDelta = 0

        for (let i = 0; i < targetValues.length; i++)
            maxDelta = Math.max(maxDelta, Math.abs(values[i] - targetValues[i]))

        return maxDelta
    }
}
