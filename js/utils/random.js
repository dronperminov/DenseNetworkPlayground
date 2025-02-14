class Random {
    Uniform(a = 0, b = 1) {
        return a + Math.random() * (b - a)
    }

    Normal(mean = 0, std = 1) {
        let x = 1 - Math.random()
        let y = Math.random()
        let z = Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y)

        return mean + std * z
    }

    MultivariateUniform(min, max) {
        let p = []

        for (let i = 0; i < min.length; i++)
            p[i] = this.Uniform(min[i], max[i])

        return p
    }

    MultivariateNormal(mean, cov) {
        let a = this.Cholesky(cov)
        let z = []

        for (let i = 0; i < mean.length; i++)
            z[i] = this.Normal(0, 1)

        let values = []

        for (let i = 0; i < mean.length; i++) {
            values[i] = mean[i]

            for (let j = 0; j < mean.length; j++)
                values[i] += a[i][j] * z[j]
        }

        return values
    }

    Cholesky(matrix) {
        let L = []

        for (let i = 0; i < matrix.length; i++)
            L[i] = new Array(matrix.length).fill(0)

        for (let i = 0; i < matrix.length; i++) {
            let diag = matrix[i][i]

            for (let j = 0; j < i; j++)
                diag -= L[i][j] * L[i][j]

            if (diag < 1e-15)
                throw new Error("Unable to make Cholesky decomposition")

            L[i][i] = Math.sqrt(diag)

            for (let j = i + 1; j < matrix.length; j++) {
                L[j][i] = matrix[j][i]

                for (let k = 0; k < i; k++)
                    L[j][i] -= L[i][k] * L[j][k]

                L[j][i] /= L[i][i]
            }
        }

        return L
    }

    Shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1))

            let tmp = array[i]
            array[i] = array[j]
            array[j] = tmp
        }
    }
}
