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
        this.InitControlsEvents()
        this.InitDataPlot()

        this.dataTable.ChangeData("synthetic", split)
        this.dataPlot.ChangeData("synthetic", split)

        this.SetAxes()
    }

    ShowSteps(count, data) {
        MakeElement(this.parent, {innerText: "Генерация синтетических данных"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        MakeElement(stepsList, {class: "text", innerText: `Сгенерированы ${count} случайных точек на компакте`}, "li")
        MakeElement(stepsList, {class: "text", innerHTML: "Для каждой сгенерированной точки x<sub>i</sub> была получено предсказание модели y<sub>i</sub>"}, "li")

        let thresholds = this.visualizer.thresholds
        if (thresholds.low < thresholds.high)
            MakeElement(stepsList, {class: "text", innerHTML: `Точки с ${thresholds.low} &le; y<sub>i</sub> &lt; ${thresholds.high} были удалены (пороги доверия)`}, "li")

        MakeElement(stepsList, {class: "text", innerHTML: "В качестве синтетической выборки были выбраны точки x<sub>i</sub> с вероятностью |y<sub>i</sub>|"}, "li")

        if (data.length == 0)
            MakeElement(stepsList, {class: "text", innerText: "В результате все сгенерированные точки были отвергнуты"}, "li")
        else
            MakeElement(stepsList, {class: "text", innerHTML: `В результате были отобраны <b>${data.length}</b> точек (${Round(data.length * 100 / count, 10)}%)`}, "li")
    }

    InitControls(axisX, axisY) {
        MakeElement(this.parent, {innerText: "Управление"}, "h3")
        let axisList = MakeElement(this.parent, null, "ul")

        let x = MakeElement(axisList, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
        let y = MakeElement(axisList, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")

        this.controls["axis-x"] = CloneSelect(axisX, x)
        this.controls["axis-y"] = CloneSelect(axisY, y)
    }

    InitControlsEvents() {
        this.controls["axis-x"].addEventListener("change", () => this.SetAxes())
        this.controls["axis-y"].addEventListener("change", () => this.SetAxes())
    }

    InitDataPlot() {
        let dataPlotDiv = MakeElement(this.parent, {class: "data-plot", style: "width: 300px; height: 300px;"})
        let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        let viewBox = new ViewBox(dataPlotSVG)

        this.dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
        this.dataPlot.AddPlot("synthetic", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("synthetic", {title: "Синтетические данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
    }

    SetAxes() {
        let axisX = +this.controls["axis-x"].value
        let axisY = +this.controls["axis-y"].value

        this.dataPlot.SetAxes(axisX, axisY)
    }
}
