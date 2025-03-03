Visualizer.prototype.SetDimension = function(dimension) {
    this.dataset.SetDimension(dimension)
}

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

Visualizer.prototype.SetModelLayersSize = function(size) {
    this.modelManager.SetLayersSize(size)
}

Visualizer.prototype.SetModelOutputSize = function(size) {
    this.modelPlot.SetSize(size)
}

Visualizer.prototype.SetModelOutputMode = function(mode) {
    this.modelPlot.SetOutputMode(mode)
}

Visualizer.prototype.SetModelWeightsMode = function(mode) {
    this.modelPlot.SetWeightsMode(mode)
}

Visualizer.prototype.SetModelShowNeuron = function(layer, neuron) {
    this.modelPlot.SetShow(layer, neuron)
}

Visualizer.prototype.SetModelOutputPoint = function(point) {
    this.modelPlot.SetPoint(point)
}

Visualizer.prototype.SetCriterion = function(name) {
    this.criterion = GetLoss(name)
    this.UpdateMetrics()
}

Visualizer.prototype.SetOptimizer = function(name) {
    let config = this.optimizer.GetConfig()
    this.optimizer = GetOptimizer(name, config)
    this.model.ZeroGradientParams()
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

Visualizer.prototype.ToggleNeuron = function(layer, neuron) {
    this.modelManager.ToggleNeuron(layer, neuron)
}

Visualizer.prototype.SetActivation = function(activation) {
    this.modelManager.SetActivation(activation)
}
