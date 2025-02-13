Visualizer.prototype.SetAxes = function(xAxis, yAxis) {
    this.dataPlot.SetAxes(xAxis, yAxis)
    this.modelPlot.SetAxes(xAxis, yAxis)
}

Visualizer.prototype.ClearData = function() {
    this.dataset.Clear()
}

Visualizer.prototype.SetCompactOffset = function(offset) {
    this.compact.SetOffset(offset)
    this.dataPlot.ResetLimits()
}

Visualizer.prototype.SetDataVisibility = function(name, visible) {
    this.dataPlot.SetVisibility(name, visible)
}

Visualizer.prototype.SetModelPlotSize = function(size) {
    this.modelPlot.SetSize(size)
}

Visualizer.prototype.SetModelPlotMode = function(mode) {
    this.modelPlot.SetMode(mode)
}
