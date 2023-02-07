import {
    HEADER_TYPE,
    CHECK_SUM_URL,
    MEETING_DETAILS_URL,
    METHOD_TYPE_POST,
    METHOD_TYPE_GET,
    ADD_URL,
    GET_VERSION_DETAILS,
    GET_APPLICATION_DOWNLOAD_PATH
} from '../dhanush/constants';

let BASE_URL = '';
export const setBaseURL = (URL) => BASE_URL = URL;

export const POST = async (payload) => {
    return await fetch(`${BASE_URL}/${CHECK_SUM_URL}`, {
        method: METHOD_TYPE_POST,
        headers: HEADER_TYPE,
        body: JSON.stringify(payload),
    }).then(response => response.json());
}

export const GET = async (payload) => {
    return await fetch(`${BASE_URL}/${MEETING_DETAILS_URL}/${payload}`, {
        method: METHOD_TYPE_GET,
        headers: HEADER_TYPE,
    }).then(response => response.json());
}

export const ADD = async (meetingId, timeStamp) => {
    return await fetch(`${BASE_URL}/${ADD_URL}/${meetingId}/${timeStamp}`, {
        method: METHOD_TYPE_GET,
        headers: HEADER_TYPE,
    }).then(response => response.json());
}

export const GET_VERSION = async (version) => {
    return await fetch(`${BASE_URL}/${GET_VERSION_DETAILS}/${version}`, {
        method: METHOD_TYPE_GET,
        headers: HEADER_TYPE,
    }).then(response => response.json());
}

export const DOWNLOAD_APPLICATION = async () => {
    return await fetch(`${BASE_URL}/${GET_APPLICATION_DOWNLOAD_PATH}`, {
        method: METHOD_TYPE_GET,
        headers: HEADER_TYPE,
    }).then(response => response.json());
}
