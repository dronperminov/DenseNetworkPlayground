Playground.prototype.HandleChangeDimension = function(dimension) {
    this.UpdateAxisDimension(this.axisX, dimension)
    this.UpdateAxisDimension(this.axisY, dimension)

    if (dimension > 1)
        this.axisY.value = 1

    this.SetAxes()
}

Playground.prototype.HandleChangeData = function(name, split) {
    if (name == "train")
        this.UpdateTrainButtons(split.data.length == 0)

    if (split.data.length > 0)
        this.dataBlock.classList.remove("hidden")
}

Playground.prototype.HandleClearData = function() {
    this.dataBlock.classList.add("hidden")
    this.UpdateTrainButtons(true)
}

Playground.prototype.UpdateAxisDimension = function(axis, dimension) {
    while (axis.children.length > dimension)
        axis.removeChild(axis.lastChild)

    for (let i = axis.children.length; i < dimension; i++)
        MakeElement(axis, {value: i, innerText: `x${NumberToIndex(i + 1)}`}, "option")
}

Playground.prototype.UpdateTrainButtons = function(disabled) {
    if (disabled)
        this.Stop()

    for (let button of [this.startBtn, this.stopBtn, this.stepBtn])
        if (disabled)
            button.setAttribute("disabled", "")
        else
            button.removeAttribute("disabled")
}
