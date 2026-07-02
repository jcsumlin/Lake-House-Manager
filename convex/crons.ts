import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
	"check-weather-all-properties",
	{ hours: 6 },
	internal.weather.checkAllProperties,
	{},
)

crons.cron(
	"pre-arrival-reminders",
	"0 8 * * *",
	internal.smartReminders.sweepUpcomingStays,
	{},
)

export default crons
