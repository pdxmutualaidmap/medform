const { DynamoDB, SecretsManager } = require('aws-sdk')
const axios = require('axios').default

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

const handler = async (event) => {
  const { patientInfo, careNotes, followUp, materials, datetime } = JSON.parse(event.body)
  let calendarEvent
  if (followUp && followUp.createCalendarEvent && process.env.INTEGRATE_TEAMUP_CALENDAR) {
    calendarEvent = await addFollowUpCalendarEvent(followUp)
  }
  const dynamoPutParams = {
    Item: {
      PatientInfo: {
        S: patientInfo,
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
    TableName: process.env.CARE_TABLE_NAME
  }

  try {
    await dbClient.putItem(dynamoPutParams).promise()
    return { status: 200 }
  } catch (e) {
    throw { status: 500, message: e.message }
  }
}

module.exports = {
  handler
}
