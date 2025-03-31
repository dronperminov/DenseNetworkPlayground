class MissedDataExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}
    }

    Run(rowsPart, columnsPart) {
        let trainData = this.visualizer.dataset.splits.train.data
        let testData = this.visualizer.dataset.splits.test.data
        let dimension = trainData.dimension
        let nanColumns = Math.max(1, Math.min(dimension - 1, dimension * columnsPart))

        let [completeData, missedData] = trainData.Split(1 - rowsPart, true)
        missedData.FillNans(nanColumns)

        this.ShowSteps(completeData, missedData)
        this.InitDataTable(trainData, testData, completeData, missedData)
    }

    ShowSteps(completeData, missedData) {
        MakeElement(this.parent, {innerText: "Обработка данных с пропусками"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        MakeElement(stepsList, {class: "text", innerHTML: "Обучающие данные разделены на два поднабора: комплектные и некомплектные"}, "li")
        MakeElement(stepsList, {class: "text", innerHTML: "В некомплектный набор вставлены пропуски случаным образом"}, "li")
    }

    InitDataTable(trainData, testData, completeData, missedData) {
        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("complete", {title: "Коплектные данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("missed", {title: "Некоплектные данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})

        this.dataTable.ChangeData("train", {data: trainData, stats: trainData.GetStatistic()})
        this.dataTable.ChangeData("complete", {data: completeData, stats: completeData.GetStatistic()})
        this.dataTable.ChangeData("missed", {data: missedData, stats: missedData.GetStatistic()})
        this.dataTable.ChangeData("test", {data: testData, stats: testData.GetStatistic()})
    }
}
