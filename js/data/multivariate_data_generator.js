class MultivariateGenerator extends DataGenerator {
    constructor(dimension) {
        super(dimension)

        this.datasets["gaussians"] = this.GaussiansPoint

        this.config = [
            {
                name: "gaussians",
                title: "гауссианы",
                params: [
                    [{
                        name: "mean1",
                        title: "μ<sub>1</sub>",
                        type: "vector",
                        dimension: this.dimension
                    }],
                    [{
                        name: "cov1",
                        title: "Σ<sub>1</sub>",
                        type: "matrix",
                        dimension: [this.dimension, this.dimension],
                        value: this.GetCovMatrix(),
                        properties: new Set(["symmetrical", "positive-diagonal"])
                    }],
                    [{
                        name: "mean2",
                        title: "μ<sub>2</sub>",
                        type: "vector",
                        dimension: this.dimension
                    }],
                    [{
                        name: "cov2",
                        title: "Σ<sub>2</sub>",
                        type: "matrix",
                        dimension: [this.dimension, this.dimension],
                        value: this.GetCovMatrix(),
                        properties: new Set(["symmetrical", "positive-diagonal"])
                    }]
                ]
            }
        ]
    }

    GaussiansPoint(params, label) {
        let mean = label == -1 ? params.mean1 : params.mean2
        let cov = label == -1 ? params.cov1 : params.cov2
        return Random.MultivariateNormal(mean, cov)
    }

    GetCovMatrix() {
        let matrix = []

        for (let i = 0; i < this.dimension; i++) {
            matrix[i] = new Array(this.dimension).fill(0)
            matrix[i][i] = 1
        }

        return matrix
    }
}
