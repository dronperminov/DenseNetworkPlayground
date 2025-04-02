class Optimizer {
    constructor(learningRate, config = null) {
        this.learningRate = learningRate
        this.regularizationType = this.GetParam(config, "regularizationType", "")
        this.lambda = this.GetParam(config, "lambda", 0)
        this.epoch = 1
    }

    SetLearningRate(learningRate) {
        this.learningRate = learningRate
    }

    SetRegularization(lambda) {
        this.lambda = lambda
    }

    SetRegularizationType(regularizationType) {
        this.regularizationType = regularizationType
    }

    UpdateEpoch() {
        this.epoch++
    }

    Reset() {
        this.epoch = 1
    }

    GetGradient(weights, grads, index) {
        let grad = grads[index]

        if (this.regularizationType == "l1")
            grad += this.lambda * Math.sign(weights[index])
        else if (this.regularizationType == "l2")
            grad += this.lambda * weights[index]

        return grad
    }

    GetParam(config, name, defaultValue) {
        if (!config)
            return defaultValue

        return name in config ? config[name] : defaultValue
    }

    GetConfig() {
        return {
            learningRate: this.learningRate,
            regularizationType: this.regularizationType,
            lambda: this.lambda
        }
    }
}

class SGD extends Optimizer {
    name = "SGD"

    Step(weights, grads, params1, params2, index) {
        let grad = this.GetGradient(weights, grads, index)
        weights[index] -= this.learningRate * grad
    }
}

class MomentumSGD extends Optimizer {
    name = "SGDm"

    constructor(learningRate, config = null) {
        super(learningRate, config)

        this.momentum = this.GetParam(config, "momentum", 0.9)
        this.dampening = this.GetParam(config, "dampening", 0.1)
    }

    Step(weights, grads, params1, params2, index) {
        let grad = this.GetGradient(weights, grads, index)

        if (this.epoch == 1)
            params1[index] = grad
        else
            params1[index] = this.momentum * params1[index] + (1 - this.dampening) * grad

        weights[index] -= this.learningRate * params1[index]
    }
}

class Adam extends Optimizer {
    name = "Adam"

    constructor(learningRate, config = null) {
        super(learningRate, config)

        this.beta1 = this.GetParam(config, "beta1", 0.9)
        this.beta2 = this.GetParam(config, "beta2", 0.999)
        this.eps = this.GetParam(config, "eps", 1e-8)

        this.beta1t = 1 - this.beta1
        this.beta2t = 1 - this.beta2
    }

    Step(weights, grads, mt, vt, index) {
        let grad = this.GetGradient(weights, grads, index)

        mt[index] = this.beta1 * mt[index] + (1 - this.beta1) * grad
        vt[index] = this.beta2 * vt[index] + (1 - this.beta2) * grad * grad

        let mtHat = mt[index] / this.beta1t
        let vtHat = vt[index] / this.beta2t

        weights[index] -= this.learningRate * (mtHat / (Math.sqrt(vtHat) + this.eps))
    }

    UpdateEpoch() {
        this.epoch++
        this.beta1t = 1 - Math.pow(this.beta1, this.epoch)
        this.beta2t = 1 - Math.pow(this.beta2, this.epoch)
    }

    Reset() {
        this.epoch = 1
        this.beta1t = 1 - this.beta1
        this.beta2t = 1 - this.beta2
    }
}

class Adamax extends Optimizer {
    name = "Adamax"

    constructor(learningRate, config = null) {
        super(learningRate, config)

        this.beta1 = this.GetParam(config, "beta1", 0.9)
        this.beta2 = this.GetParam(config, "beta2", 0.999)
        this.eps = this.GetParam(config, "eps", 1e-8)

        this.beta1t = 1 - this.beta1
    }

    Step(weights, grads, mt, ut, index) {
        let grad = this.GetGradient(weights, grads, index)

        mt[index] = this.beta1 * mt[index] + (1 - this.beta1) * grad
        ut[index] = Math.max(this.beta2 * ut[index], Math.abs(grad) + this.eps)

        weights[index] -= this.learningRate * mt[index] / (this.beta1t * ut[index])
    }

    UpdateEpoch() {
        this.epoch++
        this.beta1t = 1 - Math.pow(this.beta1, this.epoch)
    }

    Reset() {
        this.epoch = 1
        this.beta1t = 1 - this.beta1
    }
}

class Adadelta extends Optimizer {
    name = "Adadelta"

    constructor(learningRate, config = null) {
        super(learningRate, config)

        this.rho = this.GetParam(config, "rho", 0.9)
        this.eps = this.GetParam(config, "eps", 1e-6)
    }

    Step(weights, grads, vt, ut, index) {
        let grad = this.GetGradient(weights, grads, index)

        vt[index] = this.rho * vt[index] + (1 - this.rho) * grad * grad
        let dx = Math.sqrt((ut[index] + this.eps) / (vt[index] + this.eps)) * grad
        ut[index] = this.rho * ut[index] + (1 - this.rho) * dx * dx

        weights[index] -= this.learningRate * dx
    }
}

class Adagrad extends Optimizer {
    name = "Adagrad"

    constructor(learningRate, config = null) {
        super(learningRate, config)

        this.lrDecay = this.GetParam(config, "lrDecay", 0)
        this.eps = this.GetParam(config, "eps", 1e-10)
    }

    Step(weights, grads, gt, params2, index) {
        let grad = this.GetGradient(weights, grads, index)
        let learningRate = this.learningRate / (1 + (this.epoch - 1) * this.lrDecay)

        gt[index] += grad * grad
        weights[index] -= learningRate * grad / (Math.sqrt(gt[index]) + this.eps)
    }
}

class RMSprop extends Optimizer {
    name = "RMSprop"

    constructor(learningRate, config = null) {
        super(learningRate, config)

        this.alpha = this.GetParam(config, "alpha", 0.99)
        this.centered = this.GetParam(config, "centered", false)
        this.eps = this.GetParam(config, "eps", 1e-8)
    }

    Step(weights, grads, vt, gt, index) {
        let grad = this.GetGradient(weights, grads, index)

        vt[index] = this.alpha * vt[index] + (1 - this.alpha) * grad * grad
        let vtHat = vt[index]

        if (this.centered) {
            gt[index] = this.alpha * gt[index] + (1 - this.alpha) * grad
            vtHat -= gt[index] * gt[index]
        }

        weights[index] -= this.learningRate * grad / (Math.sqrt(vtHat) + this.eps)
    }
}

function GetOptimizer(name, config = null) {
    if (config === null)
        config = {}

    let learningRate = config.learningRate || 0.01

    if (name == "sgd" || name == "SGD")
        return new SGD(learningRate, config)

    if (name == "momentum-sgd" || name == "SGDm")
        return new MomentumSGD(learningRate, config)

    if (name == "adam" || name == "Adam")
        return new Adam(learningRate, config)

    if (name == "adamax" || name == "Adamax")
        return new Adamax(learningRate, config)

    if (name == "adadelta" || name == "Adadelta")
        return new Adadelta(learningRate, config)

    if (name == "adagrad" || name == "Adagrad")
        return new Adagrad(learningRate, config)

    if (name == "rmsprop" || name == "RMSprop")
        return new RMSprop(learningRate, config)

    throw new Error(`Unknown optimizer name "${name}"`)
}
