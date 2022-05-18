const PAGE_ELEMENTS = {}

const populatePageElementVars = () => {

  PAGE_ELEMENTS.SPINNER = {
    CONTAINER: document.getElementById('loading-screen')
  }

  PAGE_ELEMENTS.CALENDAR = {
    ADD_BUTTON: document.getElementById('add-calendar-btn'),
    CONTAINER: document.getElementById('calendar-inputs'),
    EVENT_DATETIME: document.getElementById('follow-up-datetime'),
    EVENT_LOCATION: document.getElementById('follow-up-location'),
    EVENT_MARKER: document.getElementById('add-calendar-event-marker'),
    EVENT_TITLE: document.getElementById('follow-up-title'),
    REMOVE_BUTTON: document.getElementById('remove-calendar-btn')
  }

  PAGE_ELEMENTS.FORM = {
    CARE_NOTES: document.getElementById('care-notes'),
    FOLLOW_UP_NOTES: document.getElementById('follow-up-notes'),
    PATIENT_DATALIST: document.getElementById('patient-datalist'),
    PATIENT_INFO: document.getElementById('patient-info')
  }

  PAGE_ELEMENTS.MATERIALS = {
    DATALIST: document.getElementById('materials-datalist'),
    NAME_INPUT: document.getElementById('material-name'),
    QUANTITY_INPUT: document.getElementById('material-quantity'),
    TABLE_BODY: document.getElementById('materials-used-table-body')
  }
}

const preventEventDefault = (event) => {
  if (event && event.preventDefault) {
    event.preventDefault()
  }
}

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

const toggleSpinner = () => {
  PAGE_ELEMENTS.SPINNER.CONTAINER.classList.toggle('loading-hidden')
  PAGE_ELEMENTS.SPINNER.CONTAINER.classList.toggle('loading-visible')
}

const setCalendarEventDefaults = () => {
  PAGE_ELEMENTS.CALENDAR.EVENT_DATETIME.value = getDefaultDate()
}

const showCalendarInputs = (event) => {
  preventEventDefault(event)
  PAGE_ELEMENTS.CALENDAR.CONTAINER.style.display = 'inherit'
  PAGE_ELEMENTS.CALENDAR.REMOVE_BUTTON.style.display = 'inherit'
  PAGE_ELEMENTS.CALENDAR.ADD_BUTTON.style.display = 'none'
  PAGE_ELEMENTS.CALENDAR.EVENT_MARKER.checked = true
}

const addMaterial = (event) => {
  preventEventDefault(event)
  const tableBody = PAGE_ELEMENTS.MATERIALS.TABLE_BODY
  const tableRow = document.createElement('tr')
  const materialName = PAGE_ELEMENTS.MATERIALS.NAME_INPUT
  const materialQuantity = PAGE_ELEMENTS.MATERIALS.QUANTITY_INPUT
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
  const datalist = PAGE_ELEMENTS.MATERIALS.DATALIST
  constants.materials.medical.forEach(item => {
    const itemElem = document.createElement('option')
    itemElem.text = item
    itemElem.value = item
    datalist.appendChild(itemElem)
  })
}

const clearCalendarInputs = (event) => {
  preventEventDefault(event)
  PAGE_ELEMENTS.CALENDAR.EVENT_TITLE.value = 'Follow Up Event'
  PAGE_ELEMENTS.CALENDAR.EVENT_DATETIME.value = getDefaultDate()
  PAGE_ELEMENTS.CALENDAR.EVENT_LOCATION.value = 'JBL'
  PAGE_ELEMENTS.CALENDAR.EVENT_MARKER.checked = false
  PAGE_ELEMENTS.CALENDAR.CONTAINER.style.display = 'none'
  PAGE_ELEMENTS.CALENDAR.REMOVE_BUTTON.style.display = 'none'
  PAGE_ELEMENTS.CALENDAR.ADD_BUTTON.style.display = 'inherit'
}

const clearForm = (event) => {
  preventEventDefault(event)
  PAGE_ELEMENTS.FORM.PATIENT_INFO.value = null
  PAGE_ELEMENTS.FORM.CARE_NOTES.value = null
  PAGE_ELEMENTS.FORM.FOLLOW_UP_NOTES.value = null
  PAGE_ELEMENTS.MATERIALS.NAME_INPUT.value = null
  PAGE_ELEMENTS.MATERIALS.QUANTITY_INPUT.value = null
  const tableBody = PAGE_ELEMENTS.MATERIALS.TABLE_BODY
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild)
  }
  clearCalendarInputs()
}

const createRequestBody = () => {
  const requestBody = {
    patientInfo: PAGE_ELEMENTS.FORM.PATIENT_INFO.value,
    careNotes: PAGE_ELEMENTS.FORM.CARE_NOTES.value,
    followUp: {
      notes: PAGE_ELEMENTS.FORM.FOLLOW_UP_NOTES.value
    },
    materials: []
  }
  if (PAGE_ELEMENTS.CALENDAR.EVENT_MARKER.checked) {
    requestBody.followUp.createCalendarEvent = true
    requestBody.followUp.title = PAGE_ELEMENTS.CALENDAR.EVENT_TITLE.value
    requestBody.followUp.location = PAGE_ELEMENTS.CALENDAR.EVENT_LOCATION.value
    requestBody.followUp.start_dt = PAGE_ELEMENTS.CALENDAR.EVENT_DATETIME.value
  }
  PAGE_ELEMENTS.MATERIALS.TABLE_BODY.querySelectorAll('tr').forEach(row => {
    requestBody.materials.push({
      materialData: row.querySelector('.materialData').textContent,
      materialQuantity: row.querySelector('.materialQuantity').textContent
    })
  })
  return requestBody
}

const initPage = async () => {
  populatePageElementVars()
  addMaterialsOptions()
  await populatePatientDatalist()
  toggleSpinner()
}

const getPatientList = async () => {
  try {
    const response = await fetch('https://medform-api.pdxmutualaidmap.org/api/patient', {
      method: 'GET',
      mode: 'cors'
    })
    return response.json()
  } catch (e) {
    console.error(e)
  }
}

const populatePatientDatalist = async () => {
  const patients = await getPatientList()
  const datalist = PAGE_ELEMENTS.FORM.PATIENT_DATALIST
  patients.data.forEach(item => {
    const itemElem = document.createElement('option')
    itemElem.text = item
    itemElem.value = item
    datalist.appendChild(itemElem)
  })
}

const submitForm = async (event) => {
  preventEventDefault(event)
  toggleSpinner()
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
  } finally {
    toggleSpinner()
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
      },
      "getPatients": {
        "method": "get",
        "path": "/patient"
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
