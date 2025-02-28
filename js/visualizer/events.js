Visualizer.prototype.HandleChangeDimension = function(dimension) {
    this.modelManager.SetInputs(dimension)
}

Visualizer.prototype.HandleChangeData = function(name, split) {
    if (name === "train")
        this.compact.Initialize(split.data.dimension, split.stats, this.compact.offset)

    this.dataPlot.ChangeData(name, split)
    this.dataTable.ChangeData(name, split)

    if (name == "background")
        return

    this.modelManager.Predict(name, split.data)
    this.PlotMetrics()
    this.PlotHistograms()
}

Visualizer.prototype.HandleClearData = function() {
    this.compact.Reset()
    this.dataPlot.ClearData()
    this.dataTable.ClearData()

    this.epoch = 0
    this.optimizer.Reset()
    this.metrics.Reset()

    this.modelManager.ClearPredictions()

    this.PlotMetrics()
    this.PlotHistograms()
}

Visualizer.prototype.HandleChangeThresholds = function(low, high) {
    this.modelPlot.ChangeThresholds()
    this.UpdateMetrics()
    this.PlotHistograms()
}

Visualizer.prototype.HandleChangeModel = function() {
    this.modelPlot.ChangeModel()
    this.UpdatePredictions()
}

Visualizer.prototype.HandleChangeModelArchitecture = function() {
    this.modelPlot.ChangeModelArchitecture()
}

Visualizer.prototype.HandleClickNeuron = function(layer, neuron, e) {
    if (e.button == 0) {
        this.SetModelShowNeuron(layer, neuron)
    }
    else if (e.button == 2) {
        this.ToggleNeuron(layer, neuron)
    }
}

Visualizer.prototype.HandleChangePredictions = function(name) {
    this.HandleChangeMetrics(name)
}

Visualizer.prototype.HandleChangeMetrics = function(name) {
    let data = this.dataset.splits[name].data
    if (data.length == 0)
        return

    let predictions = this.modelManager.predictions[name]
    let metrics = this.EvaluateMetricsOnData(data, predictions)

    this.metrics.Set("loss", name, this.epoch, metrics.loss)

    if (name != "background") {
        this.metrics.Set("error", name, this.epoch, metrics.error)
        this.metrics.Set("refuse", name, this.epoch, metrics.refuse)
    }
}
