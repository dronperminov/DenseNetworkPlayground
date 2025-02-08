class DataGenerator {
    constructor() {
        this.datasets = {
            "spiral": {generate: this.SpiralPoint},
            "moons": {generate: this.GetMoonsPoint},
            "gaussians": {generate: this.GaussiansPoint}
        }
    }

    Generate(count, config) {
        let labels = new Float32Array(count)
        let inputs = new Float32Array(count * config.dimension)
        let balance = "balance" in config ? config.balance : 0.5
        let error = "error" in config ? config.error : 0

        for (let i = 0; i < count; i++) {
            let label = random.Uniform() < balance ? 1 : -1
            let point = this.datasets[config.dataset].generate(config.params, label)

            if (random.Uniform() < error)
                label = -label

            for (let j = 0; j < config.dimension; j++)
                inputs[i * config.dimension + j] = point[j]

            labels[i] = label
        }

        return new Data(inputs, labels, config.dimension)
    }

    SpiralPoint(params, label) {
        let angle = random.Uniform()
        let r = angle + random.Uniform(-params.delta, params.delta)
        let t = params.h * angle * 2 * Math.PI

        if (label == 1)
            t += Math.PI

        return [r * Math.sin(t), r * Math.cos(t)]
    }

    MoonsPoint = function(params, label) {
        let x0 = label == 1 ? params.x1 : params.x2
        let y0 = label == 1 ? params.y1 : params.y2
        let rx = random.Uniform(params.rx1, params.rx2)
        let ry = random.Uniform(params.ry1, params.ry2)
        let t = random.Uniform(-Math.PI / 2, Math.PI / 2)

        if (label == 1)
            t += Math.PI

        return [x0 + rx * Math.sin(t), y0 + ry * Math.cos(t)]
    }

    GaussiansPoint(params, label) {
        let mean = label == -1 ? params.mean1 : params.mean2
        let cov = label == -1 ? params.cov1 : params.cov2
        return random.MultivariateNormal(mean, cov)
    }
}
