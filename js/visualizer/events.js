Visualizer.prototype.HandleChangeDimension = function(dimension) {
    this.modelManager.SetInputs(dimension)
}

Visualizer.prototype.HandleChangeData = function(name, split) {
    if (name === "train")
        this.compact.Initialize(split.data.dimension, split.stats, this.compact.offset)

    this.dataPlot.ChangeData(name, split)
    this.dataTable.ChangeData(name, split)
}

Visualizer.prototype.HandleClearData = function() {
    this.compact.Reset()
    this.dataPlot.ClearData()
    this.dataTable.ClearData()
}

Visualizer.prototype.HandleChangeThresholds = function(low, high) {
    this.modelPlot.ChangeThresholds()
}

Visualizer.prototype.HandleChangeModel = function() {
    this.modelPlot.ChangeModel()
}
