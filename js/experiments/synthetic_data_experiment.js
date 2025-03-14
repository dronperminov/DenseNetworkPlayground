class SyntheticDataExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}
    }

    Run(backgroundCount, axisX, axisY) {
        let data = this.visualizer.GenerateSyntheticData(backgroundCount)
        let split = {data: data, stats: data.GetStatistic()}

        this.ShowSteps(backgroundCount, data)

        if (data.length == 0)
            return

        this.InitControls(axisX, axisY)
        this.InitDataPlot()

        this.dataTable.ChangeData("synthetic", split)
        this.dataPlot.ChangeData("synthetic", split)

        this.dataTable.ChangeData("train", this.visualizer.dataset.splits.train)
        this.dataPlot.ChangeData("train", this.visualizer.dataset.splits.train)

        this.SetAxes()
    }

    ShowSteps(count, data) {
        MakeElement(this.parent, {innerText: "Генерация синтетических данных"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        MakeElement(stepsList, {class: "text", innerText: `${GetWordForm(count, ["случайная точка сгенерирована", "случайные точки сгенерированы", "случайных точек сгенерированы"])} на компакте`}, "li")
        MakeElement(stepsList, {class: "text", innerHTML: "Для каждой сгенерированной точки x<sub>i</sub> получено предсказание модели y<sub>i</sub>"}, "li")

        let thresholds = this.visualizer.thresholds
        if (thresholds.low < thresholds.high)
            MakeElement(stepsList, {class: "text", innerHTML: `Точки с ${thresholds.low} &le; y<sub>i</sub> &lt; ${thresholds.high} были удалены (пороги доверия)`}, "li")

        MakeElement(stepsList, {class: "text", innerHTML: "В качестве синтетической выборки были выбраны точки x<sub>i</sub> с вероятностью |y<sub>i</sub>|"}, "li")

        if (data.length == 0)
            MakeElement(stepsList, {class: "text", innerText: "В результате все сгенерированные точки были отвергнуты"}, "li")
        else
            MakeElement(stepsList, {class: "text", innerHTML: `В результате ${GetWordForm(data.length, ["точка была отобрана", "точки были отобраны", "точек были отобраны"])} (${Round(data.length * 100 / count, 10)}%)`}, "li")
    }

    InitControls(axisX, axisY) {
        MakeElement(this.parent, {innerText: "Управление"}, "h3")
        let controls = MakeElement(this.parent, null, "ul")

        let x = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
        this.controls["axis-x"] = CloneSelect(axisX, x)
        this.controls["axis-x"].addEventListener("change", () => this.SetAxes())

        let y = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")
        this.controls["axis-y"] = CloneSelect(axisY, y)
        this.controls["axis-y"].addEventListener("change", () => this.SetAxes())

        let trainData = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-train-data"] = MakeCheckbox(trainData, "Отображать обучающие данные", false)
        this.controls["plot-train-data"].addEventListener("change", () => this.dataPlot.SetVisibility("train", this.controls["plot-train-data"].checked))

        let grid = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-grid"] = MakeCheckbox(grid, "Отображать сетку", true)
        this.controls["plot-grid"].addEventListener("change", () => this.dataPlot.SetGridVisibility(this.controls["plot-grid"].checked))
    }

    InitDataPlot() {
        let dataPlotDiv = MakeElement(this.parent, {class: "data-plot"})
        let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        let viewBox = new ViewBox(dataPlotSVG)

        this.dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
        this.dataPlot.AddPlot("synthetic", {border: "#000000", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        this.dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: false})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("synthetic", {title: "Синтетические данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
    }

    SetAxes() {
        let axisX = +this.controls["axis-x"].value
        let axisY = +this.controls["axis-y"].value

        this.dataPlot.SetAxes(axisX, axisY)
    }
}
