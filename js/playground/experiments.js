Playground.prototype.RunSyntheticDataExperiment = function() {
    this.tabExperiments.innerHTML = ""

    let count = this.syntheticDataBackgroundCount.GetValue()
    let experiment = new SyntheticDataExperiment(this.tabExperiments, this.visualizer)
    experiment.Run(count, this.axisX, this.axisY)
}

Playground.prototype.RunTreeExperiment = function() {
    this.tabExperiments.innerHTML = ""

    let count = this.treeBackgroundCount.GetValue()
    let experiment = new TreeExperiment(this.tabExperiments, this.visualizer)
    experiment.Run(count, this.axisX, this.axisY, this.modelOutputMode, this.modelOutputSize)
}
