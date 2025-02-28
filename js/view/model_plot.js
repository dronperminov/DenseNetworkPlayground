class ModelPlot extends EventEmitter {
    constructor(viewBox, canvas, div, model, thresholds) {
        super()
        this.viewBox = viewBox

        this.outputLayer = new ModelOutputLayer(viewBox, canvas, model, thresholds)
        this.architectureLayer = new ModelArchitectureLayer(div.querySelector("svg"), model)

        this.architectureLayer.on("click-neuron", (layer, neuron, e) => this.emit("click-neuron", layer, neuron, e))
        this.viewBox.on("click", (e, x, y) => this.emit("view-click", e, this.outputLayer.GetPoint(x, y)))
    }

    SetAxes(xAxis, yAxis) {
        this.outputLayer.SetAxes(xAxis, yAxis)
    }

    SetSize(size) {
        this.outputLayer.SetSize(size)
    }

    SetShow(layer, neuron) {
        this.outputLayer.SetShow(layer, neuron)
        this.architectureLayer.SetShow(layer, neuron)
    }

    SetOutputMode(mode) {
        this.outputLayer.SetMode(mode)
    }

    SetWeightsMode(mode) {
        this.architectureLayer.SetWeightsMode(mode)
    }

    SetPoint(point) {
        this.outputLayer.SetPoint(point)
    }

    ChangeModel() {
        this.outputLayer.Plot()
        this.architectureLayer.Update()
    }

    ChangeModelArchitecture() {
        this.outputLayer.UpdatePoint()
        this.architectureLayer.Init()
    }

    ChangeThresholds() {
        this.outputLayer.Plot({inputs: false, outputs: false, pixels: true})
    }
}
