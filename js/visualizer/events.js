Visualizer.prototype.HandleChangeDimension = function(dimension) {
    this.modelManager.SetInputs(dimension)
}

Visualizer.prototype.HandleChangeData = function(name, split) {
    if (name === "train")
        this.compact.Initialize(split.data.dimension, split.stats, this.compact.offset)

    this.dataPlot.ChangeData(name, split)
    this.dataTable.ChangeData(name, split)

    if (name != "background")
        this.modelManager.Predict(name, split.data)
}

Visualizer.prototype.HandleClearData = function() {
    this.compact.Reset()
    this.dataPlot.ClearData()
    this.dataTable.ClearData()
    this.metrics.Reset()
    this.modelManager.ClearPredictions()
    // TODO: reset metrics?
}

Visualizer.prototype.HandleChangeThresholds = function(low, high) {
    this.modelPlot.ChangeThresholds()
    this.UpdateMetrics()
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
    let predictions = this.modelManager.predictions[name]
    let metrics = this.EvaluateMetricsOnData(data, predictions)

    this.metrics.Set("loss", name, this.epoch, metrics.loss)

    if (name != "background") {
        this.metrics.Set("accuracy", name, this.epoch, metrics.accuracy)
        this.metrics.Set("refuse", name, this.epoch, metrics.refuse)
    }
}
