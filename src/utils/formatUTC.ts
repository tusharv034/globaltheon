import moment from "moment";
const DATE_FORMAT = "DD MMM YYYY";

const parseDate = (arg, inputFormat = "YYYY-MM-DD") =>
    // arg ? moment(arg, inputFormat).format(DATE_FORMAT) : "-";
    arg ? moment.utc(arg, inputFormat).format(DATE_FORMAT) : "-";
// arg ? moment.utc(arg, inputFormat).tz("America/New_York").format(DATE_FORMAT) : "-";


export default parseDate;