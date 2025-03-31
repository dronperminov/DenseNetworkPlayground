Playground.prototype.RunSyntheticDataExperiment = function() {
    this.tabExperiments.innerHTML = ""

    let count = this.syntheticDataBackgroundCount.GetValue()
    let experiment = new SyntheticDataExperiment(this.tabExperiments, this.visualizer)
    experiment.Run(count, this.axisX, this.axisY)
}

Playground.prototype.RunTreeExperiment = function() {
    this.tabExperiments.innerHTML = ""

    let count = this.treeBackgroundCount.GetValue()
    let build3DHistogram = this.treeBuild3DHistogram.checked

    let experiment = new TreeExperiment(this.tabExperiments, this.visualizer)
    experiment.Run(count, build3DHistogram, this.axisX, this.axisY, this.modelOutputMode, this.modelOutputSize)
}

Playground.prototype.RunMissedDataExperiment = function() {
    this.tabExperiments.innerHTML = ""

    let rowsPart = this.missedRowsPart.GetValue() / 100
    let columnsPart = this.missedColumnsPart.GetValue() / 100
    let experiment = new MissedDataExperiment(this.tabExperiments, this.visualizer)
    experiment.Run(rowsPart, columnsPart)
}
