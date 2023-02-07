// @flow

import Button from '@atlaskit/button';
import { FieldTextStateless } from '@atlaskit/field-text';
import Checkbox from '@atlaskit/checkbox';

import React, { Component, createRef } from 'react';
import { withTranslation } from 'react-i18next';
import { compose } from 'redux';
import type { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createConferenceObjectFromURL } from '../../utils';
import { SET_USER_DETAILS } from '../actionTypes';
import styles from '../styled/userinfo.css';
import { toast } from 'react-toastify';
import LoadingIndicator from '../styled/LoadingIndicator';
import Spinner from '@atlaskit/spinner/dist/cjs/Spinner';
import image_banner from '../../../images/logo_banner.png';
import { DOWNLOAD_APPLICATION, GET_VERSION, POST } from '../../dhanush/services';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import config from "../../config";
import moment from 'moment';

let isModerator = false;
type Props = {

    /**
     * Redux dispatch.
     */
    dispatch: Dispatch<*>;

    /**
     * React Router location object.
     */
    location: Object;

    /**
     * I18next translate function.
     */
    t: Function;
};

type State = {


};

/**
 * Welcome Component.
 */
class UserInfo extends Component<Props, State> {
    /**
     * Initializes a new {@code Welcome} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);
        this.countServerHit = 0;
        this.count = 0;
        this.sub;
        isModerator = ["host", "teacher"].includes(this.props.participantData.role.toLowerCase());
        const {
            username = '',
            password = '',
            mail = '',
            companyName = '',
            designation = '',
            mobileNumber = '',
            occupation = '',
            location = '',
            rememberMe = '',
        } = localStorage.userData ? JSON.parse(localStorage.userData) : {};
        this.state = {
            username: isModerator ? this.props.participantData.fullName : username,
            password,
            mail,
            companyName,
            designation,
            mobileNumber,
            occupation,
            location,
            rememberMe,
            checkMetingExist: false,
            showjoinMessage: false,
            isLoading: false,
            donloadURL: ''
        };

        this.usernameRef = createRef();
        this.passwordRef = createRef();
        this.emailRef = createRef();
        this.mobileRef = createRef();

        this._onChange = this._onChange.bind(this);
        this.joinMeeting = this.joinMeeting.bind(this);

    }

    getDeviceInfo = () => {
        let OS_TypeId = 0;
        const osInfo = [
            { id: 1, name: "Win", fullName: "Windows OS" },
            { id: 2, name: "Linux", fullName: "Linux OS" },
            { id: 3, name: "Mac", fullName: "Macintosh" },
            { id: 4, name: "Android", fullName: "Android OS" },
            { id: 5, name: "like Mac", fullName: "iOS" },
            // { id: 0, name: "Win", fullName: "Unknown OS" },
        ];

        for (let index = 0; index < osInfo.length; index++) {
            if (navigator.userAgent.indexOf(osInfo[index].name) != -1) {
                OS_TypeId = osInfo[index].id;
                break;
            }
        }

        return OS_TypeId;
    }

    downloadApplication = () => {
        DOWNLOAD_APPLICATION().then((response) => {
            this.setState({ donloadURL: response.data });
        }, (err) => {
            toast.error(err);
        });

        setTimeout(() => {
            const index = this.getDeviceInfo();
            if (index > 0) {
                // console.log(this.state.donloadURL + 'setup/download/' + index);
                window.location.href = `${this.state.donloadURL}setup/download/${index}`;
            }
        }, 500);
    }

    componentDidMount() {
        window.jitsiNodeAPI.ipc.send("ready-to-join");
        //auto updates implimented, so commented the below code
        // GET_VERSION(config.appVersion.replace(' - V', '')).then(data => {
        //     if (data.data) {
        //         let versionChanged = data.data.active;
        //         versionChanged && confirmAlert({
        //             title: 'Version Updates',
        //             // message: 'latest version is available, please download',
        //             message: <div style={{ marginTop: '10px', fontSize: '1rem' }}>After downloading, please uninstall the current version before installing the downloaded one.</div>,
        //             overlayClassName: "overlay-custom-class-name",
        //             closeOnEscape: false,
        //             closeOnClickOutside: false,
        //             buttons: [
        //                 {
        //                     label: 'Download',
        //                     onClick: () => this.downloadApplication()
        //                 },
        //                 {
        //                     label: 'Cancel',
        //                     onClick: () => console.log('clicked Cancel')
        //                 }
        //             ]
        //         });
        //     }
        // });
    }

    _onFormSubmit: (*) => void;

    /**
     * Prevents submission of the form and delegates the join logic.
     *
     * @param {Event} event - Event by which this function is called.
     * @returns {void}
     */
    _onFormSubmit(event: Event) {
        event.preventDefault();
    }

