function SetAttributes(element, attributes) {
    if (attributes === null)
        return

    for (let [name, value] of Object.entries(attributes)) {
        if (name == "innerText")
            element.innerText = value
        else if (name == "innerHTML")
            element.innerHTML = value
        else if (name == "textContent")
            element.textContent = value
        else
            element.setAttribute(name, value)
    }
}

function MakeElement(parent = null, attributes = null, tagName = "div") {
    let element = null

    if (["svg", "path", "g", "circle", "rect", "text", "polygon"].indexOf(tagName) > -1) {
        element = document.createElementNS("http://www.w3.org/2000/svg", tagName)
    }
    else {
        element = document.createElement(tagName)
    }

    SetAttributes(element, attributes)

    if (parent !== null)
        parent.appendChild(element)

    return element
}

function MakeCheckbox(parent, text, checked) {
    let label = MakeElement(parent, {class: "switch-checkbox"}, "label")
    let input = MakeElement(label, {type: "checkbox", autocomplete: "off"}, "input")
    let span = MakeElement(label, {class: "switch-checkbox-text", innerText: text}, "span")

    if (checked)
        input.setAttribute("checked", "")

    return input
}

function MakeSelect(parent, text, options, value = null) {
    let label = MakeElement(parent, {innerHTML: text}, "label")
    let select = MakeElement(parent, {class: "basic-input"}, "select")

    for (let option of options)
        MakeElement(select, {value: option.name, innerText: option.title}, "option")

    if (value != null)
        select.value = value

    return select
}

function MakeInput(parent, text, attributes) {
    let label = MakeElement(parent, {innerHTML: text}, "label")
    let input = MakeElement(label, {class: "basic-input", ...attributes}, "input")
    return input
}

function CloneSelect(targetSelect, parent = null) {
    let select = MakeElement(parent, {class: "basic-input inline-input"}, "select")

    for (let option of targetSelect.children)
        MakeElement(select, {value: option.value, innerText: option.innerText}, "option")

    select.value = targetSelect.value
    return select
}

function AddClassName(element, className, condition) {
    if (condition)
        element.classList.add(className)
    else
        element.classList.remove(className)
}

function Round(value, scale = 100) {
    if (scale === "auto") {
        if (Math.abs(value) > 0.001)
            scale = 1000
        else
            scale = Math.pow(10, 2 - Math.floor(Math.log10(Math.abs(value))))
    }

    let sign = Math.sign(value)
    return sign * Math.round(Math.abs(value) * scale) / scale
}

function Hide(...elements) {
    for (let element of elements)
        element.classList.add("hidden")
}

function Show(...elements) {
    for (let element of elements)
        element.classList.remove("hidden")
}

function NumberToIndex(number) {
    if (number == 0)
        return '₀'

    let digitsStr = '₀₁₂₃₄₅₆₇₈₉'
    let digits = []

    while (number > 0) {
        digits.push(digitsStr[number % 10])
        number = Math.floor(number / 10)
    }

    return digits.reverse().join('')
}

function GetWordForm(count, forms) {
    let index = 0

    if ([0, 5, 6, 7, 8, 9].indexOf(Math.abs(count) % 10) > -1 || [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].indexOf(Math.abs(count) % 100) > -1)
        index = 2
    else if ([2, 3, 4].indexOf(Math.abs(count) % 10) > -1)
        index = 1

    return `${count} ${forms[index]}`
}
