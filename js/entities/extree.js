class ExTree {
    constructor() {
        this.root = this.MakeNode()
        this.total = {train: 0, test: 0, background: 0}
    }

    Fill(name, data, predictions, signs) {
        for (let i = 0; i < data.length; i++)
            this.AddPoint(name, i, data.outputs[i], predictions[i], signs[i])

        this.total[name] += data.length
    }

    GetLeafs() {
        let leafs = []
        this.GetLeafsHelper(this.root, leafs)
        return leafs
    }

    AddPoint(name, index, label, value, signs) {
        let leaf = this.GetLeaf(signs)
        leaf.data.total++

        let split = leaf.data.splits[name]

        split.indices.push(index)
        split.labels.push(label)
        split.values.push(value)
        split.total++
        split.sum += value

        if (split.label2count.has(label))
            split.label2count.set(label, split.label2count.get(label) + 1)
        else
            split.label2count.set(label, 1)
    }

    GetLeaf(signs) {
        let node = this.root

        for (let sign of signs) {
            if (sign < 0) {
                if (node.left === null)
                    node.left = this.MakeNode()

                node = node.left
            }
            else {
                if (node.right === null)
                    node.right = this.MakeNode()

                node = node.right
            }
        }

        if (!node.data)
            node.data = this.MakeLeafData(signs)

        return node
    }

    MakeLeafData(signs) {
        return {
            signs: signs.slice(),
            total: 0,
            splits: {
                train: this.MakeSplit(),
                test: this.MakeSplit(),
                background: this.MakeSplit()
            },
            stats: {
                train: this.MakeStat(),
                test: this.MakeStat()
            }
        }
    }

    MakeSplit() {
        return {
            indices: [],
            labels: [],
            values: [],
            total: 0,
            sum: 0,
            label2count: new Map()
        }
    }

    MakeStat() {
        return {
            c: {mean: 0, std: 0, variance: 0},
            h: 0,
            diff: 0
        }
    }

    MakeNode() {
        return {left: null, right: null}
    }

    GetLeafsHelper(node, leafs) {
        if (node == null)
            return

        this.GetLeafsHelper(node.left, leafs)

        if (node.left == null && node.right == null) {
            this.FillStats(node.data, "train")
            this.FillStats(node.data, "test")
            leafs.push(node.data)
        }

        this.GetLeafsHelper(node.right, leafs)
    }

    FillStats(data, name) {
        let split = data.splits[name]
        let stats = data.stats[name]
        let background = data.splits.background

        let total = split.total + background.total
        let mean = (split.sum + background.sum) / Math.max(total, 1)

        let dataSumVariance = split.values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0)
        let backgroundSumVariance = background.values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0)
        let variance = (dataSumVariance + backgroundSumVariance) / Math.max(total, 1)

        let alpha = this.total.background == 0 ? 1 : this.total[name] / this.total.background
        let h = split.labels.reduce((sum, label) => sum + label, 0) / Math.max(split.total + Math.max(background.total, 1) * alpha, 1)

        stats.c.mean = mean
        stats.c.variance = variance
        stats.c.std = Math.sqrt(variance)

        stats.h = h
        stats.diff = Math.abs(mean - h)
    }

    CompareLeafs(data1, data2) {
        if (data1.splits.train.total == data2.splits.train.total)
            return data2.splits.background.total - data1.splits.background.total

        if (data1.splits.train.total > 0 || data2.splits.train.total > 0)
            return data2.splits.train.total - data1.splits.train.total

        return data2.splits.background.total - data1.splits.background.total
    }
}
