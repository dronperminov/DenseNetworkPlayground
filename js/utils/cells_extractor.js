class CellsExtractor {
    constructor(model, eps = 1e-10) {
        this.model = model
        this.eps = eps
    }

    Extract(leafs, limits, axisX = 0, axisY = 1) {
        let cells = []

        for (let leaf of leafs) {
            let inequalities = this.GetLinesBySigns(leaf.signs, axisX, axisY)

            inequalities.push([1, 0, -limits.xmin, 1])
            inequalities.push([1, 0, -limits.xmax, -1])
            inequalities.push([0, 1, -limits.ymin, 1])
            inequalities.push([0, 1, -limits.ymax, -1])

            let points = this.GetIntersections(inequalities)
            let convex = this.ComputeConvexCell(points, inequalities)
            cells.push(convex)
        }

        return cells
    }

    GetLinesBySigns(signs, axisX, axisY) {
        let lines = []
        let layer2lines = [[]]
        let neuron = 0

        let layer = this.model.layers[0]
        for (let i = 0; i < layer.outputs; i++) {
            let line = [layer.w[i * layer.inputs + axisX], layer.w[i * layer.inputs + axisY], layer.b[i], signs[neuron++]]

            layer2lines[0].push(line)
            lines.push(line)
        }

        for (let index = 1; index < this.model.layers.length; index++) {
            layer = this.model.layers[index]
            layer2lines[index] = []

            for (let i = 0; i < layer.outputs; i++) {
                let line = [0, 0, layer.b[i], signs[neuron++]]

                for (let j = 0; j < layer.inputs; j++) {
                    let sign = layer2lines[index - 1][j][3]
                    let activation = 1

                    if (this.model.layers[index - 1].activation == "abs")
                        activation = sign >= 0 ? 1 : -1
                    else if (this.model.layers[index - 1].activation == "relu")
                        activation = sign >= 0 ? 1 : 0
                    else if (this.model.layers[index - 1].activation == "leaky-relu")
                        activation = sign >= 0 ? 1 : 0.01

                    line[0] += layer.w[i * layer.inputs + j] * layer2lines[index - 1][j][0] * activation
                    line[1] += layer.w[i * layer.inputs + j] * layer2lines[index - 1][j][1] * activation
                    line[2] += layer.w[i * layer.inputs + j] * layer2lines[index - 1][j][2] * activation
                }

                layer2lines[index].push(line)
                lines.push(line)
            }
        }

        return lines
    }

    ComputeConvexCell(points, inequalities) {
        let convex = []

        for (let point of points)
            if (this.IsCorrectPoint(point, inequalities))
                convex.push(point)

        if (convex.length < 3)
            return []

        let center = convex.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1]], [0, 0]).map(v => v / convex.length)
        convex.sort((p1, p2) => Math.atan2(p1[1] - center[1], p1[0] - center[0]) - Math.atan2(p2[1] - center[1], p2[0] - center[0]))
        return convex
    }

    GetIntersections(inequalities) {
        let points = []
        let set = new Set()

        for (let i = 0; i < inequalities.length; i++) {
            for (let j = i + 1; j < inequalities.length; j++) {
                let intersection = this.GetIntersection(inequalities[i], inequalities[j])
                if (!intersection)
                    continue

                let key = intersection.join("-")
                if (!set.has(key)) {
                    points.push(intersection)
                    set.add(key)
                }
            }
        }

        return points
    }

    GetIntersection(line1, line2) {
        let [a1, b1, c1, sign1] = line1
        let [a2, b2, c2, sign2] = line2
        let det = a1 * b2 - a2 * b1

        if (Math.abs(det) < this.eps)
            return null

        let x = (b1 * c2 - b2 * c1) / det
        let y = (a2 * c1 - a1 * c2) / det
        return [x, y]
    }

    IsCorrectPoint(point, inequalities) {
        return inequalities.every(([a, b, c, sign]) => sign * (a * point[0] + b * point[1] + c) >= -this.eps)
    }
}
