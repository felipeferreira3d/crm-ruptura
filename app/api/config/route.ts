import {configured,json} from "@/lib/server";
export const dynamic="force-dynamic";
export function GET(){return json({configured:configured(),calendarConfigured:!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.TOKEN_ENCRYPTION_KEY&&process.env.APP_URL)})}