    joinMeeting: (*) => void;

    /**
     * Redirect and join conference.
     *
     * @returns {void}
     */
    joinMeeting() {
        if (this.state.rememberMe)
            localStorage.userData = JSON.stringify(this.state);
        else
            localStorage.removeItem('userData');

        if (!this.validate())
            return;

        // const conference = createConferenceObjectFromURL(this.props.meetingUrl);

        // // Don't navigate if conference couldn't be created
        // if (!conference) {
        //     return;
        // }

        // this.props.dispatch(push('/conference', conference));
        const platformInfo = {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.81 Safari/537.36",
            os: "Windows",
            browser: "Chrome",
            device: "Unknown",
            os_version: "windows-10",
            browser_version: "98.0.4758.81",
            deviceType: navigator.platform.startsWith("Mac") ? "Mac-APP" : "desktop-APP",
            orientation: "landscape"
        }
        const meetingRequest = {
            ...this.props.participantData,
            ...this.state,
            platformInfo: platformInfo,
            isElectron: true,
            fullName: this.state.username
        }
        delete meetingRequest.buttonTitle;
        delete meetingRequest.checkMetingExist;
        if (isModerator) {
            delete meetingRequest.passwordrequired;
            delete meetingRequest.password;
        }
        else {
            delete meetingRequest.userID;
            meetingRequest.loginparticipant = 'n';
        }
        this.saveAndJoinMetting(meetingRequest);
    }

    saveAndJoinMetting(sendData) {
        this.countServerHit++;
        POST(sendData).then((response) => {
            if (response.status === "OK" && response.message === "Checksum has generated") {
                clearInterval(this.sub);
                this.props.dispatch({
                    type: SET_USER_DETAILS,
                    userDetails: response.data.userInfo
                })
                const meetingURLParams = this.props.meetingUrl.split('/');
                const meetingId = meetingURLParams[meetingURLParams.length - 1];
                this.props.dispatch(push('/conference', meetingId));
            }
            else if (!response.data.validate && response.message == "The Host has not joined the session yet.!") {
                this.count++;
                this.setState({ checkMetingExist: false, showjoinMessage: true, isLoading: true });

                if (this.countServerHit === 50) {
                    clearInterval(this.sub);
                    this.countServerHit = 0;
                    this.setState({ isLoading: false })
                    toast.warn('Please try again');
                    window.location.reload;
                }
                if (this.count == 1) {
                    toast.info(response.message);
                    this.sub = setInterval(() => this.saveAndJoinMetting(sendData), 10000);
                }
            }
            else if (!response.data.validate) {
                toast.error(response.message);
            }
            console.log(response);
        }, (err) => { console.log(err); });
    }

    _onChange: (*) => void;
    /**
     * Keeps URL input value and URL in state in sync.
     *
     * @param {SyntheticInputEvent<HTMLInputElement>} event - Event by which
     * this function is called.
     * @returns {void}
     */
    _onChange(propertyName) {
        return ({ target: { value, checked } }) => this.setState({ ...this.state, [propertyName]: propertyName == 'rememberMe' ? checked : value.trim() });
    }

