class CellsExtractor {
    constructor(model, eps = 1e-10) {
        this.model = model
        this.eps = eps
    }

    Extract(leafs, limits, axisX = 0, axisY = 1) {
        let signsSets = []
        for (let i = 0; i < this.model.layers.length; i++)
            signsSets.push({})

        let bbox = [
            [1, 0, -limits.xmin, 1],
            [1, 0, -limits.xmax, -1],
            [0, 1, -limits.ymin, 1],
            [0, 1, -limits.ymax, -1]
        ]

        let xmin = limits.xmin - this.eps
        let xmax = limits.xmax + this.eps
        let ymin = limits.ymin - this.eps
        let ymax = limits.ymax + this.eps

        let cells = []

        for (let leaf of leafs) {
            let {lines, layer2lines} = this.GetLinesBySigns(leaf.signs, axisX, axisY)

            let inequalities = []
            let convexes = []

            let points = [
                [limits.xmin, limits.ymin],
                [limits.xmin, limits.ymax],
                [limits.xmax, limits.ymax],
                [limits.xmax, limits.ymin]
            ]

            for (let i = 0; i < layer2lines.length; i++) {
                inequalities.push(...layer2lines[i])
                let key = leaf.signs.slice(0, inequalities.length).join("-")

                if (key in signsSets[i]) {
                    convexes.push(signsSets[i][key].convex)
                    points.push(...signsSets[i][key].points)
                }
                else {
                    let layerPoints = this.GetIntersections(inequalities, layer2lines[i], bbox, xmin, ymin, xmax, ymax)
                    points.push(...layerPoints)

                    let convex = this.ComputeConvexCell(points, inequalities)
                    convexes.push(convex)
                    signsSets[i][key] = {convex: convex, points: layerPoints}
                }
            }

            cells.push(convexes)
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

            if (layer.disabled[i])
                line = [0, 0, 0, 0]

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

                if (layer.disabled[i])
                    line = [0, 0, 0, 0]

                layer2lines[index].push(line)
                lines.push(line)
            }
        }

        return {lines, layer2lines}
    }

    ComputeConvexCell(points, inequalities) {
        let convex = points.filter(point => this.IsCorrectPoint(point, inequalities))

        if (convex.length < 3)
            return []

        let cx = 0
        let cy = 0

        for (let [x, y] of convex) {
            cx += x
            cy += y
        }

        cx /= convex.length
        cy /= convex.length

        convex.sort((p1, p2) => Math.atan2(p1[1] - cy, p1[0] - cx) - Math.atan2(p2[1] - cy, p2[0] - cx))
        return convex
    }

    GetIntersections(inequalities, newInequalities, bbox, xmin, ymin, xmax, ymax) {
        let points = []

        for (let i = 0; i < inequalities.length - newInequalities.length; i++)
            for (let j = 0; j < newInequalities.length; j++)
                this.AddIntersection(inequalities[i], newInequalities[j], xmin, ymin, xmax, ymax, points)

        for (let i = 0; i < newInequalities.length; i++) {
            for (let j = i + 1; j < newInequalities.length; j++)
                this.AddIntersection(newInequalities[i], newInequalities[j], xmin, ymin, xmax, ymax, points)

            for (let j = 0; j < bbox.length; j++)
                this.AddIntersection(newInequalities[i], bbox[j], xmin, ymin, xmax, ymax, points)
        }

        return points
    }

    AddIntersection(line1, line2, xmin, ymin, xmax, ymax, points) {
        let [a1, b1, c1] = line1
        let [a2, b2, c2] = line2

        let det = a1 * b2 - a2 * b1

        if (Math.abs(det) < this.eps)
            return

        let x = (b1 * c2 - b2 * c1) / det
        let y = (a2 * c1 - a1 * c2) / det

        if (xmin <= x && x <= xmax && ymin <= y && y <= ymax)
            points.push([x, y])
    }

    IsCorrectPoint(point, inequalities) {
        return inequalities.every(([a, b, c, sign]) => sign * (a * point[0] + b * point[1] + c) >= -this.eps)
    }
}
