Visualizer.prototype.SetDimension = function(dimension) {
    this.dataset.SetDimension(dimension)
}

Visualizer.prototype.GetDimension = function() {
    return this.dataset.dimension
}

Visualizer.prototype.SetAxes = function(xAxis, yAxis) {
    this.dataPlot.SetAxes(xAxis, yAxis)
    this.modelPlot.SetAxes(xAxis, yAxis)
    this.cellsPlot.SetAxes(xAxis, yAxis)
}

Visualizer.prototype.SetThresholds = function(low, high) {
    this.thresholds.Set(low, high)
}

Visualizer.prototype.SetData = function(name, data) {
    this.dataset.SetData(name, data)
    this.dataPlot.ResetLimits()
}

Visualizer.prototype.AddData = function(name, data) {
    this.dataset.AddData(name, data)
    this.dataPlot.ResetLimits()
}

Visualizer.prototype.HaveData = function(names) {
    for (let name of names)
        if (this.dataset.splits[name] && this.dataset.splits[name].data.length > 0)
            return true

    return false
}

Visualizer.prototype.NormalizeData = function(mode) {
    this.dataset.NormalizeData("train", mode)
    this.dataPlot.ResetLimits()
}

Visualizer.prototype.ClearData = function() {
    this.dataset.Clear()
}

Visualizer.prototype.DownloadDataset = function() {
    this.dataset.Download()
}

Visualizer.prototype.SetCompactOffset = function(offset) {
    this.compact.SetOffset(offset)
    this.dataPlot.ResetLimits()
}

Visualizer.prototype.SetDataVisibility = function(name, visible) {
    this.dataPlot.SetVisibility(name, visible)
}

Visualizer.prototype.SetDataGridVisibility = function(visible) {
    this.dataPlot.SetGridVisibility(visible)
}

Visualizer.prototype.SetModelLayersCount = function(count, size, activation) {
    this.modelManager.SetLayersCount(count, size, activation)
}

Visualizer.prototype.SetModelLayersSize = function(size) {
    this.modelManager.SetLayersSize(size)
}

Visualizer.prototype.DownloadModel = function() {
    this.modelManager.Download()
}

Visualizer.prototype.LoadModel = function(data) {
    this.modelManager.Load(data)
}

Visualizer.prototype.SetTrainerModel = function() {
    this.modelManager.SetTrainerModel()
}

Visualizer.prototype.RemoveTrainerModel = function() {
    this.modelManager.RemoveTrainerModel()
}

Visualizer.prototype.RemoveDisabledNeurons = function() {
    this.modelManager.RemoveDisabledNeurons()
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

Visualizer.prototype.SetModelOutputSurfaceVisibility = function(visible) {
    this.modelPlot.SetSurfaceVisibility(visible)
}

Visualizer.prototype.SetModelOutputPoint = function(point) {
    this.modelPlot.SetPoint(point)
}

Visualizer.prototype.SetCellsLayer = function(layer) {
    let visibility = layer != "no"

    if (!this.cellsPlot.IsVisible() && visibility)
        this.cellsPlot.UpdateCells()

    this.cellsPlot.SetVisibility(visibility)

    if (visibility)
        this.cellsPlot.SetLayer(+layer)
}

Visualizer.prototype.SetCriterion = function(name) {
    this.criterion = GetLoss(name)
    this.UpdateMetrics()
}

Visualizer.prototype.SetOptimizer = function(name) {
    let config = this.optimizer.GetConfig()
    this.optimizer = GetOptimizer(name, config)
    this.modelManager.ZeroGradientParams()
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

Visualizer.prototype.FindUnusedNeurons = function(eps = 0.001) {
    let model = this.modelManager.model
    let metric = this.metrics.metrics.loss.train

    let loss = metric[metric.length - 1]
    let unused = 0

    for (let layer = 0; layer < model.layers.length - 1; layer++) {
        for (let neuron = 0; neuron < model.layers[layer].outputs; neuron++) {
            if (model.layers[layer].disabled[neuron])
                continue

            this.ToggleNeuron(layer, neuron)

            if (metric[metric.length - 1] < loss + eps)
                unused++
            else
                this.ToggleNeuron(layer, neuron)
        }
    }

    return unused
}