    renderLoadingIndicator() {
        return (
            <div className='center'>
                <LoadingIndicator>
                    <div>
                        <div><Spinner size='xlarge' /></div>
                        <div className='text-center ce'> You will join automatically when the meeting starts. </div>
                    </div>
                </LoadingIndicator>
            </div>
        );
    }

    handleKeyPress(e, type = '') {
        const { charCode } = e;

        if (type == 'mobileNumber')
            return ((charCode == 13) || (charCode > 47 && charCode < 58)) ? true : e.preventDefault();
        else
            return ((charCode == 13) || (charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123) || (charCode == 46) || (charCode == 32) || (charCode == 95)) ?
                true : e.preventDefault();
    }

    validate() {
        const { passwordrequired, emailRequired } = this.props.participantData;

        if (this.state.username.length == 0) {
            this.usernameRef.current.focus();
            toast.warn('Please enter username');
            return false;
        }
        else if (passwordrequired && this.state.password.length == 0) {
            this.passwordRef.current.focus();
            toast.warn('Please enter password');
            return false;
        }
        else if (emailRequired && this.state.mail.length == 0) {
            this.emailRef.current.focus();
            toast.warn('Please enter mail');
            return false;
        }
        else if (this.state.mail != "") {
            var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            if (!regex.test(this.state.mail.trim())) {
                this.emailRef.current.focus();
                toast.error("Please enter valid Email");
                return false;
            }
        }
        else if (this.state.mobileNumber != "" && this.state.mobileNumber.length < 10) {
            this.mobileRef.current.focus();
            toast.error("Please enter 10 digit mobile number.");
            return false;
        }
        return true;
    }


