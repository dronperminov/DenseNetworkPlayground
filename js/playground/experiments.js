Playground.prototype.BuildAxisSelect = function(dimension, axis, parent = null) {
    let select = MakeElement(parent, {class: "basic-input inline-input"}, "select")

    for (let i = 0; i < dimension; i++)
        MakeElement(select, {value: i, innerText: `x${NumberToIndex(i + 1)}`}, "option")

    select.value = axis
    return select
}

Playground.prototype.RunSyntheticDataExperiment = function() {
    let count = this.syntheticDataBackgroundCount.GetValue()
    let data = this.visualizer.GenerateSyntheticData(count)
    let split = {data: data, stats: data.GetStatistic()}
    let thresholds = this.visualizer.thresholds

    this.tabExperiments.innerHTML = ""
    MakeElement(this.tabExperiments, {innerText: "Генерация синтетических данных"}, "h2")
    let stepsList = MakeElement(this.tabExperiments, null, "ul")
    MakeElement(stepsList, {class: "text", innerText: `Сгенерированы ${count} случайных точек на компакте`}, "li")
    MakeElement(stepsList, {class: "text", innerHTML: "Для каждой сгенерированной точки x<sub>i</sub> была получено предсказание модели y<sub>i</sub>"}, "li")

    if (thresholds.low < thresholds.high)
        MakeElement(stepsList, {class: "text", innerHTML: `Точки с ${thresholds.low} &le; y<sub>i</sub> &lt; ${thresholds.high} были удалены (пороги доверия)`}, "li")

    MakeElement(stepsList, {class: "text", innerHTML: "В качестве синтетической выборки были выбраны точки x<sub>i</sub> с вероятностью |y<sub>i</sub>|"}, "li")

    if (data.length == 0) {
        MakeElement(stepsList, {class: "text", innerText: "В результате все сгенерированные точки были отвергнуты"}, "li")
        return
    }

    MakeElement(stepsList, {class: "text", innerHTML: `В результате были отобраны <b>${data.length}</b> точек (${Round(data.length * 100 / count, 10)}%)`}, "li")

    let axisList = MakeElement(this.tabExperiments, null, "ul")
    let liX = MakeElement(axisList, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
    let liY = MakeElement(axisList, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")

    let axisX = this.BuildAxisSelect(data.dimension, this.axisX.value, liX)
    let axisY = this.BuildAxisSelect(data.dimension, this.axisY.value, liY)

    let dataPlotDiv = MakeElement(this.tabExperiments, {class: "data-plot", style: "width: 300px; height: 300px;"})
    let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
    let dataTableDiv = MakeElement(this.tabExperiments, {class: "data-table"})

    let viewBox = new ViewBox(dataPlotSVG)
    let compact = new Compact()

    let dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
    dataPlot.AddPlot("synthetic", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
    dataPlot.SetAxes(+axisX.value, +axisY.value)

    axisX.addEventListener("change", () => dataPlot.SetAxes(+axisX.value, +axisY.value))
    axisY.addEventListener("change", () => dataPlot.SetAxes(+axisX.value, +axisY.value))

    let dataTable = new DataTable(dataTableDiv)
    dataTable.Add("synthetic", {title: "Синтетические данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})

    dataTable.ChangeData("synthetic", split)
    dataPlot.ChangeData("synthetic", split)
    dataPlot.ResetLimits()
}

Playground.prototype.RunTreeExperiment = function() {
    let count = this.treeBackgroundCount.GetValue()
    let background = this.visualizer.compact.GetData(count)

    this.tabExperiments.innerHTML = ""
    MakeElement(this.tabExperiments, {innerText: "Построение объясняющего дерева (eXTree)"}, "h2")
    console.log(background)
}
