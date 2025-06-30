
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import 'dayjs/locale/zh-tw'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat) //依照使用者語系，自動顯示成對應格式的「日期」
dayjs.extend(isBetween) //判斷某個時間是否「介於兩個時間之間」
dayjs.extend(isSameOrAfter) //判斷某個時間是否「等於或晚於」另一個時間
dayjs.extend(isSameOrBefore)

dayjs.locale('zh-tw')

export default dayjs