    /**
     * Render function of component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { participantData } = this.props;
        const isModerator = ["host", "teacher"].includes(participantData.role.toLowerCase());
        let startTime = participantData.startTime;
        let endTime = participantData.endTime;

        if (participantData.zoneId) {
            startTime = moment(participantData.startTimeWithTimeZone).format("LT");
            endTime = moment(participantData.endTimeWithTimeZone).format("LT");
        }

        return (
            this.state.isLoading ? this.renderLoadingIndicator() :
                <div>
                    <img src={image_banner} style={{ paddingTop: '2%', height: "100px" }} />
                    <div className='d-flex flex-column' style={{ position: 'absolute', top: '2%', right: '15%' }}>
                        <div className="d-flex">
                            <div className="p-2 fs-5"><label>Host Name:</label></div>
                            <div className="p-2 fs-5">{participantData.hostName}</div>
                        </div>
                        <div className="text-center">
                            <div title='Start time - End time'>{startTime} - {endTime}</div>
                            {participantData.repeatdisplay}
                        </div>
                    </div>
                    <div className='text-center fs-2'>
                        {participantData.meetingTitle}
                    </div>
                    <div className='container pt-5 '>
                        {/* <div className='card'> */}
                        {/* <div className='card-body'> */}
                        <form className="row g-3" onSubmit={this._onFormSubmit}>
                            <div className="row">
                                <div className="form-floating col-xl-4 mb-10">
                                    <input
                                        type="text"
                                        ref={this.usernameRef}
                                        value={this.state.username}
                                        className="form-control bg"
                                        id="username"
                                        onChange={this._onChange('username')}
                                        placeholder="Name"
                                        onKeyPress={(e) => this.handleKeyPress(e)}
                                        maxLength="20"
                                        autoFocus />
                                    <label className='pd1' htmlFor="username">Name <strong className="text-danger"> *</strong></label>
                                </div>
                                {!isModerator && participantData.passwordrequired && <div className="form-floating col-xl-4">
                                    <input type="password"
                                        ref={this.passwordRef}
                                        value={this.state.password}
                                        id="inputPassword"
                                        className="form-control bg"
                                        onChange={this._onChange('password')}
                                        placeholder="Password" maxLength="10" />
                                    <label className='pd1' htmlFor="inputPassword">Password<strong className="text-danger"> *</strong></label>
                                </div>}
                                {(participantData.emailRequired || !isModerator) && <div className="form-floating col-xl-4">
                                    <input
                                        type="text"
                                        value={this.state.mail}
                                        ref={this.emailRef}
                                        className="form-control bg"
                                        onChange={this._onChange('mail')}
                                        id="mail"
                                        maxLength="100"
                                        placeholder="Email" />
                                    <label className='pd1' htmlFor="mail">Email{participantData.emailRequired && <strong className="text-danger"> *</strong>}</label>
                                </div>}
                                <div className="form-floating col-xl-4">
                                    <input
                                        type="text"
                                        value={this.state.companyName}
                                        onKeyPress={(e) => this.handleKeyPress(e)}
                                        id="companyName"
                                        className="form-control bg"
                                        onChange={this._onChange('companyName')}
                                        maxLength="30"
                                        placeholder="Company Name" />
                                    <label className='pd1' htmlFor="companyName">Company Name </label>
                                </div>
                                <div className="form-floating col-xl-4">
                                    <input
                                        type="text"
                                        value={this.state.designation}
                                        onKeyPress={(e) => this.handleKeyPress(e)}
                                        className="form-control bg"
                                        id="designation"
                                        maxLength="30"
                                        onChange={this._onChange('designation')}
                                        placeholder="Designation" />
                                    <label className='pd1' htmlFor="designation">Designation </label>
                                </div>
                                {!isModerator && <div className="form-floating col-xl-4" >
                                    <input
                                        type="text"
                                        value={this.state.mobileNumber}
                                        ref={this.mobileRef}
                                        className="form-control bg"
                                        onChange={this._onChange('mobileNumber')}
                                        id="mobileNumber"
                                        maxLength="10"
                                        onKeyPress={(e) => this.handleKeyPress(e, 'mobileNumber')}
                                        placeholder="Mobile" />
                                    <label className='pd1' htmlFor="mobileNumber">Mobile</label>
                                </div >}
                                {!isModerator && <div className="form-floating col-xl-4" >
                                    <input
                                        type="text"
                                        value={this.state.occupation}
                                        className="form-control bg"
                                        id="occupation"
                                        onChange={this._onChange('occupation')}
                                        onKeyPress={(e) => this.handleKeyPress(e)}
                                        maxLength="30"
                                        placeholder="Occupation" />
                                    <label className='pd1' htmlFor="occupation">Occupation</label>
                                </div >}
                                {!isModerator && <div className="form-floating col-xl-4" >
                                    <input
                                        type="text"
                                        value={this.state.location}
                                        className="form-control bg"
                                        id="location"
                                        onChange={this._onChange('location')}
                                        onKeyPress={(e) => this.handleKeyPress(e)}
                                        maxLength="30"
                                        placeholder="Location" />
                                    <label className='pd1' htmlFor="location">Location </label>
                                </div >}
                            </div >
                            <div><div className="form-check">
                                <input className="form-check-input" checked={this.state.rememberMe || false} onChange={this._onChange('rememberMe')} type="checkbox" id="flexCheckChecked" />
                                <label className="form-check-label" htmlFor="flexCheckChecked">
                                    Remember Me
                                </label>
                            </div>
                            </div>
                            <div className='text-center'>
                                <button
                                    className='btn btn-primary text-white'
                                    onClick={this.joinMeeting}
                                    type='submit'>
                                    {participantData.buttonTitle}
                                </button>
                            </div>

                        </form >
                    </div>
                </div>
            // </div >
            // </div>
        );
    }
}
/**
 * Maps (parts of) the redux state to the React props.
 *
 * @param {Object} state - The redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object) {
    return {
        participantData: state.welcome.participantData,
        meetingUrl: state.welcome.meetingURL,
    };
}

export default compose(connect(_mapStateToProps), withTranslation())(UserInfo);
