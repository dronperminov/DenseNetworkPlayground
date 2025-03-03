Playground.prototype.SetModelInputsCount = function(inputs) {
    if (!confirm("Вы уверены, что хотите изменить размерность входа модели?"))
        return

    this.visualizer.SetDimension(inputs)
}

Playground.prototype.SetModelLayersSize = function(size) {
    this.visualizer.SetModelLayersSize(size)
}

Playground.prototype.SetModelActivation = function(activation) {
    this.visualizer.SetActivation(activation)
}

Playground.prototype.SetLearningRate = function(learningRate) {
    this.visualizer.SetLearningRate(learningRate)
    this.UpdateLearningRateIcon()
}

Playground.prototype.SetBatchSize = function(batchSize) {
    this.visualizer.SetBatchSize(batchSize)
    this.UpdateBatchSizeIcon()
}

Playground.prototype.SetBackgroundPart = function(backgroundPart) {
    this.visualizer.SetBackgroundPart(backgroundPart)
    this.UpdateBackgroundPartIcon()
}

Playground.prototype.SetCriterion = function(criterion) {
    this.visualizer.SetCriterion(criterion)
    this.UpdateCriterionIcon()
}

Playground.prototype.SetOptimizer = function(optimizer) {
    this.visualizer.SetOptimizer(optimizer)
    this.UpdateOptimizerIcon()
}

Playground.prototype.SetRegularizationType = function(regularizationType) {
    this.visualizer.SetRegularizationType(regularizationType)
    this.UpdateRegularizationIcon()
}

Playground.prototype.SetRegularization = function(lambda) {
    this.visualizer.SetRegularization(lambda)
    this.UpdateRegularizationIcon()
}

Playground.prototype.SetModelOutputMode = function(mode) {
    this.visualizer.SetModelOutputMode(mode)

    if (mode == "no")
        this.modelOutputBlock.classList.add("hidden")
    else
        this.modelOutputBlock.classList.remove("hidden")
}

Playground.prototype.SetModelOutputSize = function(size) {
    this.visualizer.SetModelOutputSize(size)
}

Playground.prototype.SetModelWeightsMode = function(mode) {
    this.visualizer.SetModelWeightsMode(mode)
}

Playground.prototype.SetAxes = function() {
    let xAxis = +this.axisX.value
    let yAxis = +this.axisY.value
    this.visualizer.SetAxes(xAxis, yAxis)
}

Playground.prototype.UpdateLearningRateIcon = function() {
    this.learningRateValue.innerText = this.visualizer.optimizer.learningRate
}

Playground.prototype.UpdateBatchSizeIcon = function() {
    this.batchSizeValue.innerText = this.visualizer.batchSize
}

Playground.prototype.UpdateBackgroundPartIcon = function() {
    this.backgroundPartValue.innerText = this.visualizer.backgroundPart * 100
}

Playground.prototype.UpdateCriterionIcon = function() {
    this.criterionValue.innerText = this.visualizer.criterion.name
}

Playground.prototype.UpdateOptimizerIcon = function() {
    this.optimizerValue.innerText = this.visualizer.optimizer.name
}

Playground.prototype.UpdateRegularizationIcon = function() {
    if (this.visualizer.optimizer.regularizationType == "l1") {
        this.regularizationL1Value.parentNode.classList.remove("hidden")
        this.regularizationL1Value.innerText = this.visualizer.optimizer.lambda
    }
    else
        this.regularizationL1Value.parentNode.classList.add("hidden")

    if (this.visualizer.optimizer.regularizationType == "l2") {
        this.regularizationL2Value.parentNode.classList.remove("hidden")
        this.regularizationL1Value.innerText = this.visualizer.optimizer.lambda
    }
    else
        this.regularizationL2Value.parentNode.classList.add("hidden")

    if (this.visualizer.optimizer.regularizationType == "")
        this.regularization.parentNode.classList.add("hidden")
    else
        this.regularization.parentNode.classList.remove("hidden")
}

Playground.prototype.UpdateTrainIcons = function() {
    this.UpdateLearningRateIcon()
    this.UpdateBatchSizeIcon()
    this.UpdateBackgroundPartIcon()
    this.UpdateCriterionIcon()
    this.UpdateOptimizerIcon()
    this.UpdateRegularizationIcon()
}
