class Loss {
    constructor(reduction = "mean", maxSize = MAX_BATCH_SIZE) {
        this.grads = new Float64Array(maxSize)
        this.loss = 0

        if (reduction === "mean")
            this.reduction = this.MeanReduction
        else if (reduction == "sum")
            this.reduction = this.SumReduction
        else
            throw new Error(`Unknown reduction "${reduction}"`)
    }

    SumReduction(size) {
        return this.loss
    }

    MeanReduction(size) {
        for (let i = 0; i < size; i++)
            this.grads[i] /= size

        this.loss /= size
        return this.loss
    }
}

class MSELoss extends Loss {
    Evaluate(y, t, size) {
        let loss = 0

        for (let i = 0; i < size; i++) {
            let delta = y[i] - t[i]
            loss += delta * delta
        }

        return loss
    }

    Backward(y, t, size) {
        this.loss = 0

        for (let i = 0; i < size; i++) {
            let delta = y[i] - t[i]
            this.grads[i] = 2 * delta
            this.loss += delta * delta
        }

        return this.reduction(size)
    }

    EvaluateUnrolled(y, t, size) {
        let end = (size >> 1) << 1

        let loss1 = 0
        let loss2 = 0

        for (let i = 0; i < end; i += 2) {
            let delta1 = y[i] - t[i]
            let delta2 = y[i + 1] - t[i + 1]

            loss1 += delta1 * delta1
            loss2 += delta2 * delta2
        }

        let loss = loss1 + loss2

        for (let i = end; i < size; i++) {
            let delta = y[i] - t[i]
            loss += delta * delta
        }

        return loss
    }
}

class MAELoss extends Loss {
    Evaluate(y, t, size) {
        let loss = 0

        for (let i = 0; i < size; i++)
            loss += Math.abs(y[i] - t[i])

        return loss
    }

    Backward(y, t, size) {
        this.loss = 0

        for (let i = 0; i < size; i++) {
            let delta = y[i] - t[i]
            this.grads[i] = Math.sign(delta)
            this.loss += Math.abs(delta)
        }

        return this.reduction(size)
    }

    EvaluateUnrolled(y, t, size) {
        let end = (size >> 1) << 1
        let loss1 = 0
        let loss2 = 0

        for (let i = 0; i < end; i += 2) {
            loss1 += Math.abs(y[i] - t[i])
            loss2 += Math.abs(y[i + 1] - t[i + 1])
        }

        let loss = loss1 + loss2

        for (let i = end; i < size; i++)
            loss += Math.abs(y[i] - t[i])

        return loss
    }
}

class HuberLoss extends Loss {
    constructor(delta = 1.0, reduction = "mean", maxBatchSize = MAX_BATCH_SIZE) {
        super(reduction, maxBatchSize)
        this.delta = delta
    }

    Evaluate(y, t, size) {
        let loss = 0

        for (let i = 0; i < size; i++) {
            let delta = y[i] - t[i]

            if (Math.abs(delta) < this.delta)
                loss += 0.5 * delta * delta
            else
                loss += this.delta * (Math.abs(delta) - 0.5 * this.delta)
        }

        return loss
    }

    Backward(y, t, size) {
        this.loss = 0

        for (let i = 0; i < size; i++) {
            let delta = y[i] - t[i]

            if (Math.abs(delta) < this.delta) {
                this.loss += 0.5 * delta * delta
                this.grads[i] = delta
            }
            else {
                this.loss += this.delta * (Math.abs(delta) - 0.5 * this.delta)
                this.grads[i] = this.delta * Math.sign(delta)
            }
        }

        return this.reduction(size)
    }

    EvaluateUnrolled(y, t, size) {
        let end = (size >> 2) << 2
        let loss1 = 0
        let loss2 = 0
        let loss3 = 0
        let loss4 = 0

        for (let i = 0; i < end; i += 4) {
            let delta1 = y[i] - t[i]
            let delta2 = y[i + 1] - t[i + 1]
            let delta3 = y[i + 2] - t[i + 2]
            let delta4 = y[i + 3] - t[i + 3]

            if (Math.abs(delta1) < this.delta)
                loss1 += 0.5 * delta1 * delta1
            else
                loss1 += this.delta * (Math.abs(delta1) - 0.5 * this.delta)

            if (Math.abs(delta2) < this.delta)
                loss2 += 0.5 * delta2 * delta2
            else
                loss2 += this.delta * (Math.abs(delta2) - 0.5 * this.delta)

            if (Math.abs(delta3) < this.delta)
                loss3 += 0.5 * delta3 * delta3
            else
                loss3 += this.delta * (Math.abs(delta3) - 0.5 * this.delta)

            if (Math.abs(delta4) < this.delta)
                loss4 += 0.5 * delta4 * delta4
            else
                loss4 += this.delta * (Math.abs(delta4) - 0.5 * this.delta)
        }

        let loss = loss1 + loss2 + loss3 + loss4

        for (let i = end; i < size; i++) {
            let delta = y[i] - t[i]

            if (Math.abs(delta) < this.delta)
                loss += 0.5 * delta * delta
            else
                loss += this.delta * (Math.abs(delta) - 0.5 * this.delta)
        }

        return loss
    }
}

class LogCoshLoss extends Loss {
    Evaluate(y, t, size) {
        let loss = 0

        for (let i = 0; i < size; i++)
            loss += Math.log(Math.cosh(y[i] - t[i]))

        return loss
    }

    Backward(y, t, size) {
        this.loss = 0

        for (let i = 0; i < size; i++) {
            let delta = y[i] - t[i]
            this.grads[i] = Math.tanh(delta)
            this.loss += Math.log(Math.cosh(delta))
        }

        return this.reduction(size)
    }

    EvaluateUnrolled(y, t, size) {
        let end = (size >> 2) << 2
        let loss1 = 0
        let loss2 = 0
        let loss3 = 0
        let loss4 = 0

        for (let i = 0; i < end; i += 4) {
            loss1 += Math.log(Math.cosh(y[i] - t[i]))
            loss2 += Math.log(Math.cosh(y[i + 1] - t[i + 1]))
            loss3 += Math.log(Math.cosh(y[i + 2] - t[i + 2]))
            loss4 += Math.log(Math.cosh(y[i + 3] - t[i + 3]))
        }

        let loss = loss1 + loss2 + loss3 + loss4

        for (let i = end; i < size; i++)
            loss += Math.log(Math.cosh(y[i] - t[i]))

        return loss
    }
}

function GetLoss(name, reduction = "mean", maxSize = MAX_BATCH_SIZE) {
    if (name == "mse")
        return new MSELoss(reduction, maxSize)

    if (name == "mae")
        return new MAELoss(reduction, maxSize)

    if (name == "huber")
        return new HuberLoss(1.0, reduction, maxSize)

    if (name == "logcosh")
        return new LogCoshLoss(reduction, maxSize)

    throw new Error(`Unknown loss "${name}"`)
}
