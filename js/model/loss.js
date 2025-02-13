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
}
