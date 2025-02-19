class ModelPlot {
    constructor(viewBox, canvas, div, model, thresholds) {
        this.viewBox = viewBox

        this.outputLayer = new ModelOutputLayer(viewBox, canvas, model, thresholds)
    }

    SetAxes(xAxis, yAxis) {
        this.outputLayer.SetAxes(xAxis, yAxis)
    }

    SetSize(size) {
        this.outputLayer.SetSize(size)
    }

    SetShow(layer, neuron) {
        this.outputLayer.SetShow(layer, neuron)
    }

    SetMode(mode) {
        this.outputLayer.SetMode(mode)
    }

    ChangeModel() {
        this.outputLayer.Plot()
    }

    ChangeThresholds() {
        this.outputLayer.Plot({inputs: false, outputs: false, pixels: true})
    }
}
