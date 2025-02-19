class ModelArchitectureLayer extends EventEmitter {
    constructor(svg, model) {
        super()
        this.svg = svg
        this.model = model
        this.mode = "weights"
        this.show = {layer: this.model.layers.length - 1, neuron: 0}

        this.Init()
        new ResizeObserver(() => this.Resize()).observe(this.svg)
    }

    SetShow(layer, neuron) {
        this.show.layer = layer
        this.show.neuron = neuron
        this.Update()
    }

    SetWeightsMode(mode) {
        this.mode = mode
        this.Update()
    }

    GetBestCoordinates(maxRadius = 18, maxGap = 25, minGap = 5, padding = 5) {
        let inputs = this.model.inputs
        let layers = this.model.layers.length + 1
        let neurons = this.model.inputs + 1

        for (let layer of this.model.layers)
            neurons = Math.max(neurons, layer.outputs + 1)

        let width = this.svg.clientWidth - 2 * padding
        let height = this.svg.clientHeight - 2 * padding
        let rotate = (width < height) != (neurons < layers)

        if (rotate)
            [width, height] = [height, width]

        let radiuses = []
        let gapsX = []
        let sumRadius = 0

        for (let i = 0; i < layers; i++) {
            let size = (i == 0 ? inputs : this.model.layers[i - 1].outputs) + (i < layers - 1 ? 1 : 0)
            let radius = maxRadius
            let gap = Math.min((width - size * 2 * radius) / Math.max(size - 1, 1), maxGap)

            if (gap < minGap) {
                gap = minGap
                radius = (width - gap * (size - 1)) / (2 * size)
            }

            radiuses[i] = radius
            gapsX[i] = gap
            sumRadius += 2 * radius
        }

        let gapY = (height - sumRadius) / (layers - 1)
        let scale = 1

        if (gapY < minGap) {
            gapY = minGap
            scale = (height - gapY * (layers - 1)) / sumRadius
        }

        let coordinates = {}
        let y = padding

        for (let i = 0; i < layers; i++) {
            let needOne = i < layers - 1
            let size = (i == 0 ? inputs : this.model.layers[i - 1].outputs) + (needOne ? 1 : 0)
            let radius = radiuses[i] * scale
            let x0 = padding + radius + (width - size * 2 * radius - (size - 1) * gapsX[i]) / 2

            coordinates[i - 1] = []

            for (let j = 0; j < size; j++) {
                let xi = x0 + j * (2 * radius + gapsX[i])
                let yi = y + radius

                coordinates[i - 1][j] = {x: rotate ? yi : xi, y: rotate ? xi : yi, radius: radius}
            }

            y += 2 * radius + gapY
        }

        return coordinates
    }

    InitNeurons() {
        this.neurons = {}

        for (let i = -1; i < this.model.layers.length; i++) {
            this.neurons[i] = []

            let bias = i < this.model.layers.length - 1
            let size = (i < 0 ? this.model.inputs : this.model.layers[i].outputs)

            for (let j = 0; j < size + bias; j++)
                this.neurons[i].push(this.MakeNeuron(j == size ? "1" : this.GetNeuronName(i, j)))
        }

        for (let i = 0; i < this.model.layers.length; i++)
            for (let j = 0; j < this.neurons[i].length; j++)
                this.neurons[i][j].neuron.addEventListener("mousedown", e => this.emit("click-neuron", i, j, e))
    }

    InitWeights() {
        this.weights = []
    
        for (let i = 0; i < this.model.layers.length; i++) {
            this.weights[i] = []

            for (let j = 0; j < (this.model.layers[i].inputs + 1) * this.model.layers[i].outputs; j++)
                this.weights[i].push(this.MakeWeight())
        }
    }

    Init() {
        this.svg.innerHTML = ""

        this.InitWeights()
        this.InitNeurons()
        this.Resize()
        this.Update()
    }

    Resize() {
        let coordinates = this.GetBestCoordinates()

        for (let index = -1; index < this.model.layers.length; index++)
            for (let j = 0; j < this.neurons[index].length; j++)
                this.UpdateNeuronCoordinates(this.neurons[index][j], coordinates[index][j])

        for (let index = 0; index < this.model.layers.length; index++)
            for (let i = 0; i < this.model.layers[index].outputs; i++)
                for (let j = 0; j <= this.model.layers[index].inputs; j++)
                    this.UpdateWeightCoordinates(this.weights[index][i * (this.model.layers[index].inputs + 1) + j], coordinates[index][i], coordinates[index - 1][j])
    }

    Update() {
        for (let index = 0; index < this.model.layers.length; index++) {
            let layer = this.model.layers[index]

            for (let i = 0; i < layer.outputs; i++) {
                for (let j = 0; j <= layer.inputs; j++) {
                    let w = this.mode == "weights" ? layer.w : layer.dw
                    let b = this.mode == "weights" ? layer.b : layer.db

                    let value = j < layer.inputs ? w[i * layer.inputs + j] : b[i]
                    let disabled = index > 0 && this.model.layers[index - 1].disabled[j]

                    SetAttributes(this.weights[index][i * (layer.inputs + 1) + j], this.GetWeightParams(value, disabled))
                }

                AddClassName(this.neurons[index][i].neuron, "neuron-disabled", layer.disabled[i])
                AddClassName(this.neurons[index][i].neuron, "neuron-active", index == this.show.layer && i == this.show.neuron)
            }
        }
    }

    MakeNeuron(name) {
        let neuron = MakeElement(this.svg, {class: "neuron"}, "circle")
        let text = MakeElement(this.svg, {"dominant-baseline": "middle", "text-anchor": "middle", textContent: name}, "text")
        return {neuron, text}
    }

    MakeWeight() {
        return MakeElement(this.svg, {fill: "none"}, "path")
    }

    UpdateNeuronCoordinates(neuron, c) {
        SetAttributes(neuron.neuron, {cx: c.x, cy: c.y, r: c.radius})
        SetAttributes(neuron.text, {x: c.x, y: c.y, "font-size": c.radius})
    }

    UpdateWeightCoordinates(weight, c1, c2) {
        SetAttributes(weight, {d: `M${c1.x} ${c1.y} L${c2.x} ${c2.y}`})
    }

    GetWeightParams(value, disabled) {
        let stroke = Math.max(0.25, Math.min(10, Math.abs(value)))
        let color = value > 0.01 ? "#dd7373" : value < -0.01 ? "#7699d4" : "#000000"

        if (disabled) {
            stroke = 0
            color = "#fff"
        }

        return {"stroke-width": stroke, "stroke": color}
    }

    GetNeuronName(layer, neuron) {
        let layerName = "xABCDEFGHIJKLMNOPQRSTUVWXYZ"[layer + 1]
        let neuronIndex = this.NumberToIndex(neuron + 1)
        return `${layerName}${neuronIndex}`
    }

    NumberToIndex(number) {
        if (number == 0)
            return '₀'

        let digitsStr = '₀₁₂₃₄₅₆₇₈₉'
        let digits = []

        while (number > 0) {
            digits.push(digitsStr[number % 10])
            number = Math.floor(number / 10)
        }

        return digits.reverse().join('')
    }
}
