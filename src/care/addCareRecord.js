const { DynamoDB, SecretsManager } = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios').default

const { getSheetInfo } = require('../utils/googleSheets')

const dbClient = new DynamoDB({ region: process.env.AWS_REGION })
const ssmClient = new SecretsManager({ region: process.env.AWS_REGION })

const createTeamupDateString = (date) => {
  const dateString = date.toISOString()
  return dateString.substring(0, dateString.length - 5) + '-0700'
}

const addFollowUpCalendarEvent = async (followUp) => {
  const apiKey = await ssmClient.getSecretValue({ SecretId: 'medtent-followup-calendar-teamup-api-key' }).promise()
  const startDate = new Date(followUp.start_dt)
  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + 1)
  const requestBody = {
    subcalendar_id: parseInt(process.env.MEDTENT_TEAMUP_MEDICAL_SUBCALENDAR_ID),
    start_dt: createTeamupDateString(startDate),
    end_dt: createTeamupDateString(endDate),
    all_day: false,
    rrule: '',
    title: followUp.title,
    who: '',
    location: followUp.location,
    notes: followUp.notes
  }
  const teamupResponse = await axios.post(
    `https://api.teamup.com/${process.env.MEDTENT_TEAMUP_CALENDAR_ID}/events`,
    JSON.stringify(requestBody),
    {
      headers: {
        'Teamup-Token': apiKey.SecretString,
        'Content-Type': 'application/json'
      }
    }
  )
  return `https://teamup.com${teamupResponse.headers.location}`
}

const addCareVisitData = async (data) => {
  const doc = await getSheetInfo(process.env.MEDFORM_SHEET_ID)
  let sheet = doc.sheetsByTitle[data.patientInfo]
  if (!sheet) {
    sheet = await doc.addSheet({ title: data.patientInfo, headerValues: ['Date', 'Care Notes', 'Follow Up', 'Materials'] })
  }
  await sheet.addRow([data.careDate, data.careNotes, data.followUp, data.materials])
}

const handler = async (event) => {
  const { patientInfo, careNotes, followUp, materials, datetime } = JSON.parse(event.body)
  let calendarEvent
  if (followUp && followUp.createCalendarEvent && process.env.INTEGRATE_TEAMUP_CALENDAR) {
    calendarEvent = await addFollowUpCalendarEvent(followUp)
  }
  const dynamoPutParams = {
    Item: {
      CareId: {
        S: uuidv4(),
      },
      PatientInfo: {
        S: patientInfo.trim().toUpperCase(),
      },
      CareNotes: {
        S: careNotes,
      },
      FollowUp: {
        S: calendarEvent || (followUp ? followUp.notes : ''),
      },
      Materials: {
        S: JSON.stringify(materials)
      },
      Date: {
        S: datetime || new Date().toString()
      }
    },
    TableName: process.env.MEDFORM_TABLE_NAME
  }

  try {
    await dbClient.putItem(dynamoPutParams).promise()
  } catch (e) {
    throw { status: 500, message: e.message }
  }

  if (process.env.INTEGRATE_GOOGLE_SHEETS) {
    try {
      await addCareVisitData({
        patientInfo: dynamoPutParams.Item.PatientInfo.S,
        careDate: dynamoPutParams.Item.Date.S,
        careNotes: dynamoPutParams.Item.CareNotes.S,
        followUp: dynamoPutParams.Item.FollowUp.S,
        materials: materials.map(material => `${material.materialData}: ${material.materialQuantity}`).join(', ')
      })
    } catch (e) {
      console.error(e)
      console.log(JSON.stringify(e.response.data.error))
    }
  }

  return { status: 200 }
}

module.exports = {
  handler
}
