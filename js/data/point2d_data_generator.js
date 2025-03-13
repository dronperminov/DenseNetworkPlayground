class Point2DGenerator extends DataGenerator {
    constructor() {
        super(2)

        this.datasets["spiral"] = this.SpiralPoint
        this.datasets["circle"] = this.CirclePoint
        this.datasets["moons"] = this.MoonsPoint
        this.datasets["cross"] = this.CrossPoint
        this.datasets["gaussians"] = this.GaussiansPoint

        this.config = [
            {
                name: "spiral",
                title: "спираль",
                params: [
                    [
                        {name: "h", title: "Шаг", step: 0.01, min: 0.01, value: 1.25},
                        {name: "delta", title: "Ширина", step: 0.01, min: 0, value: 0.1}
                    ]
                ]
            },
            {
                name: "circle",
                title: "окружность",
                params: [
                    [
                        {name: "r1", title: "R<sub>1</sub>", step: 0.01, min: 0.01, value: 0.4},
                        {name: "r2", title: "R<sub>2</sub>", step: 0.01, min: 0.01, value: 0.9},
                        {name: "rd", title: "R<sub>d</sub>", step: 0.01, min: 0.01, value: 0.6}
                    ]
                ]
            },
            {
                name: "moons",
                title: "moons",
                params: [
                    [
                        {name: "x1", title: "x<sub>1</sub>", step: 0.01, value: -0.15},
                        {name: "y1", title: "y<sub>1</sub>", step: 0.01, value: 0.3},
                        {name: "x2", title: "x<sub>2</sub>", step: 0.01, value: 0.15},
                        {name: "y2", title: "y<sub>2</sub>", step: 0.01, value: -0.3}
                    ],
                    [
                        {name: "rx1", title: "R<sub>x<sub>min</sub></sub>", step: 0.01, min: 0, value: 0.4},
                        {name: "rx2", title: "R<sub>x<sub>max</sub></sub>", step: 0.01, min: 0, value: 0.5},
                        {name: "ry1", title: "R<sub>y<sub>min</sub></sub>", step: 0.01, min: 0, value: 0.9},
                        {name: "ry2", title: "R<sub>y<sub>max</sub></sub>", step: 0.01, min: 0, value: 1.2},
                    ]
                ]
            },
            {
                name: "cross",
                title: "cross",
                params: [
                    [
                        {name: "dx", title: "d<sub>x</sub>", step: 0.01, min: 0.01, value: 1},
                        {name: "dy", title: "d<sub>y</sub>", step: 0.01, min: 0.01, value: 1},
                    ]
                ]
            },
            {
                name: "gaussians",
                title: "гауссианы",
                params: [
                    [
                        {name: "meanX1", title: "μ<sub>x<sub>1</sub></sub>", step: 0.01, value: -0.5},
                        {name: "meanY1", title: "μ<sub>y<sub>1</sub></sub>", step: 0.01, value: -0.4}
                    ],
                    [
                        {name: "stdX1", title: "σ²<sub>x<sub>1</sub></sub>", step: 0.01, min: 0, value: 0.1},
                        {name: "stdY1", title: "σ²<sub>y<sub>1</sub></sub>", step: 0.01, min: 0, value: 0.1},
                        {name: "covXY1", title: "cov(x<sub>1</sub>, y<sub>1</sub>)", step: 0.01, value: 0.05}
                    ],
                    [
                        {name: "meanX2", title: "μ<sub>x<sub>1</sub></sub>", step: 0.01, value: 0.4},
                        {name: "meanY2", title: "μ<sub>y<sub>1</sub></sub>", step: 0.01, value: 0}
                    ],
                    [
                        {name: "stdX2", title: "σ²<sub>x<sub>2</sub></sub>", step: 0.01, min: 0, value: 0.08},
                        {name: "stdY2", title: "σ²<sub>y<sub>2</sub></sub>", step: 0.01, min: 0, value: 0.15},
                        {name: "covXY2", title: "cov(x<sub>2</sub>, y<sub>2</sub>)", step: 0.01, value: -0.06}
                    ],
                ]
            }
        ]
    }

    SpiralPoint(params, label) {
        let angle = Random.Uniform()
        let r = angle + Random.Uniform(-params.delta, params.delta)
        let t = params.h * angle * 2 * Math.PI

        if (label == 1)
            t += Math.PI

        return [r * Math.sin(t), r * Math.cos(t)]
    }

    CirclePoint(params, label) {
        let r = label == 1 ? Random.Uniform(params.rd, params.r2) : Math.sqrt(Random.Uniform()) * params.r1
        let t = Random.Uniform(0, 2 * Math.PI)

        return [r * Math.sin(t), r * Math.cos(t)]
    }

    MoonsPoint(params, label) {
        let x0 = label == 1 ? params.x1 : params.x2
        let y0 = label == 1 ? params.y1 : params.y2
        let rx = Random.Uniform(params.rx1, params.rx2)
        let ry = Random.Uniform(params.ry1, params.ry2)
        let t = Random.Uniform(-Math.PI / 2, Math.PI / 2)

        if (label == 1)
            t += Math.PI

        return [x0 + rx * Math.sin(t), y0 + ry * Math.cos(t)]
    }

    CrossPoint(params, label) {
        let x = Random.Uniform(-params.dx, params.dx)
        let y = Random.Uniform(-params.dy, params.dy)

        if ((label == 1) ^ (x * y > 0))
            return [x, y]

        return [x, -y]
    }

    GaussiansPoint(params, label) {
        let mean = label == -1 ? [params.meanX1, params.meanY1] : [params.meanX2, params.meanY2]
        let cov = label == -1 ? [[params.stdX1, params.covXY1], [params.covXY1, params.stdY1]] : [[params.stdX2, params.covXY2], [params.covXY2, params.stdY2]]
        return Random.MultivariateNormal(mean, cov)
    }
}
