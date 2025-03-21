class MissedDataExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}
    }

    Run(rowsPart, columnsPart) {
        let data = this.visualizer.dataset.splits.train.data
        let dimension = data.dimension

        let [trainData, missedData] = data.Split(1 - rowsPart, true)
    }
}
