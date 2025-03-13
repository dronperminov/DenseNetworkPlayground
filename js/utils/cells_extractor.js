class CellsExtractor {
    constructor(model) {
        this.model = model
    }

    ExtractAll(limits, axisX, axisY) {
        let polygon = [
            [limits.xmin, limits.ymin],
            [limits.xmin, limits.ymax],
            [limits.xmax, limits.ymax],
            [limits.xmax, limits.ymin]
        ]

        let lines = this.GetFirstLayerLines(axisX, axisY)
        let tree = this.SplitPolygonByLines(polygon, lines, [])
        let layer2polygons = []

        for (let i = 0; i < this.model.layers.length; i++)
            layer2polygons.push({})

        this.ExtractPolygons(1, [lines], tree, axisX, axisY, layer2polygons)

        return layer2polygons
    }

    ExtractPolygons(index, layer2lines, tree, axisX, axisY, layer2polygons) {
        for (let node of tree)
            layer2polygons[index - 1][node.key.join("")] = node.polygon

        if (index == this.model.layers.length)
            return

        for (let node of tree) {
            for (let i = 0; i < node.signs.length; i++)
                layer2lines[index - 1][i][3] = node.signs[i]

            layer2lines[index] = this.GetLayerLines(index, layer2lines[index - 1], axisX, axisY)

            let layerTree = this.SplitPolygonByLines(node.polygon, layer2lines[index], node.key)
            this.ExtractPolygons(index + 1, layer2lines, layerTree, axisX, axisY, layer2polygons)
        }
    }

    GetFirstLayerLines(axisX, axisY) {
        let layer = this.model.layers[0]
        let lines = []

        for (let i = 0; i < layer.outputs; i++)
            lines.push(layer.disabled[i] ? [0, 0, 0, 0] : [layer.w[i * layer.inputs + axisX], layer.w[i * layer.inputs + axisY], layer.b[i], 0])

        return lines
    }

    GetLayerLines(index, prevLines, axisX, axisY) {
        let layer = this.model.layers[index]
        let lines = []

        for (let i = 0; i < layer.outputs; i++) {
            let line = [0, 0, layer.b[i], 0]

            for (let j = 0; j < layer.inputs; j++) {
                let sign = prevLines[j][3]
                let activation = 1

                if (this.model.layers[index - 1].activation == "abs")
                    activation = sign >= 0 ? 1 : -1
                else if (this.model.layers[index - 1].activation == "relu")
                    activation = sign >= 0 ? 1 : 0
                else if (this.model.layers[index - 1].activation == "leaky-relu")
                    activation = sign >= 0 ? 1 : 0.01

                line[0] += layer.w[i * layer.inputs + j] * prevLines[j][0] * activation
                line[1] += layer.w[i * layer.inputs + j] * prevLines[j][1] * activation
                line[2] += layer.w[i * layer.inputs + j] * prevLines[j][2] * activation
            }

            if (layer.disabled[i])
                line = [0, 0, 0, 0]

            lines.push(line)
        }

        return lines
    }

    SplitPolygonByLines(polygon, lines, key) {
        let tree = [{signs: [], key: key, polygon: polygon}]

        for (let line of lines) {
            let splitted = []

            for (let node of tree) {
                let [lower, upper] = this.SplitPolygon(node.polygon, line)

                if (upper.length > 2)
                    splitted.push({key: node.key.concat("+"), signs: node.signs.concat(1), polygon: upper})

                if (lower.length > 2)
                    splitted.push({key: node.key.concat("-"), signs: node.signs.concat(-1), polygon: lower})
            }

            tree = splitted
        }

        return tree
    }

    SplitPolygon(polygon, line) {
        let [a, b, c] = line

        if (a == 0 && b == 0 && c == 0)
            return [polygon, []]

        let polygon1 = []
        let polygon2 = []

        for (let i = 0; i < polygon.length; i++) {
            let [x1, y1] = polygon[i]
            let [x2, y2] = polygon[(i + 1) % polygon.length]

            let sign1 = a * x1 + b * y1 + c
            let sign2 = a * x2 + b * y2 + c

            if (sign1 <= 0)
                polygon1.push(polygon[i])

            if (sign1 >= 0)
                polygon2.push(polygon[i])

            if (sign1 * sign2 >= 0)
                continue

            let t = sign1 / (sign1 - sign2)
            let p = [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]

            polygon1.push(p)
            polygon2.push(p)
        }

        return [polygon1, polygon2]
    }
}
