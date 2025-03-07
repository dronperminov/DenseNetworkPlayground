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

    if (["svg", "path", "g", "circle", "rect", "text"].indexOf(tagName) > -1) {
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

function MakeCheckbox(parent = null, text, checked) {
    let label = MakeElement(parent, {class: "switch-checkbox"}, "label")
    let input = MakeElement(label, {type: "checkbox", autocomplete: "off"}, "input")
    let span = MakeElement(label, {class: "switch-checkbox-text", innerText: text}, "span")

    if (checked)
        input.setAttribute("checked", "")

    return input
}

function AddClassName(element, className, condition) {
    if (condition)
        element.classList.add(className)
    else
        element.classList.remove(className)
}

function Round(value, scale = 100) {
    return Math.round(value * scale) / scale
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
