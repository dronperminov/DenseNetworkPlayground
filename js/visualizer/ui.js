Visualizer.prototype.SetAxes = function(xAxis, yAxis) {
    this.dataPlot.SetAxes(xAxis, yAxis)
    this.modelPlot.SetAxes(xAxis, yAxis)
}

Visualizer.prototype.SetThresholds = function(low, high) {
    this.thresholds.Set(low, high)
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

Visualizer.prototype.SetCriterion = function(name) {
    this.criterion = GetLoss(name)
}

Visualizer.prototype.SetOptimizer = function(name, config = null) {
    this.optimizer = GetOptimizer(name, config)
}

Visualizer.prototype.SetLearningRate = function(learningRate) {
    this.optimizer.SetLearningRate(learningRate)
}

Visualizer.prototype.SetRegularizationType = function(regularizationType) {
    this.optimizer.SetRegularizationType(regularizationType)
}

Visualizer.prototype.SetRegularization = function(lambda) {
    this.optimizer.SetRegularization(lambda)
}

Visualizer.prototype.SetBatchSize = function(batchSize) {
    this.batchSize = batchSize
}

Visualizer.prototype.SetBackgroundPart = function(backgroundPart) {
    this.backgroundPart = backgroundPart
}