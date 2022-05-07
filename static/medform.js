const getDefaultDate = () => {
  const oneWeekLater = new Date()
  oneWeekLater.setDate(oneWeekLater.getDate() + 7)
  oneWeekLater.setHours(oneWeekLater.getHours() - 7)
  const dateString = oneWeekLater.toISOString()
  return dateString.substring(0, dateString.length - 11) + ':00'
}

const removeMaterialButton = () => {
  const button = document.createElement('button')
  button.classList.add('p-button--negative', 'is-inline')
  button.textContent = 'Remove'
  button.onclick = function (event) {
    event.preventDefault()
    this.parentNode.parentNode.removeChild(this.parentNode)
  }
  return button
}

const showCalendarInputs = (event) => {
  if (event) {
    event.preventDefault()
  }
  document.getElementById('calendar-inputs').style.display = 'inherit'
  document.getElementById('remove-calendar-btn').style.display = 'inherit'
  document.getElementById('add-calendar-btn').style.display = 'none'
  document.getElementById('add-calendar-event-marker').checked = true
  document.getElementById('follow-up-datetime').value = getDefaultDate()
}

const addMaterial = (event) => {
  if (event) {
    event.preventDefault()
  }
  const tableBody = document.getElementById('materials-used-table-body')
  const tableRow = document.createElement('tr')
  const materialName = document.getElementById('material-name')
  const materialQuantity = document.getElementById('material-quantity')
  if (!materialName.value || !materialQuantity.value) return
  const materialNameDataElement = document.createElement('td')
  materialNameDataElement.classList.add('materialData')
  materialNameDataElement.textContent = materialName.value.toString()
  tableRow.appendChild(materialNameDataElement)
  const materialQuantityDataElement = document.createElement('td')
  materialQuantityDataElement.classList.add('materialQuantity')
  materialQuantityDataElement.textContent = materialQuantity.value.toString()
  tableRow.appendChild(materialQuantityDataElement)
  tableRow.appendChild(removeMaterialButton())
  tableBody.appendChild(tableRow)
}

const addMaterialsOptions = () => {
  const datalist = document.getElementById('materials-datalist')
  constants.materials.medical.forEach(item => {
    const itemElem = document.createElement('option')
    itemElem.text = item
    itemElem.value = item
    datalist.appendChild(itemElem)
  })
}

const clearCalendarInputs = (event) => {
  if (event) {
    event.preventDefault()
  }
  document.getElementById('follow-up-title').value = 'Follow Up Event'
  document.getElementById('follow-up-datetime').value = getDefaultDate()
  document.getElementById('follow-up-location').value = 'JBL'
  document.getElementById('add-calendar-event-marker').checked = false
  document.getElementById('calendar-inputs').style.display = 'none'
  document.getElementById('remove-calendar-btn').style.display = 'none'
  document.getElementById('add-calendar-btn').style.display = 'inherit'
}

const clearForm = (event) => {
  if (event) {
    event.preventDefault()
  }
  document.getElementById('care-notes').value = null
  document.getElementById('follow-up-notes').value = null
  document.getElementById('material-name').value = null
  document.getElementById('material-quantity').value = null
  document.getElementById('patient-info').value = null
  const tableBody = document.getElementById('materials-used-table-body')
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild)
  }
  clearCalendarInputs()
}

const createRequestBody = () => {
  const requestBody = {
    patientInfo: document.getElementById('patient-info').value,
    careNotes: document.getElementById('care-notes').value,
    followUp: {
      notes: document.getElementById('follow-up-notes').value
    },
    materials: []
  }
  if (document.getElementById('add-calendar-event-marker').checked) {
    requestBody.followUp.createCalendarEvent = true
    requestBody.followUp.title = document.getElementById('follow-up-title').value
    requestBody.followUp.location = document.getElementById('follow-up-location').value
    requestBody.followUp.start_dt = document.getElementById('follow-up-datetime').value
  }
  document.getElementById('materials-used-table-body').querySelectorAll('tr').forEach(row => {
    requestBody.materials.push({
      materialData: row.querySelector('.materialData').textContent,
      materialQuantity: row.querySelector('.materialQuantity').textContent
    })
  })
  return requestBody
}

const initPage = () => {
  addMaterialsOptions()
}

const submitForm = async (event) => {
  event.preventDefault()
  const requestBody = createRequestBody()
  try {
    await fetch('https://medform-api.pdxmutualaidmap.org/api/care', {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(requestBody)
    })
    clearForm()
  } catch (e) {
    console.error(e)
  }
}

window.addEventListener('load', initPage)

const constants = {
  "api": {
    "basePath": "",
    "actions": {
      "addCare": {
        "method": "post",
        "path": "/care"
      }
    }
  },
  "materials": {
    "general": [
      "Blanket",
      "Sunscreen",
      "Tarp",
      "Water"
    ],
    "medical": [
      "Alcohol prep pad",
      "Bactine/wound spray",
      "Bacitracin ointment",
      "Bandage",
      "Bandaid",
      "Chux",
      "Cleansing wipes",
      "Coban wrap",
      "Gauze",
      "Gloves",
      "Glucose test strip",
      "Hydrophillic foam dressing",
      "Irrigation syringe",
      "Lancet",
      "Mask",
      "Narcan",
      "Neosporin",
      "Non-adherent pad",
      "Non-sterile gauze",
      "Paper tape",
      "Petroleum jelly",
      "Rolled gauze",
      "Saline vial (5ml)",
      "Saline bottle (100ml)",
      "Saline bottle (250ml)",
      "Silvadene cream",
      "Sterile Gauze",
      "Wrap wound care kits"
    ]
  }
}
